const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const cors = require('cors');
const path = require('path');

const app = express();
const adapter = new FileSync('db.json');
const db = low(adapter);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database with defaults
db.defaults({
    customers: [],
    jobs: [],
    invoices: [],
    invoice_items: [],
    settings: {
        company_name: 'Southern California Well Service',
        company_phone: '(760) 440-8520',
        company_email: 'brighton@scwellservice.com',
        company_address: '1077 Main St, Ramona, CA 92065',
        tax_rate: '7.75',
        invoice_prefix: 'SCWS-'
    },
    _counters: { customers: 0, jobs: 0, invoices: 0 }
}).write();

// Helper to generate IDs
function nextId(collection) {
    const counter = db.get('_counters').value();
    counter[collection] = (counter[collection] || 0) + 1;
    db.set('_counters', counter).write();
    return counter[collection];
}

// ============ CUSTOMERS API ============
app.get('/api/customers', (req, res) => {
    const search = (req.query.search || '').toLowerCase();
    let customers = db.get('customers').value();
    if (search) {
        customers = customers.filter(c => 
            c.name?.toLowerCase().includes(search) ||
            c.phone?.toLowerCase().includes(search) ||
            c.address?.toLowerCase().includes(search) ||
            c.city?.toLowerCase().includes(search)
        );
    }
    customers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
    const customer = db.get('customers').find({ id: parseInt(req.params.id) }).value();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    customer.jobs = db.get('jobs').filter({ customer_id: customer.id }).sortBy('scheduled_date').reverse().value();
    customer.invoices = db.get('invoices').filter({ customer_id: customer.id }).sortBy('created_at').reverse().value();
    res.json(customer);
});

app.post('/api/customers', (req, res) => {
    const customer = {
        id: nextId('customers'),
        ...req.body,
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

// ============ JOBS API ============
app.get('/api/jobs', (req, res) => {
    const { status, date } = req.query;
    let jobs = db.get('jobs').value();
    
    if (status) jobs = jobs.filter(j => j.status === status);
    if (date) jobs = jobs.filter(j => j.scheduled_date === date);
    
    // Join customer info
    const customers = db.get('customers').value();
    jobs = jobs.map(j => {
        const customer = customers.find(c => c.id === j.customer_id) || {};
        return {
            ...j,
            customer_name: customer.name,
            customer_address: customer.address,
            customer_phone: customer.phone
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
    res.json({
        ...job,
        customer_name: customer.name,
        customer_address: customer.address,
        customer_phone: customer.phone,
        customer_email: customer.email
    });
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
    const updates = { ...req.body };
    if (updates.customer_id) updates.customer_id = parseInt(updates.customer_id);
    db.get('jobs').find({ id }).assign(updates).write();
    res.json({ id, ...updates });
});

app.delete('/api/jobs/:id', (req, res) => {
    db.get('jobs').remove({ id: parseInt(req.params.id) }).write();
    res.json({ success: true });
});

// ============ INVOICES API ============
app.get('/api/invoices', (req, res) => {
    let invoices = db.get('invoices').value();
    const customers = db.get('customers').value();
    
    invoices = invoices.map(inv => {
        const customer = customers.find(c => c.id === inv.customer_id) || {};
        return { ...inv, customer_name: customer.name };
    });
    
    invoices.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(invoices);
});

app.get('/api/invoices/:id', (req, res) => {
    const invoice = db.get('invoices').find({ id: parseInt(req.params.id) }).value();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const customer = db.get('customers').find({ id: invoice.customer_id }).value() || {};
    const items = db.get('invoice_items').filter({ invoice_id: invoice.id }).value();
    
    res.json({
        ...invoice,
        customer_name: customer.name,
        customer_address: customer.address,
        customer_email: customer.email,
        customer_phone: customer.phone,
        items
    });
});

app.post('/api/invoices', (req, res) => {
    const { job_id, customer_id, items, notes } = req.body;
    
    // Generate invoice number
    const count = db.get('invoices').size().value();
    const prefix = db.get('settings.invoice_prefix').value() || 'INV-';
    const invoice_number = `${prefix}${String(count + 1).padStart(4, '0')}`;
    
    // Calculate totals
    const subtotal = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
    const taxRate = parseFloat(db.get('settings.tax_rate').value() || 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    const invoice = {
        id: nextId('invoices'),
        job_id: job_id ? parseInt(job_id) : null,
        customer_id: parseInt(customer_id),
        invoice_number,
        status: 'draft',
        subtotal,
        tax,
        total,
        notes,
        created_at: new Date().toISOString()
    };
    
    db.get('invoices').push(invoice).write();
    
    // Insert items
    if (items?.length) {
        const invoiceItems = db.get('invoice_items');
        for (const item of items) {
            invoiceItems.push({
                id: Date.now() + Math.random(),
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.quantity * item.unit_price
            }).write();
        }
    }
    
    res.json({ id: invoice.id, invoice_number, subtotal, tax, total });
});

app.put('/api/invoices/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updates = { status };
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    
    db.get('invoices').find({ id }).assign(updates).write();
    res.json({ success: true });
});

// ============ DASHBOARD API ============
app.get('/api/dashboard', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const jobs = db.get('jobs').value();
    const customers = db.get('customers').value();
    const invoices = db.get('invoices').value();
    
    const todaysJobs = jobs
        .filter(j => j.scheduled_date === today)
        .map(j => {
            const customer = customers.find(c => c.id === j.customer_id) || {};
            return { ...j, customer_name: customer.name, customer_address: customer.address };
        })
        .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
    
    const stats = {
        total_customers: customers.length,
        jobs_today: todaysJobs.length,
        jobs_this_week: jobs.filter(j => j.scheduled_date >= today && j.scheduled_date <= weekFromNow).length,
        pending_invoices: invoices.filter(inv => ['draft', 'sent'].includes(inv.status)).length,
        revenue_this_month: invoices
            .filter(inv => inv.status === 'paid' && inv.paid_at >= startOfMonth)
            .reduce((sum, inv) => sum + (inv.total || 0), 0)
    };
    
    res.json({ todaysJobs, stats });
});

// ============ SETTINGS API ============
app.get('/api/settings', (req, res) => {
    res.json(db.get('settings').value());
});

app.put('/api/settings', (req, res) => {
    db.get('settings').assign(req.body).write();
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SCWS Field Service running on http://localhost:${PORT}`);
});
