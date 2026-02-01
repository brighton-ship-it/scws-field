const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const adapter = new FileSync('db.json');
const db = low(adapter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize database with full schema
db.defaults({
    customers: [],
    jobs: [],
    quotes: [],
    invoices: [],
    invoice_items: [],
    payments: [],
    products: [],           // Service/product catalog
    team: [],               // Team members
    time_entries: [],       // Time tracking
    expenses: [],           // Job expenses
    notes: [],              // Notes & attachments
    checklists: [],         // Job checklists
    checklist_templates: [],
    reminders: [],          // Automated reminders
    messages: [],           // SMS/email messages
    requests: [],           // Online booking requests
    recurring_jobs: [],     // Recurring schedules
    tags: [],               // Customer/job tags
    settings: {
        company_name: 'Southern California Well Service',
        company_phone: '(760) 440-8520',
        company_email: 'brighton@scwellservice.com',
        company_address: '1077 Main St, Ramona, CA 92065',
        tax_rate: '7.75',
        invoice_prefix: 'SCWS-',
        quote_prefix: 'Q-',
        default_job_length: 2,
        business_hours_start: '07:00',
        business_hours_end: '17:00',
        booking_enabled: true
    },
    _counters: {}
}).write();

// Helper functions
function nextId(collection) {
    const counter = db.get('_counters').value();
    counter[collection] = (counter[collection] || 0) + 1;
    db.set('_counters', counter).write();
    return counter[collection];
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ============================================
// CUSTOMERS API (Enhanced)
// ============================================
app.get('/api/customers', (req, res) => {
    const { search, tag, sort = 'name' } = req.query;
    let customers = db.get('customers').value();
    
    if (search) {
        const s = search.toLowerCase();
        customers = customers.filter(c => 
            c.name?.toLowerCase().includes(s) ||
            c.phone?.includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.address?.toLowerCase().includes(s)
        );
    }
    
    if (tag) {
        customers = customers.filter(c => c.tags?.includes(tag));
    }
    
    // Add computed fields
    const jobs = db.get('jobs').value();
    const invoices = db.get('invoices').value();
    
    customers = customers.map(c => ({
        ...c,
        total_jobs: jobs.filter(j => j.customer_id === c.id).length,
        total_spent: invoices.filter(i => i.customer_id === c.id && i.status === 'paid')
            .reduce((sum, i) => sum + (i.total || 0), 0),
        outstanding: invoices.filter(i => i.customer_id === c.id && i.status !== 'paid')
            .reduce((sum, i) => sum + (i.total || 0), 0)
    }));
    
    customers.sort((a, b) => (a[sort] || '').toString().localeCompare((b[sort] || '').toString()));
    res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
    const customer = db.get('customers').find({ id: parseInt(req.params.id) }).value();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    customer.jobs = db.get('jobs').filter({ customer_id: customer.id }).sortBy('scheduled_date').reverse().value();
    customer.quotes = db.get('quotes').filter({ customer_id: customer.id }).sortBy('created_at').reverse().value();
    customer.invoices = db.get('invoices').filter({ customer_id: customer.id }).sortBy('created_at').reverse().value();
    customer.notes = db.get('notes').filter({ customer_id: customer.id }).sortBy('created_at').reverse().value();
    customer.properties = customer.properties || [{ address: customer.address, city: customer.city, zip: customer.zip, is_primary: true }];
    res.json(customer);
});

app.post('/api/customers', (req, res) => {
    const customer = {
        id: nextId('customers'),
        ...req.body,
        portal_token: generateToken(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db.get('customers').push(customer).write();
    res.json(customer);
});

app.put('/api/customers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('customers').find({ id }).assign({ ...req.body, updated_at: new Date().toISOString() }).write();
    res.json({ id, ...req.body });
});

app.delete('/api/customers/:id', (req, res) => {
    db.get('customers').remove({ id: parseInt(req.params.id) }).write();
    res.json({ success: true });
});

// ============================================
// QUOTES/ESTIMATES API
// ============================================
app.get('/api/quotes', (req, res) => {
    const { status, customer_id } = req.query;
    let quotes = db.get('quotes').value();
    
    if (status) quotes = quotes.filter(q => q.status === status);
    if (customer_id) quotes = quotes.filter(q => q.customer_id === parseInt(customer_id));
    
    const customers = db.get('customers').value();
    quotes = quotes.map(q => ({
        ...q,
        customer_name: customers.find(c => c.id === q.customer_id)?.name
    }));
    
    quotes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(quotes);
});

app.get('/api/quotes/:id', (req, res) => {
    const quote = db.get('quotes').find({ id: parseInt(req.params.id) }).value();
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    const customer = db.get('customers').find({ id: quote.customer_id }).value() || {};
    quote.customer = customer;
    quote.items = quote.items || [];
    res.json(quote);
});

app.post('/api/quotes', (req, res) => {
    const count = db.get('quotes').size().value();
    const prefix = db.get('settings.quote_prefix').value() || 'Q-';
    
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = parseFloat(db.get('settings.tax_rate').value() || 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    const quote = {
        id: nextId('quotes'),
        quote_number: `${prefix}${String(count + 1).padStart(4, '0')}`,
        customer_id: parseInt(req.body.customer_id),
        title: req.body.title,
        description: req.body.description,
        items,
        subtotal,
        tax,
        total,
        valid_until: req.body.valid_until,
        status: 'draft', // draft, sent, accepted, declined, expired
        created_at: new Date().toISOString()
    };
    
    db.get('quotes').push(quote).write();
    res.json(quote);
});

app.put('/api/quotes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = parseFloat(db.get('settings.tax_rate').value() || 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    db.get('quotes').find({ id }).assign({ 
        ...req.body, 
        items, 
        subtotal, 
        tax, 
        total,
        updated_at: new Date().toISOString() 
    }).write();
    res.json({ success: true });
});

app.post('/api/quotes/:id/convert', (req, res) => {
    const quote = db.get('quotes').find({ id: parseInt(req.params.id) }).value();
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    // Create job from quote
    const job = {
        id: nextId('jobs'),
        customer_id: quote.customer_id,
        quote_id: quote.id,
        title: quote.title,
        description: quote.description,
        status: 'scheduled',
        scheduled_date: req.body.scheduled_date,
        scheduled_time: req.body.scheduled_time,
        assigned_to: req.body.assigned_to,
        estimated_total: quote.total,
        line_items: quote.items,
        created_at: new Date().toISOString()
    };
    
    db.get('jobs').push(job).write();
    db.get('quotes').find({ id: quote.id }).assign({ status: 'accepted', converted_job_id: job.id }).write();
    
    res.json({ job_id: job.id });
});

// ============================================
// JOBS API (Enhanced)
// ============================================
app.get('/api/jobs', (req, res) => {
    const { status, date, start_date, end_date, assigned_to, customer_id } = req.query;
    let jobs = db.get('jobs').value();
    
    if (status) jobs = jobs.filter(j => j.status === status);
    if (date) jobs = jobs.filter(j => j.scheduled_date === date);
    if (start_date) jobs = jobs.filter(j => j.scheduled_date >= start_date);
    if (end_date) jobs = jobs.filter(j => j.scheduled_date <= end_date);
    if (assigned_to) jobs = jobs.filter(j => j.assigned_to === assigned_to);
    if (customer_id) jobs = jobs.filter(j => j.customer_id === parseInt(customer_id));
    
    const customers = db.get('customers').value();
    const timeEntries = db.get('time_entries').value();
    
    jobs = jobs.map(j => {
        const customer = customers.find(c => c.id === j.customer_id) || {};
        const entries = timeEntries.filter(t => t.job_id === j.id);
        const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
        
        return {
            ...j,
            customer_name: customer.name,
            customer_address: customer.address || j.service_address,
            customer_phone: customer.phone,
            customer_email: customer.email,
            logged_hours: Math.round(totalMinutes / 60 * 10) / 10
        };
    });
    
    jobs.sort((a, b) => {
        const dateCompare = (a.scheduled_date || '').localeCompare(b.scheduled_date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.scheduled_time || '').localeCompare(b.scheduled_time || '');
    });
    
    res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
    const job = db.get('jobs').find({ id: parseInt(req.params.id) }).value();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    const customer = db.get('customers').find({ id: job.customer_id }).value() || {};
    job.customer = customer;
    job.time_entries = db.get('time_entries').filter({ job_id: job.id }).value();
    job.expenses = db.get('expenses').filter({ job_id: job.id }).value();
    job.notes = db.get('notes').filter({ job_id: job.id }).sortBy('created_at').reverse().value();
    job.checklist = db.get('checklists').find({ job_id: job.id }).value();
    
    res.json(job);
});

app.post('/api/jobs', (req, res) => {
    const job = {
        id: nextId('jobs'),
        ...req.body,
        customer_id: parseInt(req.body.customer_id) || null,
        status: req.body.status || 'scheduled',
        created_at: new Date().toISOString()
    };
    db.get('jobs').push(job).write();
    res.json(job);
});

app.put('/api/jobs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.customer_id) updates.customer_id = parseInt(updates.customer_id);
    
    // If completing, set completed_at
    if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
    }
    
    db.get('jobs').find({ id }).assign(updates).write();
    res.json({ id, ...updates });
});

