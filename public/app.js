// API endpoint - use local server for dev, or your hosted server for production
const API = window.location.hostname === 'localhost' ? '' : 'https://api.scwellservice.com';

let currentWeekStart = getWeekStart(new Date());

// ============================================
// NAVIGATION
// ============================================
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
    
    switch(page) {
        case 'dashboard': loadDashboard(); break;
        case 'schedule': loadSchedule(); break;
        case 'jobs': loadJobs(); break;
        case 'customers': loadCustomers(); break;
        case 'quotes': loadQuotes(); break;
        case 'invoices': loadInvoices(); break;
        case 'requests': loadRequests(); break;
        case 'team': loadTeam(); break;
        case 'products': loadProducts(); break;
        case 'reports': break;
        case 'settings': loadSettings(); break;
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    try {
        const res = await fetch(`${API}/api/dashboard`);
        const data = await res.json();
        
        document.getElementById('stat-jobs-today').textContent = data.stats.jobs_today;
        document.getElementById('stat-in-progress').textContent = data.stats.jobs_in_progress;
        document.getElementById('stat-pending-quotes').textContent = data.stats.pending_quotes;
        document.getElementById('stat-new-requests').textContent = data.stats.new_requests;
        document.getElementById('stat-revenue').textContent = `$${data.stats.revenue_this_month.toLocaleString()}`;
        document.getElementById('stat-outstanding').textContent = `$${data.stats.outstanding_balance.toLocaleString()}`;
        
        // Update badge
        const badge = document.getElementById('requests-badge');
        if (data.stats.new_requests > 0) {
            badge.textContent = data.stats.new_requests;
        } else {
            badge.textContent = '';
        }
        
        // Today's jobs
        const jobsList = document.getElementById('todays-jobs-list');
        if (data.todaysJobs.length === 0) {
            jobsList.innerHTML = '<div class="empty-state"><h3>No jobs scheduled for today</h3><p>Click "+ New Job" to schedule one</p></div>';
        } else {
            jobsList.innerHTML = data.todaysJobs.map(job => `
                <div class="job-card" onclick="viewJob(${job.id})">
                    <div class="job-info">
                        <div class="job-title">${escapeHtml(job.title)}</div>
                        <div class="job-meta">
                            <span>👤 ${escapeHtml(job.customer_name || 'No customer')}</span>
                            <span>📍 ${escapeHtml(job.customer_address || '')}</span>
                            <span class="status status-${job.status}">${formatStatus(job.status)}</span>
                        </div>
                    </div>
                    <div class="job-time">${job.scheduled_time || '—'}</div>
                </div>
            `).join('');
        }
        
        // New requests
        const requestsList = document.getElementById('new-requests-list');
        const requests = await fetch(`${API}/api/requests?status=new`).then(r => r.json());
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="empty-state" style="padding: 30px;"><p>No new requests</p></div>';
        } else {
            requestsList.innerHTML = requests.slice(0, 5).map(req => `
                <div class="request-card" onclick="viewRequest(${req.id})">
                    <div class="request-info">
                        <div class="request-title">${escapeHtml(req.customer_name)}</div>
                        <div class="request-meta">
                            <span>${escapeHtml(req.service_type)}</span>
                            <span>${timeAgo(req.created_at)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

// ============================================
// SCHEDULE
// ============================================
function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function changeWeek(delta) {
    currentWeekStart = new Date(currentWeekStart.getTime() + delta * 7 * 24 * 60 * 60 * 1000);
    loadSchedule();
}

async function loadSchedule() {
    const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const startStr = currentWeekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    
    document.getElementById('week-label').textContent = 
        `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    try {
        const res = await fetch(`${API}/api/jobs?start_date=${startStr}&end_date=${endStr}`);
        const jobs = await res.json();
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().toISOString().split('T')[0];
        
        let html = '<div class="schedule-header"><div class="schedule-header-cell"></div>';
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            html += `<div class="schedule-header-cell ${isToday ? 'today' : ''}">${days[i]}<br>${date.getDate()}</div>`;
        }
        html += '</div><div class="schedule-body">';
        
        // Time slots from 7am to 6pm
        for (let hour = 7; hour <= 18; hour++) {
            const timeStr = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;
            html += `<div class="schedule-time">${timeStr}</div>`;
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const hourJobs = jobs.filter(j => {
                    if (j.scheduled_date !== dateStr) return false;
                    if (!j.scheduled_time) return hour === 9; // Default to 9am
                    const jobHour = parseInt(j.scheduled_time.split(':')[0]);
                    return jobHour === hour;
                });
                
                html += '<div class="schedule-cell">';
                hourJobs.forEach(j => {
                    html += `<div class="schedule-job" onclick="viewJob(${j.id})" style="background: ${getStatusColor(j.status)}">${escapeHtml(j.title)}</div>`;
                });
                html += '</div>';
            }
        }
        html += '</div>';
        
        document.getElementById('schedule-view').innerHTML = html;
    } catch (err) {
        console.error('Error loading schedule:', err);
    }
}

