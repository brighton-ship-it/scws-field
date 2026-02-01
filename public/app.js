// API endpoint - use local server for dev, or your hosted server for production
const API = window.location.hostname === 'localhost' ? '' : 'https://api.scwellservice.com';

// Navigation
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.closest('[data-page]').dataset.page;
        showPage(page);
    });
});

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    
    // Load page data
    switch(page) {
        case 'dashboard': loadDashboard(); break;
        case 'jobs': loadJobs(); break;
        case 'customers': loadCustomers(); break;
        case 'invoices': loadInvoices(); break;
        case 'calendar': loadCalendar(); break;
        case 'settings': loadSettings(); break;
    }
}

// ============ DASHBOARD ============
async function loadDashboard() {
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    try {
        const res = await fetch(`${API}/api/dashboard`);
        const data = await res.json();
        
        document.getElementById('stat-jobs-today').textContent = data.stats.jobs_today;
        document.getElementById('stat-jobs-week').textContent = data.stats.jobs_this_week;
        document.getElementById('stat-customers').textContent = data.stats.total_customers;
        document.getElementById('stat-revenue').textContent = `$${data.stats.revenue_this_month.toLocaleString()}`;
        
        const jobsList = document.getElementById('todays-jobs-list');
        if (data.todaysJobs.length === 0) {
            jobsList.innerHTML = '<div class="empty-state"><h3>No jobs scheduled for today</h3><p>Click "+ New Job" to schedule one</p></div>';
        } else {
            jobsList.innerHTML = data.todaysJobs.map(job => `
                <div class="job-card" onclick="editJob(${job.id})">
                    <div class="job-info">
                        <div class="job-title">${escapeHtml(job.title)}</div>
                        <div class="job-meta">
                            <span>👤 ${escapeHtml(job.customer_name || 'No customer')}</span>
                            <span>📍 ${escapeHtml(job.customer_address || '')}</span>
                            <span class="status status-${job.status}">${job.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div class="job-time">${job.scheduled_time || '—'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

// ============ JOBS ============
async function loadJobs() {
    const status = document.getElementById('job-status-filter')?.value || '';
    const date = document.getElementById('job-date-filter')?.value || '';
    
    let url = `${API}/api/jobs?`;
    if (status) url += `status=${status}&`;
    if (date) url += `date=${date}&`;
    
    try {
        const res = await fetch(url);
        const jobs = await res.json();
        
        const jobsList = document.getElementById('jobs-list');
        if (jobs.length === 0) {
            jobsList.innerHTML = '<div class="empty-state"><h3>No jobs found</h3></div>';
        } else {
            jobsList.innerHTML = jobs.map(job => `
                <div class="job-card" onclick="editJob(${job.id})">
                    <div class="job-info">
                        <div class="job-title">${escapeHtml(job.title)}</div>
                        <div class="job-meta">
                            <span>👤 ${escapeHtml(job.customer_name || 'No customer')}</span>
                            <span>📅 ${job.scheduled_date || 'Not scheduled'}</span>
                            <span>🔧 ${job.job_type?.replace('_', ' ') || ''}</span>
                            <span class="status status-${job.status}">${job.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div class="job-time">${job.scheduled_time || '—'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading jobs:', err);
    }
}

async function openJobModal(jobId = null) {
    document.getElementById('job-modal-title').textContent = jobId ? 'Edit Job' : 'New Job';
    document.getElementById('job-form').reset();
    document.getElementById('job-form').elements.id.value = '';
    
    // Load customers for dropdown
    await loadCustomerDropdown('job-customer-select');
    
    // Set default date to today
    document.getElementById('job-form').elements.scheduled_date.value = new Date().toISOString().split('T')[0];
    
    if (jobId) {
        const res = await fetch(`${API}/api/jobs/${jobId}`);
        const job = await res.json();
        const form = document.getElementById('job-form');
        Object.keys(job).forEach(key => {
            if (form.elements[key]) form.elements[key].value = job[key] || '';
        });
    }
    
    document.getElementById('job-modal').classList.add('open');
}

async function editJob(id) {
    await openJobModal(id);
}

async function saveJob(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    
    try {
        if (id) {
            await fetch(`${API}/api/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API}/api/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        closeModal('job-modal');
        loadJobs();
        loadDashboard();
    } catch (err) {
        console.error('Error saving job:', err);
        alert('Error saving job');
    }
}

// ============ CUSTOMERS ============
async function loadCustomers() {
    const search = document.getElementById('customer-search')?.value || '';
    
    try {
        const res = await fetch(`${API}/api/customers?search=${encodeURIComponent(search)}`);
        const customers = await res.json();
        
        const list = document.getElementById('customers-list');
        if (customers.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No customers found</h3></div>';
        } else {
            list.innerHTML = customers.map(c => `
                <div class="customer-card" onclick="editCustomer(${c.id})">
                    <div class="customer-info">
                        <div class="customer-name">${escapeHtml(c.name)}</div>
                        <div class="customer-meta">
                            <span>📞 ${escapeHtml(c.phone || 'No phone')}</span>
                            <span>📍 ${escapeHtml(c.city || 'No city')}</span>
                            ${c.well_depth ? `<span>💧 ${c.well_depth}ft well</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading customers:', err);
    }
}

let searchTimeout;
function searchCustomers() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadCustomers, 300);
}

async function openCustomerModal(customerId = null) {
    document.getElementById('customer-modal-title').textContent = customerId ? 'Edit Customer' : 'New Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-form').elements.id.value = '';
    
    if (customerId) {
        const res = await fetch(`${API}/api/customers/${customerId}`);
        const customer = await res.json();
        const form = document.getElementById('customer-form');
        Object.keys(customer).forEach(key => {
            if (form.elements[key]) form.elements[key].value = customer[key] || '';
        });
    }
    
    document.getElementById('customer-modal').classList.add('open');
}

async function editCustomer(id) {
    await openCustomerModal(id);
}

async function saveCustomer(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    
    try {
        if (id) {
            await fetch(`${API}/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        closeModal('customer-modal');
        loadCustomers();
    } catch (err) {
        console.error('Error saving customer:', err);
        alert('Error saving customer');
    }
}

async function loadCustomerDropdown(selectId) {
    const res = await fetch(`${API}/api/customers`);
    const customers = await res.json();
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select customer...</option>' +
        customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)} - ${escapeHtml(c.city || '')}</option>`).join('');
}

// ============ INVOICES ============
async function loadInvoices() {
    try {
        const res = await fetch(`${API}/api/invoices`);
        const invoices = await res.json();
        
        const list = document.getElementById('invoices-list');
        if (invoices.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No invoices yet</h3></div>';
        } else {
            list.innerHTML = invoices.map(inv => `
                <div class="invoice-card" onclick="viewInvoice(${inv.id})">
                    <div class="invoice-info">
                        <div class="invoice-number">${escapeHtml(inv.invoice_number)}</div>
                        <div class="invoice-meta">
                            <span>👤 ${escapeHtml(inv.customer_name || 'No customer')}</span>
                            <span>📅 ${new Date(inv.created_at).toLocaleDateString()}</span>
                            <span class="status status-${inv.status}">${inv.status}</span>
                        </div>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 700;">$${inv.total.toFixed(2)}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading invoices:', err);
    }
}

async function openInvoiceModal() {
    document.getElementById('invoice-form').reset();
    document.getElementById('invoice-items').innerHTML = `
        <div class="invoice-item">
            <input type="text" placeholder="Description" class="item-desc">
            <input type="number" placeholder="Qty" value="1" class="item-qty" min="1">
            <input type="number" placeholder="Price" class="item-price" step="0.01">
            <button type="button" class="btn btn-small" onclick="removeInvoiceItem(this)">✕</button>
        </div>
    `;
    await loadCustomerDropdown('invoice-customer-select');
    updateInvoiceTotals();
    document.getElementById('invoice-modal').classList.add('open');
}

function addInvoiceItem() {
    const container = document.getElementById('invoice-items');
    const item = document.createElement('div');
    item.className = 'invoice-item';
    item.innerHTML = `
        <input type="text" placeholder="Description" class="item-desc">
        <input type="number" placeholder="Qty" value="1" class="item-qty" min="1">
        <input type="number" placeholder="Price" class="item-price" step="0.01">
        <button type="button" class="btn btn-small" onclick="removeInvoiceItem(this)">✕</button>
    `;
    container.appendChild(item);
    item.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateInvoiceTotals));
}

function removeInvoiceItem(btn) {
    btn.closest('.invoice-item').remove();
    updateInvoiceTotals();
}

function updateInvoiceTotals() {
    const items = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    items.forEach(item => {
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        subtotal += qty * price;
    });
    const taxRate = parseFloat(document.getElementById('tax-rate').textContent) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    document.getElementById('invoice-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('invoice-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('invoice-total').textContent = `$${total.toFixed(2)}`;
}

// Add event listeners to initial invoice items
document.querySelectorAll('.invoice-item input').forEach(inp => {
    inp.addEventListener('input', updateInvoiceTotals);
});

async function saveInvoice(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const items = [];
    document.querySelectorAll('.invoice-item').forEach(item => {
        const desc = item.querySelector('.item-desc').value;
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        if (desc && qty && price) {
            items.push({ description: desc, quantity: qty, unit_price: price });
        }
    });
    
    const data = {
        customer_id: formData.get('customer_id'),
        job_id: formData.get('job_id') || null,
        notes: formData.get('notes'),
        items
    };
    
    try {
        await fetch(`${API}/api/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('invoice-modal');
        loadInvoices();
    } catch (err) {
        console.error('Error saving invoice:', err);
        alert('Error saving invoice');
    }
}

async function viewInvoice(id) {
    // TODO: View/print invoice
    alert('Invoice view coming soon! ID: ' + id);
}

// ============ CALENDAR ============
function loadCalendar() {
    const calendar = document.getElementById('calendar-view');
    calendar.innerHTML = '<p>Calendar view coming soon...</p><p>For now, use the Jobs page to view and filter by date.</p>';
}

// ============ SETTINGS ============
async function loadSettings() {
    try {
        const res = await fetch(`${API}/api/settings`);
        const settings = await res.json();
        const form = document.getElementById('settings-form');
        Object.keys(settings).forEach(key => {
            if (form.elements[key]) form.elements[key].value = settings[key];
        });
    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    
    try {
        await fetch(`${API}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        alert('Settings saved!');
    } catch (err) {
        console.error('Error saving settings:', err);
        alert('Error saving settings');
    }
}

// ============ UTILITIES ============
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
});

// Initialize
loadDashboard();