app.delete('/api/jobs/:id', (req, res) => {
    db.get('jobs').remove({ id: parseInt(req.params.id) }).write();
    res.json({ success: true });
});

// ============================================
// TIME TRACKING API
// ============================================
app.get('/api/time', (req, res) => {
    const { job_id, team_member, date } = req.query;
    let entries = db.get('time_entries').value();
    
    if (job_id) entries = entries.filter(e => e.job_id === parseInt(job_id));
    if (team_member) entries = entries.filter(e => e.team_member === team_member);
    if (date) entries = entries.filter(e => e.date === date);
    
    res.json(entries);
});

app.post('/api/time/clock-in', (req, res) => {
    const entry = {
        id: nextId('time_entries'),
        job_id: parseInt(req.body.job_id),
        team_member: req.body.team_member,
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString(),
        clock_out: null,
        duration_minutes: null,
        notes: req.body.notes
    };
    db.get('time_entries').push(entry).write();
    
    // Update job status to in_progress
    db.get('jobs').find({ id: entry.job_id }).assign({ status: 'in_progress' }).write();
    
    res.json(entry);
});

app.post('/api/time/clock-out', (req, res) => {
    const entry = db.get('time_entries').find({ id: parseInt(req.body.entry_id) }).value();
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });
    
    const clockOut = new Date();
    const clockIn = new Date(entry.clock_in);
    const durationMinutes = Math.round((clockOut - clockIn) / 1000 / 60);
    
    db.get('time_entries').find({ id: entry.id }).assign({
        clock_out: clockOut.toISOString(),
        duration_minutes: durationMinutes
    }).write();
    
    res.json({ duration_minutes: durationMinutes });
});