function getStatusColor(status) {
    const colors = {
        scheduled: '#3b82f6',
        in_progress: '#f59e0b',
        completed: '#10b981',
        cancelled: '#ef4444'
    };
    return colors[status] || '#3b82f6';
}

// ============================================
// JOBS
// ============================================
async function loadJobs() {
    const status = document.getElementById('job-status-filter')?.value || '';
    const assigned = document.getElementById('job-assigned-filter')?.value || '';
    const date = document.getElementById('job-date-filter')?.value || '';
    
    let url = `${API}/api/jobs?`;
    if (status) url += `status=${status}&`;
    if (assigned) url += `assigned_to=${encodeURIComponent(assigned)}&`;
    if (date) url += `date=${date}&`;
    
    try {
        const res = await fetch(url);
        const jobs = await res.json();
        
        const jobsList = document.getElementById('jobs-list');
        if (jobs.length === 0) {
            jobsList.innerHTML = '<div class="empty-state"><h3>No jobs found</h3></div>';
        } else {
            jobsList.innerHTML = jobs.map(job => `
                <div class="job-card" onclick="viewJob(${job.id})">
                    <div class="job-info">
                        <div class="job-title">${escapeHtml(job.title)}</div>
                        <div class="job-meta">
                            <span>👤 ${escapeHtml(job.customer_name || 'No customer')}</span>
                            <span>📅 ${job.scheduled_date || 'Not scheduled'}</span>
                            <span>🔧 ${formatJobType(job.job_type)}</span>
                            ${job.assigned_to ? `<span>👷 ${escapeHtml(job.assigned_to)}</span>` : ''}
                            <span class="status status-${job.status}">${formatStatus(job.status)}</span>
                        </div>
                    </div>
                    <div class="job-time">${job.scheduled_time || '—'}</div>
                </div>
            `).join('');
        }
        
        // Load team for filter
        await loadTeamFilter();
    } catch (err) {
        console.error('Error loading jobs:', err);
    }
}

function clearJobFilters() {
    document.getElementById('job-status-filter').value = '';
    document.getElementById('job-assigned-filter').value = '';
    document.getElementById('job-date-filter').value = '';
    loadJobs();
}

// ============================================
// CUSTOMERS
// ============================================
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
                <div class="customer-card" onclick="viewCustomer(${c.id})">
                    <div class="customer-info">
                        <div class="customer-name">${escapeHtml(c.name)}</div>
                        <div class="customer-meta">
                            <span>📞 ${escapeHtml(c.phone || 'No phone')}</span>
                            <span>📍 ${escapeHtml(c.city || 'No city')}</span>
                            ${c.well_depth ? `<span>💧 ${c.well_depth}ft</span>` : ''}
                            <span>📋 ${c.total_jobs || 0} jobs</span>
                        </div>
                    </div>
                    ${c.outstanding > 0 ? `<div class="amount" style="color: var(--warning)">$${c.outstanding.toLocaleString()} due</div>` : ''}
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

