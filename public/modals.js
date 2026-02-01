// ============================================
// MODAL TEMPLATES
// ============================================
document.getElementById('modals-container').innerHTML = `
    <!-- Job Modal -->
    <div id="job-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 id="job-modal-title">New Job</h2>
                <button class="close-btn" onclick="closeModal('job-modal')">&times;</button>
            </div>
            <form id="job-form" onsubmit="saveJob(event)">
                <div class="modal-body">
                    <input type="hidden" name="id">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Customer *</label>
                            <select name="customer_id" required id="job-customer-select"></select>
                        </div>
                        <div class="form-group">
                            <label>Job Type</label>
                            <select name="job_type">
                                <option value="pump_repair">Pump Repair</option>
                                <option value="pump_install">Pump Installation</option>
                                <option value="well_drilling">Well Drilling</option>
                                <option value="inspection">Inspection</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" required placeholder="e.g., Pump replacement">
                    </div>
                    <div class="form-group">
                        <label>Service Address</label>
                        <input type="text" name="service_address" placeholder="Leave blank to use customer address">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" name="scheduled_date" required>
                        </div>
                        <div class="form-group">
                            <label>Time</label>
                            <input type="time" name="scheduled_time">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Assigned To</label>
                            <select name="assigned_to" id="job-assigned-select"></select>
                        </div>
                        <div class="form-group">
                            <label>Est. Hours</label>
                            <input type="number" step="0.5" name="estimated_hours">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="3" placeholder="Job details..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('job-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Job</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Customer Modal -->
    <div id="customer-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 id="customer-modal-title">New Customer</h2>
                <button class="close-btn" onclick="closeModal('customer-modal')">&times;</button>
            </div>
            <form id="customer-form" onsubmit="saveCustomer(event)">
                <div class="modal-body">
                    <input type="hidden" name="id">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input type="text" name="address">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" name="city">
                        </div>
                        <div class="form-group">
                            <label>ZIP</label>
                            <input type="text" name="zip">
                        </div>
                    </div>
                    <h3 style="margin: 25px 0 15px; font-size: 1rem; color: var(--gray-600);">Well Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Well Depth (ft)</label>
                            <input type="number" name="well_depth">
                        </div>
                        <div class="form-group">
                            <label>Pump Type</label>
                            <input type="text" name="pump_type" placeholder="e.g., Franklin 1HP">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Install Date</label>
                        <input type="date" name="install_date">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('customer-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Customer</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Quote Modal -->
    <div id="quote-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>New Quote</h2>
                <button class="close-btn" onclick="closeModal('quote-modal')">&times;</button>
            </div>
            <form id="quote-form" onsubmit="saveQuote(event)">
                <div class="modal-body">
                    <input type="hidden" name="id">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Customer *</label>
                            <select name="customer_id" required id="quote-customer-select"></select>
                        </div>
                        <div class="form-group">
                            <label>Valid Until</label>
                            <input type="date" name="valid_until">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" placeholder="e.g., Pump replacement quote">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="2"></textarea>
                    </div>
                    
                    <h3 style="margin: 20px 0 10px;">Line Items</h3>
                    <div id="quote-items" class="line-items"></div>
                    <button type="button" class="btn btn-small" onclick="addQuoteItem()">+ Add Item</button>
                    
                    <div class="totals">
                        <div class="total-row"><span>Subtotal:</span><span id="quote-subtotal">$0.00</span></div>
                        <div class="total-row"><span>Tax:</span><span id="quote-tax">$0.00</span></div>
                        <div class="total-row grand"><span>Total:</span><span id="quote-total">$0.00</span></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('quote-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Quote</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Invoice Modal -->
    <div id="invoice-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>New Invoice</h2>
                <button class="close-btn" onclick="closeModal('invoice-modal')">&times;</button>
            </div>
            <form id="invoice-form" onsubmit="saveInvoice(event)">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Customer *</label>
                            <select name="customer_id" required id="invoice-customer-select"></select>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" name="due_date">
                        </div>
                    </div>
                    
                    <h3 style="margin: 20px 0 10px;">Line Items</h3>
                    <div id="invoice-items" class="line-items"></div>
                    <button type="button" class="btn btn-small" onclick="addInvoiceItem()">+ Add Item</button>
                    
                    <div class="totals">
                        <div class="total-row"><span>Subtotal:</span><span id="invoice-subtotal">$0.00</span></div>
                        <div class="total-row"><span>Tax:</span><span id="invoice-tax">$0.00</span></div>
                        <div class="total-row grand"><span>Total:</span><span id="invoice-total">$0.00</span></div>
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <label>Notes</label>
                        <textarea name="notes" rows="2" placeholder="Payment terms, special instructions..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('invoice-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Invoice</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Team Member Modal -->
    <div id="team-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="team-modal-title">Add Team Member</h2>
                <button class="close-btn" onclick="closeModal('team-modal')">&times;</button>
            </div>
            <form id="team-form" onsubmit="saveTeamMember(event)">
                <div class="modal-body">
                    <input type="hidden" name="id">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Role</label>
                            <select name="role">
                                <option value="technician">Technician</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Hourly Rate</label>
                            <input type="number" step="0.01" name="hourly_rate">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <input type="color" name="color" value="#3b82f6">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('team-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Product Modal -->
    <div id="product-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="product-modal-title">Add Product/Service</h2>
                <button class="close-btn" onclick="closeModal('product-modal')">&times;</button>
            </div>
            <form id="product-form" onsubmit="saveProduct(event)">
                <div class="modal-body">
                    <input type="hidden" name="id">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required placeholder="e.g., Pump Installation Labor">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="2"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Price *</label>
                            <input type="number" step="0.01" name="price" required>
                        </div>
                        <div class="form-group">
                            <label>Unit</label>
                            <select name="unit">
                                <option value="each">Each</option>
                                <option value="hour">Hour</option>
                                <option value="foot">Foot</option>
                                <option value="gallon">Gallon</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Category</label>
                            <input type="text" name="category" placeholder="e.g., Labor, Parts, Service">
                        </div>
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" name="is_taxable" checked> Taxable
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('product-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>
`;