app.post('/api/time', (req, res) => {
    const entry = {
        id: nextId('time_entries'),
        job_id: parseInt(req.body.job_id),
        team_member: req.body.team_member,
        date: req.body.date,
        duration_minutes: req.body.duration_minutes,
        notes: req.body.notes,
        created_at: new Date().toISOString()
    };
    db.get('time_entries').push(entry).write();
    res.json(entry);
});

// ============================================
// EXPENSES API
// ============================================
app.get('/api/expenses', (req, res) => {
    const { job_id } = req.query;
    let expenses = db.get('expenses').value();
    if (job_id) expenses = expenses.filter(e => e.job_id === parseInt(job_id));
    res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
    const expense = {
        id: nextId('expenses'),
        job_id: parseInt(req.body.job_id),
        description: req.body.description,
        amount: parseFloat(req.body.amount),
        category: req.body.category,
        date: req.body.date || new Date().toISOString().split('T')[0],
        receipt_url: req.body.receipt_url,
        reimbursable: req.body.reimbursable || false,
        created_at: new Date().toISOString()
    };
    db.get('expenses').push(expense).write();
    res.json(expense);
});

// ============================================
// INVOICES API (Enhanced)
// ============================================
app.get('/api/invoices', (req, res) => {
    const { status, customer_id } = req.query;
    let invoices = db.get('invoices').value();
    
    if (status) invoices = invoices.filter(i => i.status === status);
    if (customer_id) invoices = invoices.filter(i => i.customer_id === parseInt(customer_id));
    
    const customers = db.get('customers').value();
    invoices = invoices.map(inv => ({
        ...inv,
        customer_name: customers.find(c => c.id === inv.customer_id)?.name
    }));
    
    invoices.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(invoices);
});

app.get('/api/invoices/:id', (req, res) => {
    const invoice = db.get('invoices').find({ id: parseInt(req.params.id) }).value();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const customer = db.get('customers').find({ id: invoice.customer_id }).value() || {};
    invoice.customer = customer;
    invoice.items = invoice.items || db.get('invoice_items').filter({ invoice_id: invoice.id }).value();
    invoice.payments = db.get('payments').filter({ invoice_id: invoice.id }).value();
    
    res.json(invoice);
});