// ============================================
// QUOTES
// ============================================
async function loadQuotes() {
    const status = document.getElementById('quote-status-filter')?.value || '';
    
    try {
        const res = await fetch(`${API}/api/quotes${status ? `?status=${status}` : ''}`);
        const quotes = await res.json();
        
        const list = document.getElementById('quotes-list');
        if (quotes.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No quotes found</h3></div>';
        } else {
            list.innerHTML = quotes.map(q => `
                <div class="quote-card" onclick="viewQuote(${q.id})">
                    <div class="quote-info">
                        <div class="quote-title">${escapeHtml(q.quote_number)} - ${escapeHtml(q.title || 'Untitled')}</div>
                        <div class="quote-meta">
                            <span>👤 ${escapeHtml(q.customer_name || 'No customer')}</span>
                            <span>📅 ${new Date(q.created_at).toLocaleDateString()}</span>
                            <span class="status status-${q.status}">${formatStatus(q.status)}</span>
                        </div>
                    </div>
                    <div class="amount">$${q.total?.toFixed(2) || '0.00'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading quotes:', err);
    }
}

// ============================================
// INVOICES
// ============================================
async function loadInvoices() {
    const status = document.getElementById('invoice-status-filter')?.value || '';
    
    try {
        const res = await fetch(`${API}/api/invoices${status ? `?status=${status}` : ''}`);
        const invoices = await res.json();
        
        const list = document.getElementById('invoices-list');
        if (invoices.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No invoices found</h3></div>';
        } else {
            list.innerHTML = invoices.map(inv => `
                <div class="invoice-card" onclick="viewInvoice(${inv.id})">
                    <div class="invoice-info">
                        <div class="invoice-number">${escapeHtml(inv.invoice_number)}</div>
                        <div class="invoice-meta">
                            <span>👤 ${escapeHtml(inv.customer_name || 'No customer')}</span>
                            <span>📅 ${new Date(inv.created_at).toLocaleDateString()}</span>
                            ${inv.due_date ? `<span>Due: ${inv.due_date}</span>` : ''}
                            <span class="status status-${inv.status}">${formatStatus(inv.status)}</span>
                        </div>
                    </div>
                    <div class="amount">$${inv.total?.toFixed(2) || '0.00'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading invoices:', err);
    }
}

// ============================================
// REQUESTS
// ============================================
async function loadRequests() {
    const status = document.getElementById('request-status-filter')?.value || '';
    
    try {
        const res = await fetch(`${API}/api/requests${status ? `?status=${status}` : ''}`);
        const requests = await res.json();
        
        const list = document.getElementById('requests-list-page');
        if (requests.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No requests found</h3></div>';
        } else {
            list.innerHTML = requests.map(req => `
                <div class="request-card" onclick="viewRequest(${req.id})">
                    <div class="request-info">
                        <div class="request-title">${escapeHtml(req.customer_name)}</div>
                        <div class="request-meta">
                            <span>📞 ${escapeHtml(req.customer_phone || '')}</span>
                            <span>🔧 ${escapeHtml(req.service_type)}</span>
                            <span>${timeAgo(req.created_at)}</span>
                            <span class="status status-${req.status}">${formatStatus(req.status)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading requests:', err);
    }
}

// ============================================
// TEAM
// ============================================
async function loadTeam() {
    try {
        const res = await fetch(`${API}/api/team`);
        const team = await res.json();
        
        const list = document.getElementById('team-list');
        if (team.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No team members</h3><p>Add your first team member to get started</p></div>';
        } else {
            list.innerHTML = team.map(m => `
                <div class="team-card" onclick="editTeamMember(${m.id})">
                    <div class="team-avatar" style="background: ${m.color || '#3b82f6'}">${m.name.charAt(0).toUpperCase()}</div>
                    <div class="customer-info">
                        <div class="customer-name">${escapeHtml(m.name)}</div>
                        <div class="customer-meta">
                            <span>${escapeHtml(m.role || 'Technician')}</span>
                            <span>📞 ${escapeHtml(m.phone || '')}</span>
                            ${m.hourly_rate ? `<span>$${m.hourly_rate}/hr</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading team:', err);
    }
}

async function loadTeamFilter() {
    try {
        const res = await fetch(`${API}/api/team`);
        const team = await res.json();
        const select = document.getElementById('job-assigned-filter');
        if (select && team.length > 0) {
            select.innerHTML = '<option value="">All Team</option>' + 
                team.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`).join('');
        }
    } catch (err) {}
}

// ============================================
// PRODUCTS
// ============================================
async function loadProducts() {
    try {
        const res = await fetch(`${API}/api/products`);
        const products = await res.json();
        
        const list = document.getElementById('products-list');
        if (products.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No products or services</h3><p>Add items to your price list</p></div>';
        } else {
            list.innerHTML = products.map(p => `
                <div class="product-card" onclick="editProduct(${p.id})">
                    <div class="customer-info">
                        <div class="customer-name">${escapeHtml(p.name)}</div>
                        <div class="customer-meta">
                            <span>${escapeHtml(p.category || 'Uncategorized')}</span>
                            <span>per ${escapeHtml(p.unit || 'each')}</span>
                            ${p.is_taxable ? '<span>Taxable</span>' : ''}
                        </div>
                    </div>
                    <div class="amount">$${p.price?.toFixed(2) || '0.00'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
    try {
        const res = await fetch(`${API}/api/settings`);
        const settings = await res.json();
        const form = document.getElementById('settings-form');
        
        Object.keys(settings).forEach(key => {
            const input = form.elements[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = settings[key] === true || settings[key] === 'true';
                } else {
                    input.value = settings[key];
                }
            }
        });
    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const data = {};
    
    for (const el of form.elements) {
        if (el.name) {
            data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        }
    }
    
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

// Settings tabs
document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.settings-tabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`settings-${tab.dataset.tab}`).classList.add('active');
    });
});

// ============================================
// REPORTS
// ============================================
async function showReport(type) {
    const content = document.getElementById('report-content');
    content.innerHTML = '<p>Loading...</p>';
    
    try {
        if (type === 'revenue') {
            const res = await fetch(`${API}/api/reports/revenue?group_by=day`);
            const data = await res.json();
            const entries = Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
            
            content.innerHTML = `
                <h3>Revenue (Last 30 Days)</h3>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid var(--gray-200);">
                        <th style="text-align: left; padding: 10px;">Date</th>
                        <th style="text-align: right; padding: 10px;">Revenue</th>
                    </tr>
                    ${entries.map(([date, amount]) => `
                        <tr style="border-bottom: 1px solid var(--gray-100);">
                            <td style="padding: 10px;">${date}</td>
                            <td style="text-align: right; padding: 10px; font-weight: 600;">$${amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else if (type === 'jobs') {
            const res = await fetch(`${API}/api/reports/jobs`);
            const data = await res.json();
            
            content.innerHTML = `
                <h3>Jobs Report</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                    <div>
                        <h4>By Status</h4>
                        ${Object.entries(data.byStatus).map(([status, count]) => `
                            <p><span class="status status-${status}">${formatStatus(status)}</span> ${count}</p>
                        `).join('')}
                    </div>
                    <div>
                        <h4>By Type</h4>
                        ${Object.entries(data.byType).map(([type, count]) => `
                            <p>${formatJobType(type)}: ${count}</p>
                        `).join('')}
                    </div>
                    <div>
                        <h4>By Technician</h4>
                        ${Object.entries(data.byTechnician).map(([tech, count]) => `
                            <p>${tech}: ${count}</p>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = '<p>Report coming soon...</p>';
        }
    } catch (err) {
        content.innerHTML = '<p>Error loading report</p>';
    }
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatStatus(status) {
    return (status || '').replace(/_/g, ' ');
}

function formatJobType(type) {
    const types = {
        pump_repair: 'Pump Repair',
        pump_install: 'Pump Install',
        well_drilling: 'Well Drilling',
        inspection: 'Inspection',
        maintenance: 'Maintenance',
        other: 'Other'
    };
    return types[type] || type || '';
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60
    };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('open');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('open');
    }
});

// Initialize
loadDashboard();