// ============================================
// MODAL HANDLERS
// ============================================
async function loadCustomerDropdown(selectId) {
    try {
        const res = await fetch(`${API}/api/customers`);
        const customers = await res.json();
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select customer...</option>' +
                customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)} - ${escapeHtml(c.city || '')}</option>`).join('');
        }
    } catch (err) {}
}

async function loadTeamDropdown(selectId) {
    try {
        const res = await fetch(`${API}/api/team`);
        const team = await res.json();
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Unassigned</option>' +
                team.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`).join('');
        }
    } catch (err) {}
}

// Jobs
async function openJobModal(jobId = null) {
    document.getElementById('job-modal-title').textContent = jobId ? 'Edit Job' : 'New Job';
    document.getElementById('job-form').reset();
    document.getElementById('job-form').elements.id.value = '';
    
    await Promise.all([
        loadCustomerDropdown('job-customer-select'),
        loadTeamDropdown('job-assigned-select')
    ]);
    
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

async function viewJob(id) { await openJobModal(id); }

async function saveJob(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    
    try {
        await fetch(`${API}/api/jobs${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('job-modal');
        loadJobs();
        loadDashboard();
        loadSchedule();
    } catch (err) {
        alert('Error saving job');
    }
}

// Customers
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

async function viewCustomer(id) { await openCustomerModal(id); }

async function saveCustomer(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    
    try {
        await fetch(`${API}/api/customers${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('customer-modal');
        loadCustomers();
    } catch (err) {
        alert('Error saving customer');
    }
}

// Quotes
async function openQuoteModal() {
    document.getElementById('quote-form').reset();
    document.getElementById('quote-items').innerHTML = '';
    await loadCustomerDropdown('quote-customer-select');
    addQuoteItem();
    document.getElementById('quote-modal').classList.add('open');
}

function addQuoteItem() {
    const container = document.getElementById('quote-items');
    const item = document.createElement('div');
    item.className = 'line-item';
    item.innerHTML = `
        <input type="text" placeholder="Description" class="item-desc">
        <input type="number" placeholder="Qty" value="1" class="item-qty" min="1">
        <input type="number" placeholder="Price" class="item-price" step="0.01">
        <button type="button" class="btn btn-small btn-icon" onclick="this.parentElement.remove(); updateQuoteTotals()">✕</button>
    `;
    container.appendChild(item);
    item.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateQuoteTotals));
}

function updateQuoteTotals() {
    let subtotal = 0;
    document.querySelectorAll('#quote-items .line-item').forEach(item => {
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        subtotal += qty * price;
    });
    const taxRate = 7.75; // TODO: Get from settings
    const tax = subtotal * (taxRate / 100);
    document.getElementById('quote-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quote-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('quote-total').textContent = `$${(subtotal + tax).toFixed(2)}`;
}

async function viewQuote(id) { alert('Quote details coming soon'); }

async function saveQuote(e) {
    e.preventDefault();
    const form = e.target;
    const items = [];
    document.querySelectorAll('#quote-items .line-item').forEach(item => {
        const desc = item.querySelector('.item-desc').value;
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        if (desc && qty && price) items.push({ description: desc, quantity: qty, unit_price: price });
    });
    
    const data = {
        customer_id: form.elements.customer_id.value,
        title: form.elements.title.value,
        description: form.elements.description.value,
        valid_until: form.elements.valid_until.value,
        items
    };
    
    try {
        await fetch(`${API}/api/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('quote-modal');
        loadQuotes();
    } catch (err) {
        alert('Error saving quote');
    }
}

// Invoices
async function openInvoiceModal() {
    document.getElementById('invoice-form').reset();
    document.getElementById('invoice-items').innerHTML = '';
    await loadCustomerDropdown('invoice-customer-select');
    
    // Set due date to 30 days from now
    const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    document.getElementById('invoice-form').elements.due_date.value = due.toISOString().split('T')[0];
    
    addInvoiceItem();
    document.getElementById('invoice-modal').classList.add('open');
}

function addInvoiceItem() {
    const container = document.getElementById('invoice-items');
    const item = document.createElement('div');
    item.className = 'line-item';
    item.innerHTML = `
        <input type="text" placeholder="Description" class="item-desc">
        <input type="number" placeholder="Qty" value="1" class="item-qty" min="1">
        <input type="number" placeholder="Price" class="item-price" step="0.01">
        <button type="button" class="btn btn-small btn-icon" onclick="this.parentElement.remove(); updateInvoiceTotals()">✕</button>
    `;
    container.appendChild(item);
    item.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateInvoiceTotals));
}

function updateInvoiceTotals() {
    let subtotal = 0;
    document.querySelectorAll('#invoice-items .line-item').forEach(item => {
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        subtotal += qty * price;
    });
    const taxRate = 7.75;
    const tax = subtotal * (taxRate / 100);
    document.getElementById('invoice-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('invoice-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('invoice-total').textContent = `$${(subtotal + tax).toFixed(2)}`;
}

async function viewInvoice(id) { alert('Invoice details coming soon'); }

async function saveInvoice(e) {
    e.preventDefault();
    const form = e.target;
    const items = [];
    document.querySelectorAll('#invoice-items .line-item').forEach(item => {
        const desc = item.querySelector('.item-desc').value;
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        if (desc && qty && price) items.push({ description: desc, quantity: qty, unit_price: price });
    });
    
    const data = {
        customer_id: form.elements.customer_id.value,
        due_date: form.elements.due_date.value,
        notes: form.elements.notes.value,
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
        alert('Error saving invoice');
    }
}

// Team
async function openTeamModal(memberId = null) {
    document.getElementById('team-modal-title').textContent = memberId ? 'Edit Team Member' : 'Add Team Member';
    document.getElementById('team-form').reset();
    document.getElementById('team-form').elements.id.value = '';
    
    if (memberId) {
        const res = await fetch(`${API}/api/team`);
        const team = await res.json();
        const member = team.find(m => m.id === memberId);
        if (member) {
            const form = document.getElementById('team-form');
            Object.keys(member).forEach(key => {
                if (form.elements[key]) form.elements[key].value = member[key] || '';
            });
        }
    }
    
    document.getElementById('team-modal').classList.add('open');
}

async function editTeamMember(id) { await openTeamModal(id); }

async function saveTeamMember(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    
    try {
        await fetch(`${API}/api/team${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('team-modal');
        loadTeam();
    } catch (err) {
        alert('Error saving team member');
    }
}

// Products
async function openProductModal(productId = null) {
    document.getElementById('product-modal-title').textContent = productId ? 'Edit Item' : 'Add Product/Service';
    document.getElementById('product-form').reset();
    document.getElementById('product-form').elements.id.value = '';
    
    if (productId) {
        const res = await fetch(`${API}/api/products`);
        const products = await res.json();
        const product = products.find(p => p.id === productId);
        if (product) {
            const form = document.getElementById('product-form');
            Object.keys(product).forEach(key => {
                if (form.elements[key]) {
                    if (form.elements[key].type === 'checkbox') {
                        form.elements[key].checked = product[key];
                    } else {
                        form.elements[key].value = product[key] || '';
                    }
                }
            });
        }
    }
    
    document.getElementById('product-modal').classList.add('open');
}

async function editProduct(id) { await openProductModal(id); }

async function saveProduct(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.is_taxable = form.elements.is_taxable.checked;
    const id = data.id;
    delete data.id;
    
    try {
        await fetch(`${API}/api/products${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('product-modal');
        loadProducts();
    } catch (err) {
        alert('Error saving product');
    }
}

// Requests
async function viewRequest(id) {
    alert('Request details modal coming soon. For now, convert via API.');
}