app.post('/api/invoices', (req, res) => {
    const count = db.get('invoices').size().value();
    const prefix = db.get('settings.invoice_prefix').value() || 'INV-';
    
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = parseFloat(db.get('settings.tax_rate').value() || 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    const invoice = {
        id: nextId('invoices'),
        invoice_number: `${prefix}${String(count + 1).padStart(4, '0')}`,
        job_id: req.body.job_id ? parseInt(req.body.job_id) : null,
        customer_id: parseInt(req.body.customer_id),
        items,
        subtotal,
        tax,
        total,
        amount_paid: 0,
        balance_due: total,
        notes: req.body.notes,
        due_date: req.body.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'draft',
        created_at: new Date().toISOString()
    };
    
    db.get('invoices').push(invoice).write();
    res.json(invoice);
});

app.post('/api/invoices/:id/send', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('invoices').find({ id }).assign({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
    }).write();
    
    // TODO: Actually send email
    res.json({ success: true, message: 'Invoice marked as sent' });
});

// ============================================
// PAYMENTS API
// ============================================
app.post('/api/payments', (req, res) => {
    const invoice = db.get('invoices').find({ id: parseInt(req.body.invoice_id) }).value();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const payment = {
        id: nextId('payments'),
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: parseFloat(req.body.amount),
        method: req.body.method, // cash, check, card, other
        reference: req.body.reference,
        date: req.body.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
    };
    
    db.get('payments').push(payment).write();
    
    // Update invoice
    const totalPaid = db.get('payments').filter({ invoice_id: invoice.id }).value()
        .reduce((sum, p) => sum + p.amount, 0) + payment.amount;
    const balanceDue = invoice.total - totalPaid;
    const status = balanceDue <= 0 ? 'paid' : 'partial';
    
    db.get('invoices').find({ id: invoice.id }).assign({
        amount_paid: totalPaid,
        balance_due: balanceDue,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null
    }).write();
    
    res.json(payment);
});

// ============================================
// PRODUCTS/SERVICES CATALOG
// ============================================
app.get('/api/products', (req, res) => {
    res.json(db.get('products').value());
});

app.post('/api/products', (req, res) => {
    const product = {
        id: nextId('products'),
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        unit: req.body.unit || 'each',
        category: req.body.category,
        is_taxable: req.body.is_taxable !== false,
        active: true,
        created_at: new Date().toISOString()
    };
    db.get('products').push(product).write();
    res.json(product);
});

app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('products').find({ id }).assign(req.body).write();
    res.json({ success: true });
});

// ============================================
// TEAM MANAGEMENT
// ============================================
app.get('/api/team', (req, res) => {
    res.json(db.get('team').value());
});

app.post('/api/team', (req, res) => {
    const member = {
        id: nextId('team'),
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        role: req.body.role || 'technician',
        color: req.body.color || '#3b82f6',
        hourly_rate: parseFloat(req.body.hourly_rate) || 0,
        active: true,
        created_at: new Date().toISOString()
    };
    db.get('team').push(member).write();
    res.json(member);
});

app.put('/api/team/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('team').find({ id }).assign(req.body).write();
    res.json({ success: true });
});

// ============================================
// NOTES & ATTACHMENTS
// ============================================
app.post('/api/notes', (req, res) => {
    const note = {
        id: nextId('notes'),
        job_id: req.body.job_id ? parseInt(req.body.job_id) : null,
        customer_id: req.body.customer_id ? parseInt(req.body.customer_id) : null,
        content: req.body.content,
        type: req.body.type || 'note', // note, photo, document
        attachment_url: req.body.attachment_url,
        created_by: req.body.created_by,
        created_at: new Date().toISOString()
    };
    db.get('notes').push(note).write();
    res.json(note);
});

// ============================================
// CHECKLISTS
// ============================================
app.get('/api/checklist-templates', (req, res) => {
    res.json(db.get('checklist_templates').value());
});

app.post('/api/checklist-templates', (req, res) => {
    const template = {
        id: nextId('checklist_templates'),
        name: req.body.name,
        job_type: req.body.job_type,
        items: req.body.items || [],
        created_at: new Date().toISOString()
    };
    db.get('checklist_templates').push(template).write();
    res.json(template);
});

app.post('/api/jobs/:id/checklist', (req, res) => {
    const jobId = parseInt(req.params.id);
    const existing = db.get('checklists').find({ job_id: jobId }).value();
    
    if (existing) {
        db.get('checklists').find({ job_id: jobId }).assign({ items: req.body.items }).write();
        return res.json({ success: true });
    }
    
    const checklist = {
        id: nextId('checklists'),
        job_id: jobId,
        items: req.body.items || [],
        created_at: new Date().toISOString()
    };
    db.get('checklists').push(checklist).write();
    res.json(checklist);
});

