// Performance page logic

const API_BASE = window.location.origin;

/**
 * Get cookie value
 */
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

/**
 * Check authentication
 */
function checkAuth() {
    const role = getCookie('user_role');
    if (!role) {
        window.location.href = '/login';
        return null;
    }
    return role;
}

/**
 * Get host ID
 */
function getHostId() {
    return getCookie('host_id');
}

/**
 * Initialize page based on role
 */
async function initPage() {
    const role = checkAuth();
    if (!role) return;
    
    if (role === 'admin') {
        setupAdminView();
    } else if (role === 'host') {
        const hostId = getHostId();
        setupHostView(hostId);
    }
}

/**
 * Setup Admin view
 */
function setupAdminView() {
    console.log('👨‍💼 Admin view');
    
    document.getElementById('pageTitle').textContent = 'Performance - Admin';
    document.getElementById('pageSubtitle').textContent = 'Se alle butikkers performance data';
    
    // Show store selector
    document.getElementById('adminStoreSelect').style.display = 'flex';
    
    // Show SMS form
    document.getElementById('adminSmsForm').style.display = 'block';
    
    // Load events for SMS form
    loadEvents();
    
    // Load performance data for first store
    loadPerformanceData();
}

/**
 * Setup Host view
 */
async function setupHostView(hostId) {
    console.log(`⭐ Host view for ID: ${hostId}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success) {
            const hostName = data.host.name;
            document.getElementById('pageTitle').textContent = `Performance - ${hostName}`;
            document.getElementById('pageSubtitle').textContent = 'Dine kundetilfredsheds-data';
        }
    } catch (error) {
        console.error('Error fetching host data:', error);
    }
    
    // Show rank card for hosts
    document.getElementById('rankCard').style.display = 'block';
    
    // Load performance data
    loadPerformanceData(hostId);
}

/**
 * Load performance data
 */
async function loadPerformanceData(specificHostId = null) {
    const role = getCookie('user_role');
    let hostId = specificHostId;
    
    if (!hostId) {
        if (role === 'admin') {
            hostId = document.getElementById('storeSelect').value;
        } else {
            hostId = getHostId();
        }
    }
    
    try {
        // Fetch host data with badge info
        const hostResponse = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const hostData = await hostResponse.json();
        
        if (hostData.success) {
            const badge = hostData.host.badge;
            
            // Update stats
            document.getElementById('avgRating').textContent = badge.avgRating90d || '-';
            document.getElementById('reviewCount').textContent = badge.reviewsCount90d || '0';
            
            // Badge status
            if (badge.hasValuableHostBadge) {
                document.getElementById('badgeIcon').textContent = '⭐';
                document.getElementById('badgeStatus').textContent = 'Valuable Host';
            } else {
                document.getElementById('badgeIcon').textContent = '❌';
                document.getElementById('badgeStatus').textContent = 'Ingen badge';
            }
        }
        
        // Fetch reviews/evaluations
        const reviewsResponse = await fetch(`${API_BASE}/api/admin/hosts/${hostId}/evaluations`);
        const reviewsData = await reviewsResponse.json();
        
        if (reviewsData.success) {
            displayRatingsTable(reviewsData.evaluations);
        }
        
        // If host, get rank
        if (role === 'host') {
            await loadHostRank(hostId);
        }
        
    } catch (error) {
        console.error('Error loading performance data:', error);
        document.getElementById('ratingsTableBody').innerHTML = '<tr><td colspan="4" class="empty-row">Kunne ikke indlæse data</td></tr>';
    }
}

/**
 * Display ratings table
 */
function displayRatingsTable(evaluations) {
    const tbody = document.getElementById('ratingsTableBody');
    
    if (!evaluations || evaluations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Ingen anmeldelser endnu</td></tr>';
        return;
    }
    
    tbody.innerHTML = evaluations.map(eval => {
        const stars = '★'.repeat(eval.rating);
        const date = new Date(eval.created_at).toLocaleDateString('da-DK');
        const comment = eval.comment_text || '-';
        const phone = eval.customer_phone ? `***${eval.customer_phone.slice(-4)}` : '-';
        
        return `
            <tr>
                <td>${date}</td>
                <td>
                    <div class="rating-number">${eval.rating}</div>
                    <div class="rating-stars">${stars}</div>
                </td>
                <td>${comment}</td>
                <td>${phone}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Load host rank (for host view)
 */
async function loadHostRank(hostId) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/top40`);
        const data = await response.json();
        
        if (data.success) {
            const rank = data.top40.findIndex(h => h.host_id == hostId) + 1;
            
            if (rank > 0) {
                document.getElementById('rankValue').textContent = `#${rank}`;
            } else {
                document.getElementById('rankValue').textContent = 'Ikke i top 40';
            }
        }
    } catch (error) {
        console.error('Error loading rank:', error);
    }
}

/**
 * Load events for SMS form
 */
async function loadEvents() {
    const storeId = document.getElementById('smsStoreSelect').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/${storeId}/experiences`);
        const data = await response.json();
        
        const eventSelect = document.getElementById('eventSelect');
        
        if (data.success && data.experiences.length > 0) {
            eventSelect.innerHTML = data.experiences.map(exp => 
                `<option value="${exp.experience_id}">${exp.title}</option>`
            ).join('');
        } else {
            eventSelect.innerHTML = '<option value="">Ingen begivenheder</option>';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventSelect').innerHTML = '<option value="">Fejl ved indlæsning</option>';
    }
}

/**
 * SMS form submit handler
 */
document.getElementById('smsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const hostId = document.getElementById('smsStoreSelect').value;
    const phonesText = document.getElementById('phoneNumbers').value.trim();
    const phoneNumbers = phonesText ? phonesText.split('\n').map(p => p.trim()).filter(p => p) : [];
    
    const resultDiv = document.getElementById('smsResult');
    resultDiv.textContent = 'Sender SMS...';
    resultDiv.className = 'result-message';
    resultDiv.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/evaluations/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostId: parseInt(hostId),
                phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : ['+4512345678'] // Demo number
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.textContent = `✅ SMS sendt til ${data.sent} numre! (${data.failed} fejlede)`;
            resultDiv.className = 'result-message success';
            document.getElementById('smsForm').reset();
        } else {
            resultDiv.textContent = `❌ Fejl: ${data.error}`;
            resultDiv.className = 'result-message error';
        }
    } catch (error) {
        resultDiv.textContent = `❌ Netværksfejl: ${error.message}`;
        resultDiv.className = 'result-message error';
    }
});

/**
 * Logout function
 */
function logout() {
    document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/login';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initPage();
});