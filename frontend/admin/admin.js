// Admin Dashboard JavaScript
/**
 * API Base URL — works in ALL environments automatically:
 *   Local dev   → http://localhost:5000/api
 *   Render.com  → https://wigo-herbal.onrender.com/api
 *   Custom domain → https://wigoherbal.com/api
 *
 * Because the frontend is served BY the same Node.js server,
 * window.location.origin always points to the correct API host.
 */
const API = window.location.origin + '/api';
let authToken = sessionStorage.getItem('wigoAdminToken');
let currentApptId = null;
let currentDeleteFn = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateTo(section);
        });
    });
});

function updateDateTime() {
    const el = document.getElementById('currentDateTime');
    if (!el) return;
    el.textContent = new Date().toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

// ============================================================
// AUTH
// ============================================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        const res = await fetchJSON('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (res.success) {
            authToken = res.token;
            sessionStorage.setItem('wigoAdminToken', authToken);
            showDashboard(res.user);
        } else {
            showLoginError(res.message || 'Login failed.');
        }
    } catch (err) {
        showLoginError('Unable to connect to server. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'flex';
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.body.classList.add('login-page');
}

async function showDashboard(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.body.classList.remove('login-page');
    
    // Get user info if not passed
    if (!user) {
        try {
            const res = await fetchJSON('/api/auth/profile');
            if (res.success) user = res.user;
        } catch (_) {}
    }
    
    if (user) {
        document.getElementById('adminName').textContent = user.full_name || 'Admin';
    }
    
    navigateTo('overview');
}

function logout() {
    authToken = null;
    sessionStorage.removeItem('wigoAdminToken');
    showLogin();
}

function togglePassword() {
    const inp = document.getElementById('loginPassword');
    const icon = document.getElementById('passwordIcon');
    if (inp.type === 'password') {
        inp.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        inp.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ============================================================
// NAVIGATION
// ============================================================
const sectionTitles = {
    overview: 'Overview',
    appointments: 'Appointments',
    services: 'Services',
    messages: 'Contact Messages'
};

function navigateTo(section) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById(`section-${section}`);
    if (target) target.style.display = 'block';
    
    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');
    
    document.getElementById('pageTitle').textContent = sectionTitles[section] || section;
    
    // Load data for section
    switch (section) {
        case 'overview':     loadOverview(); break;
        case 'appointments': loadAppointments(); break;
        case 'services':     loadServices(); break;
        case 'messages':     loadMessages(); break;
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ============================================================
// API HELPERS
// ============================================================
async function fetchJSON(url, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    
    const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });
    
    const data = await res.json();
    
    if (res.status === 401) {
        logout();
        throw new Error('Session expired');
    }
    
    return data;
}

// ============================================================
// OVERVIEW
// ============================================================
async function loadOverview() {
    try {
        const res = await fetchJSON('/api/appointments/stats/overview');
        if (!res.success) return;
        
        const { stats, topServices, recent } = res;
        
        document.getElementById('stat-total').textContent     = stats.total;
        document.getElementById('stat-pending').textContent   = stats.pending;
        document.getElementById('stat-completed').textContent = stats.completed;
        document.getElementById('stat-today').textContent     = stats.today;
        
        // Update sidebar badges
        document.getElementById('pendingBadge').textContent = stats.pending;
        
        // Top services
        const topMax = topServices.length ? topServices[0].count : 1;
        document.getElementById('topServicesList').innerHTML = topServices.length
            ? topServices.map(s => `
                <div class="top-service-item">
                    <span class="top-service-name">${s.service}</span>
                    <div class="top-service-bar">
                        <div class="top-service-fill" style="width:${(s.count / topMax * 100).toFixed(0)}%"></div>
                    </div>
                    <span class="top-service-count">${s.count}</span>
                </div>`).join('')
            : '<p style="color:#666;font-size:.85rem;">No data yet</p>';
        
        // Recent appointments
        document.getElementById('recentTbody').innerHTML = recent.length
            ? recent.map(a => `
                <tr>
                    <td>${a.full_name}</td>
                    <td>${a.service}</td>
                    <td>${a.appointment_date}</td>
                    <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                </tr>`).join('')
            : '<tr><td colspan="4" class="loading-row">No appointments yet</td></tr>';
        
    } catch (err) {
        console.error('Overview error:', err);
    }
}

// ============================================================
// APPOINTMENTS
// ============================================================
let apptPage = 1;

async function loadAppointments(page = 1) {
    apptPage = page;
    const search  = document.getElementById('apptSearch').value;
    const status  = document.getElementById('apptStatus').value;
    const date    = document.getElementById('apptDate').value;
    
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (date)   params.append('date', date);
    
    const tbody = document.getElementById('appointmentsTbody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const res = await fetchJSON(`/api/appointments?${params}`);
        if (!res.success) { tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Failed to load</td></tr>'; return; }
        
        tbody.innerHTML = res.data.length
            ? res.data.map(a => `
                <tr>
                    <td>${a.id}</td>
                    <td>${escape(a.full_name)}</td>
                    <td>${a.phone}</td>
                    <td>${a.service}</td>
                    <td>${a.appointment_date}</td>
                    <td>${a.appointment_time}</td>
                    <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-view" title="View" onclick="viewAppointment(${a.id})"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon btn-delete" title="Delete" onclick="confirmDelete(() => deleteAppointment(${a.id}))"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="8" class="loading-row">No appointments found</td></tr>';
        
        renderPagination('apptPagination', res.pagination, loadAppointments);
        
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Error loading appointments</td></tr>';
    }
}

async function viewAppointment(id) {
    currentApptId = id;
    try {
        const res = await fetchJSON(`/api/appointments/${id}`);
        if (!res.success) return;
        
        const a = res.data;
        document.getElementById('apptModalBody').innerHTML = `
            <div class="appt-detail-grid">
                <div class="detail-item"><label>Full Name</label><p>${escape(a.full_name)}</p></div>
                <div class="detail-item"><label>Gender</label><p>${a.gender}</p></div>
                <div class="detail-item"><label>Age</label><p>${a.age}</p></div>
                <div class="detail-item"><label>Phone</label><p>${a.phone}</p></div>
                <div class="detail-item"><label>Email</label><p>${a.email || '—'}</p></div>
                <div class="detail-item"><label>Address</label><p>${a.address || '—'}</p></div>
                <div class="detail-item"><label>Service</label><p>${a.service}</p></div>
                <div class="detail-item"><label>Language</label><p>${a.language === 'am' ? 'አማርኛ' : 'English'}</p></div>
                <div class="detail-item"><label>Date</label><p>${a.appointment_date}</p></div>
                <div class="detail-item"><label>Time</label><p>${a.appointment_time}</p></div>
                <div class="detail-item detail-full"><label>Symptoms</label><p>${escape(a.symptoms)}</p></div>
                ${a.notes ? `<div class="detail-item detail-full"><label>Notes</label><p>${escape(a.notes)}</p></div>` : ''}
                <div class="detail-item"><label>Status</label><span class="status-badge status-${a.status}">${a.status}</span></div>
                <div class="detail-item"><label>Submitted</label><p>${new Date(a.created_at).toLocaleString()}</p></div>
            </div>`;
        
        document.getElementById('statusSelect').value = a.status;
        openModal('apptModal');
    } catch (err) {
        console.error('View appointment error:', err);
    }
}

async function saveStatus() {
    if (!currentApptId) return;
    const status = document.getElementById('statusSelect').value;
    
    try {
        const res = await fetchJSON(`/api/appointments/${currentApptId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (res.success) {
            closeModal('apptModal');
            loadAppointments(apptPage);
            loadOverview();
            showToast('Status updated successfully', 'success');
        }
    } catch (err) {
        showToast('Failed to update status', 'error');
    }
}

async function deleteAppointment(id) {
    try {
        const res = await fetchJSON(`/api/appointments/${id}`, { method: 'DELETE' });
        if (res.success) {
            loadAppointments(apptPage);
            loadOverview();
            showToast('Appointment deleted', 'success');
        }
    } catch (err) {
        showToast('Failed to delete', 'error');
    }
}

// ============================================================
// SERVICES
// ============================================================
async function loadServices() {
    const tbody = document.getElementById('servicesTbody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const res = await fetchJSON('/api/services');
        if (!res.success) { tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Failed to load</td></tr>'; return; }
        
        tbody.innerHTML = res.data.length
            ? res.data.map(s => `
                <tr>
                    <td>${s.id}</td>
                    <td>${escape(s.title_en)}</td>
                    <td>${s.title_am}</td>
                    <td><span class="status-badge ${s.is_active ? 'status-active' : 'status-inactive'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-edit" title="Edit" onclick="editService(${s.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon btn-delete" title="Delete" onclick="confirmDelete(() => deleteService(${s.id}))"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="5" class="loading-row">No services found</td></tr>';
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Error loading services</td></tr>';
    }
}

function showServiceModal(service = null) {
    document.getElementById('serviceId').value = service ? service.id : '';
    document.getElementById('svcTitleEn').value = service ? service.title_en : '';
    document.getElementById('svcTitleAm').value = service ? service.title_am : '';
    document.getElementById('svcDescEn').value = service ? service.description_en : '';
    document.getElementById('svcDescAm').value = service ? service.description_am : '';
    document.getElementById('svcOrder').value = service ? service.sort_order : 0;
    document.getElementById('serviceModalTitle').innerHTML = `<i class="fas fa-leaf"></i> ${service ? 'Edit' : 'Add'} Service`;
    openModal('serviceModal');
}

async function editService(id) {
    try {
        const res = await fetchJSON(`/api/services/${id}`);
        if (res.success) showServiceModal(res.data);
    } catch (_) { showToast('Failed to load service', 'error'); }
}

async function saveService() {
    const id = document.getElementById('serviceId').value;
    const formData = new FormData();
    
    formData.append('title_en',       document.getElementById('svcTitleEn').value);
    formData.append('title_am',       document.getElementById('svcTitleAm').value);
    formData.append('description_en', document.getElementById('svcDescEn').value);
    formData.append('description_am', document.getElementById('svcDescAm').value);
    formData.append('sort_order',     document.getElementById('svcOrder').value);
    
    const imageFile = document.getElementById('svcImage').files[0];
    if (imageFile) formData.append('image', imageFile);
    
    const url = id ? `/api/services/${id}` : '/api/services';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        
        const res = await fetch(url, { method, headers, body: formData });
        const data = await res.json();
        
        if (data.success) {
            closeModal('serviceModal');
            loadServices();
            showToast(`Service ${id ? 'updated' : 'created'} successfully`, 'success');
        } else {
            showToast(data.message || 'Failed to save service', 'error');
        }
    } catch (err) {
        showToast('Failed to save service', 'error');
    }
}

async function deleteService(id) {
    try {
        const res = await fetchJSON(`/api/services/${id}`, { method: 'DELETE' });
        if (res.success) { loadServices(); showToast('Service deleted', 'success'); }
    } catch (_) { showToast('Failed to delete', 'error'); }
}

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
    const tbody = document.getElementById('messagesTbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    const search  = document.getElementById('msgSearch').value;
    const is_read = document.getElementById('msgReadFilter').value;
    
    const params = new URLSearchParams({ limit: 20 });
    if (search) params.append('search', search);
    if (is_read !== '') params.append('is_read', is_read);
    
    try {
        const res = await fetchJSON(`/api/contact?${params}`);
        if (!res.success) { tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Failed to load</td></tr>'; return; }
        
        const unread = res.data.filter(m => !m.is_read).length;
        document.getElementById('unreadBadge').textContent = unread;
        
        tbody.innerHTML = res.data.length
            ? res.data.map(m => `
                <tr>
                    <td>${m.id}</td>
                    <td>${escape(m.name)}</td>
                    <td>${m.phone}</td>
                    <td>${escape(m.subject)}</td>
                    <td>${new Date(m.created_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${m.is_read ? 'status-read' : 'status-unread'}">${m.is_read ? 'Read' : 'Unread'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-view"   title="View"         onclick="viewMessage(${m.id})"><i class="fas fa-eye"></i></button>
                            ${!m.is_read ? `<button class="btn-icon btn-read" title="Mark Read" onclick="markRead(${m.id})"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn-icon btn-delete" title="Delete" onclick="confirmDelete(() => deleteMessage(${m.id}))"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="7" class="loading-row">No messages found</td></tr>';
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error loading messages</td></tr>';
    }
}

async function viewMessage(id) {
    try {
        const res = await fetchJSON(`/api/contact?limit=100`);
        if (!res.success) return;
        
        const msg = res.data.find(m => m.id === id);
        if (!msg) return;
        
        document.getElementById('msgModalBody').innerHTML = `
            <div class="appt-detail-grid">
                <div class="detail-item"><label>Name</label><p>${escape(msg.name)}</p></div>
                <div class="detail-item"><label>Phone</label><p>${msg.phone}</p></div>
                <div class="detail-item detail-full"><label>Subject</label><p>${escape(msg.subject)}</p></div>
                <div class="detail-item detail-full"><label>Message</label><p style="white-space:pre-wrap">${escape(msg.message)}</p></div>
                <div class="detail-item"><label>Received</label><p>${new Date(msg.created_at).toLocaleString()}</p></div>
                <div class="detail-item"><label>Status</label><span class="status-badge ${msg.is_read ? 'status-read' : 'status-unread'}">${msg.is_read ? 'Read' : 'Unread'}</span></div>
            </div>`;
        
        openModal('msgModal');
        if (!msg.is_read) await markRead(id);
    } catch (err) {
        console.error('View message error:', err);
    }
}

async function markRead(id) {
    try {
        await fetchJSON(`/api/contact/${id}/read`, { method: 'PATCH' });
        loadMessages();
    } catch (_) {}
}

async function deleteMessage(id) {
    try {
        const res = await fetchJSON(`/api/contact/${id}`, { method: 'DELETE' });
        if (res.success) { loadMessages(); showToast('Message deleted', 'success'); }
    } catch (_) { showToast('Failed to delete', 'error'); }
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id)  { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// Confirm delete helper
function confirmDelete(fn) {
    currentDeleteFn = fn;
    openModal('confirmModal');
    document.getElementById('confirmYes').onclick = () => {
        fn();
        closeModal('confirmModal');
    };
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination(containerId, pagination, loadFn) {
    const el = document.getElementById(containerId);
    if (!el || !pagination || pagination.pages <= 1) { if (el) el.innerHTML = ''; return; }
    
    let html = '';
    for (let i = 1; i <= pagination.pages; i++) {
        html += `<button class="page-btn ${i === pagination.page ? 'active' : ''}" onclick="${loadFn.name}(${i})">${i}</button>`;
    }
    el.innerHTML = html;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        background: ${type === 'success' ? '#2E7D32' : '#C62828'};
        color: white; padding: 0.85rem 1.25rem;
        border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        z-index: 9999; font-size: 0.9rem; font-family: Poppins, sans-serif;
        animation: fadeIn 0.3s ease; max-width: 320px;
        display: flex; align-items: center; gap: 0.5rem;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Sanitize text output to prevent XSS
function escape(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