// ============================================
// ONLINE BOOKING / CLIENT REQUESTS
// ============================================
app.get('/api/requests', (req, res) => {
    const { status } = req.query;
    let requests = db.get('requests').value();
    if (status) requests = requests.filter(r => r.status === status);
    requests.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(requests);
});

app.post('/api/requests', (req, res) => {
    const request = {
        id: nextId('requests'),
        customer_name: req.body.name,
        customer_phone: req.body.phone,
        customer_email: req.body.email,
        address: req.body.address,
        service_type: req.body.service_type,
        description: req.body.description,
        preferred_date: req.body.preferred_date,
        preferred_time: req.body.preferred_time,
        status: 'new', // new, contacted, scheduled, declined
        source: req.body.source || 'website',
        created_at: new Date().toISOString()
    };
    db.get('requests').push(request).write();
    res.json(request);
});

app.post('/api/requests/:id/convert', (req, res) => {
    const request = db.get('requests').find({ id: parseInt(req.params.id) }).value();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // Create or find customer
    let customer = db.get('customers').find({ phone: request.customer_phone }).value();
    if (!customer) {
        customer = {
            id: nextId('customers'),
            name: request.customer_name,
            phone: request.customer_phone,
            email: request.customer_email,
            address: request.address,
            source: 'online_booking',
            created_at: new Date().toISOString()
        };
        db.get('customers').push(customer).write();
    }
    
    // Create job
    const job = {
        id: nextId('jobs'),
        customer_id: customer.id,
        request_id: request.id,
        title: request.service_type,
        description: request.description,
        service_address: request.address,
        scheduled_date: req.body.scheduled_date || request.preferred_date,
        scheduled_time: req.body.scheduled_time || request.preferred_time,
        assigned_to: req.body.assigned_to,
        status: 'scheduled',
        created_at: new Date().toISOString()
    };
    db.get('jobs').push(job).write();
    
    // Update request
    db.get('requests').find({ id: request.id }).assign({ 
        status: 'scheduled', 
        customer_id: customer.id,
        job_id: job.id 
    }).write();
    
    res.json({ customer_id: customer.id, job_id: job.id });
});

// ============================================
// RECURRING JOBS
// ============================================
app.get('/api/recurring', (req, res) => {
    const recurring = db.get('recurring_jobs').value();
    const customers = db.get('customers').value();
    
    const result = recurring.map(r => ({
        ...r,
        customer_name: customers.find(c => c.id === r.customer_id)?.name
    }));
    
    res.json(result);
});

app.post('/api/recurring', (req, res) => {
    const recurring = {
        id: nextId('recurring_jobs'),
        customer_id: parseInt(req.body.customer_id),
        title: req.body.title,
        description: req.body.description,
        job_type: req.body.job_type,
        frequency: req.body.frequency, // weekly, biweekly, monthly, quarterly, annually
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        assigned_to: req.body.assigned_to,
        estimated_hours: req.body.estimated_hours,
        line_items: req.body.line_items || [],
        active: true,
        last_generated: null,
        created_at: new Date().toISOString()
    };
    db.get('recurring_jobs').push(recurring).write();
    res.json(recurring);
});

// ============================================
// REPORTING / DASHBOARD
// ============================================
app.get('/api/dashboard', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const startOfWeek = new Date(Date.now() - new Date().getDay() * 24*60*60*1000).toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const jobs = db.get('jobs').value();
    const customers = db.get('customers').value();
    const invoices = db.get('invoices').value();
    const quotes = db.get('quotes').value();
    const requests = db.get('requests').value();
    
    const todaysJobs = jobs
        .filter(j => j.scheduled_date === today)
        .map(j => {
            const customer = customers.find(c => c.id === j.customer_id) || {};
            return { ...j, customer_name: customer.name, customer_address: customer.address, customer_phone: customer.phone };
        })
        .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
    
    const stats = {
        total_customers: customers.length,
        jobs_today: todaysJobs.length,
        jobs_this_week: jobs.filter(j => j.scheduled_date >= today && j.scheduled_date <= weekFromNow).length,
        jobs_in_progress: jobs.filter(j => j.status === 'in_progress').length,
        pending_quotes: quotes.filter(q => q.status === 'sent').length,
        pending_invoices: invoices.filter(inv => ['draft', 'sent'].includes(inv.status)).length,
        overdue_invoices: invoices.filter(inv => inv.status === 'sent' && inv.due_date < today).length,
        new_requests: requests.filter(r => r.status === 'new').length,
        revenue_this_month: invoices
            .filter(inv => inv.status === 'paid' && inv.paid_at >= startOfMonth)
            .reduce((sum, inv) => sum + (inv.total || 0), 0),
        revenue_this_week: invoices
            .filter(inv => inv.status === 'paid' && inv.paid_at >= startOfWeek)
            .reduce((sum, inv) => sum + (inv.total || 0), 0),
        outstanding_balance: invoices
            .filter(inv => ['sent', 'partial'].includes(inv.status))
            .reduce((sum, inv) => sum + (inv.balance_due || 0), 0)
    };
    
    res.json({ todaysJobs, stats });
});

