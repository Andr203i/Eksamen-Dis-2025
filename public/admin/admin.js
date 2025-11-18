// Admin Dashboard - Top 40 Leaderboard & Admin Tools

const API_BASE = window.location.origin;

/**
 * Load statistics overview
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/stats/overview`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            document.getElementById('totalHosts').textContent = stats.total_hosts || '0';
            document.getElementById('hostsWithBadge').textContent = stats.hosts_with_badge || '0';
            document.getElementById('totalEvaluations').textContent = stats.evaluations_90d || '0';
            document.getElementById('avgRating').textContent = stats.avg_rating_90d 
                ? parseFloat(stats.avg_rating_90d).toFixed(1) 
                : '-';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load Top 40 Leaderboard
 */
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/top40`);
        const data = await response.json();
        
        if (data.success) {
            displayLeaderboard(data.top40);
        } else {
            showLeaderboardError('Failed to load leaderboard');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showLeaderboardError('Failed to connect to server');
    }
}

/**
 * Display leaderboard entries
 */
function displayLeaderboard(hosts) {
    const leaderboard = document.getElementById('leaderboard');
    
    if (hosts.length === 0) {
        leaderboard.innerHTML = '<div class="loading">Ingen værter at vise endnu</div>';
        return;
    }
    
    leaderboard.innerHTML = hosts.map((host, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const badgeIcon = host.final_badge_status ? '⭐' : '';
        const ratingStars = '★'.repeat(Math.round(host.avg_rating_90d));
        
        return `
            <div class="leaderboard-item">
                <div class="rank ${rankClass}">${rank}</div>
                
                <div class="host-info">
                    <div class="host-name">
                        ${badgeIcon} ${host.host_name}
                    </div>
                    <div class="host-stats">
                        Host ID: ${host.host_id}
                    </div>
                </div>
                
                <div class="rating-display">
                    <div class="rating-number">${parseFloat(host.avg_rating_90d).toFixed(2)}</div>
                    <div class="rating-stars">${ratingStars}</div>
                </div>
                
                <div class="reviews-count">
                    <div class="reviews-number">${host.count_90d}</div>
                    <div class="reviews-label">anmeldelser</div>
                </div>
                
                <div class="badge-status">
                    ${host.final_badge_status 
                        ? '<span class="badge-yes">⭐ Badge</span>' 
                        : '<span class="badge-no">-</span>'}
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Loaded ${hosts.length} hosts to leaderboard`);
}

/**
 * Show leaderboard error
 */
function showLeaderboardError(message) {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = `<div class="loading" style="color: #D32F2F;">${message}</div>`;
}

/**
 * Send SMS Evaluation Form Handler
 */
document.getElementById('sendSmsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const hostId = document.getElementById('smsHostId').value;
    const phonesText = document.getElementById('smsPhones').value;
    const phoneNumbers = phonesText.split('\n').map(p => p.trim()).filter(p => p);
    
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
                phoneNumbers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.textContent = `✅ SMS sendt til ${data.sent} numre! (${data.failed} fejlede)`;
            resultDiv.className = 'result-message success';
            document.getElementById('sendSmsForm').reset();
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
 * Badge Override Form Handler
 */
document.getElementById('badgeOverrideForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const hostId = document.getElementById('overrideHostId').value;
    const override = document.getElementById('overrideValue').value;
    
    const resultDiv = document.getElementById('overrideResult');
    resultDiv.textContent = 'Opdaterer badge...';
    resultDiv.className = 'result-message';
    resultDiv.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/${hostId}/badge-override`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ override })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.textContent = `✅ Badge opdateret til "${override}"`;
            resultDiv.className = 'result-message success';
            
            // Reload leaderboard to see changes
            setTimeout(() => {
                loadLeaderboard();
                loadStats();
            }, 1000);
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
 * Check if user has admin cookie (simple auth)
 */
function checkAdminAccess() {
    // Check for admin cookie
    const isAdmin = document.cookie.includes('admin_session');
    
    if (isAdmin) {
        document.getElementById('adminActions').style.display = 'block';
        console.log('✅ Admin access granted');
    } else {
        console.log('👤 Public view - no admin access');
    }
}

/**
 * Logout function
 */
function logout() {
    document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/login';
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Loading admin dashboard...');
    
    // Check admin access
    checkAdminAccess();
    
    // Load data
    loadStats();
    loadLeaderboard();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadStats();
        loadLeaderboard();
    }, 30000);
});