app.get('/api/reports/revenue', (req, res) => {
    const { start_date, end_date, group_by = 'day' } = req.query;
    const invoices = db.get('invoices').filter(i => i.status === 'paid').value();
    
    // Group revenue by period
    const revenue = {};
    invoices.forEach(inv => {
        if (inv.paid_at) {
            let key;
            if (group_by === 'month') {
                key = inv.paid_at.substring(0, 7);
            } else if (group_by === 'week') {
                const d = new Date(inv.paid_at);
                const week = Math.ceil(d.getDate() / 7);
                key = `${inv.paid_at.substring(0, 7)}-W${week}`;
            } else {
                key = inv.paid_at.split('T')[0];
            }
            revenue[key] = (revenue[key] || 0) + inv.total;
        }
    });
    
    res.json(revenue);
});

app.get('/api/reports/jobs', (req, res) => {
    const { start_date, end_date } = req.query;
    let jobs = db.get('jobs').value();
    
    if (start_date) jobs = jobs.filter(j => j.scheduled_date >= start_date);
    if (end_date) jobs = jobs.filter(j => j.scheduled_date <= end_date);
    
    const byStatus = {};
    const byType = {};
    const byTechnician = {};
    
    jobs.forEach(j => {
        byStatus[j.status] = (byStatus[j.status] || 0) + 1;
        if (j.job_type) byType[j.job_type] = (byType[j.job_type] || 0) + 1;
        if (j.assigned_to) byTechnician[j.assigned_to] = (byTechnician[j.assigned_to] || 0) + 1;
    });
    
    res.json({ total: jobs.length, byStatus, byType, byTechnician });
});

// ============================================
// SETTINGS API
// ============================================
app.get('/api/settings', (req, res) => {
    res.json(db.get('settings').value());
});

app.put('/api/settings', (req, res) => {
    db.get('settings').assign(req.body).write();
    res.json({ success: true });
});

// ============================================
// CLIENT PORTAL (Public endpoints)
// ============================================
app.get('/api/portal/:token', (req, res) => {
    const customer = db.get('customers').find({ portal_token: req.params.token }).value();
    if (!customer) return res.status(404).json({ error: 'Invalid portal link' });
    
    const jobs = db.get('jobs').filter({ customer_id: customer.id }).value();
    const invoices = db.get('invoices').filter({ customer_id: customer.id }).value();
    const quotes = db.get('quotes').filter({ customer_id: customer.id }).value();
    
    res.json({
        customer: { name: customer.name, email: customer.email, phone: customer.phone },
        upcoming_jobs: jobs.filter(j => j.status === 'scheduled').slice(0, 5),
        past_jobs: jobs.filter(j => j.status === 'completed').slice(0, 10),
        pending_invoices: invoices.filter(i => i.status !== 'paid'),
        pending_quotes: quotes.filter(q => q.status === 'sent')
    });
});

// Public booking form
app.get('/api/booking/settings', (req, res) => {
    const settings = db.get('settings').value();
    if (!settings.booking_enabled) {
        return res.status(403).json({ error: 'Online booking is disabled' });
    }
    
    res.json({
        company_name: settings.company_name,
        company_phone: settings.company_phone,
        business_hours_start: settings.business_hours_start,
        business_hours_end: settings.business_hours_end,
        service_types: ['Pump Repair', 'Pump Installation', 'Well Inspection', 'Well Drilling', 'Maintenance', 'Emergency Service']
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SCWS Field Service running on http://localhost:${PORT}`);
});
