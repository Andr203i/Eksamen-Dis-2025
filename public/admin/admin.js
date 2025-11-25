// Admin Dashboard - FIXED VERSION

const API_BASE = window.location.origin;
let currentUser = null;

/**
 * Check authentication
 */
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = '/login';
            return null;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
            console.log('No user data, redirecting to login');
            window.location.href = '/login';
            return null;
        }
        
        // Check if admin
        if (data.user.role !== 'admin') {
            console.log('Not an admin, redirecting to dashboard');
            window.location.href = '/dashboard';
            return null;
        }
        
        return data.user;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
        return null;
    }
}

/**
 * Load overview statistics
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/stats/overview`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load stats:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.stats) {
            const stats = data.stats;
            
            const totalHostsEl = document.getElementById('totalHosts');
            const hostsWithBadgeEl = document.getElementById('hostsWithBadge');
            const totalEvaluationsEl = document.getElementById('totalEvaluations');
            const avgRatingEl = document.getElementById('avgRating');
            
            if (totalHostsEl) totalHostsEl.textContent = stats.total_hosts || '0';
            if (hostsWithBadgeEl) hostsWithBadgeEl.textContent = stats.hosts_with_badge || '0';
            if (totalEvaluationsEl) totalEvaluationsEl.textContent = stats.evaluations_90d || '0';
            if (avgRatingEl) {
                const rating = parseFloat(stats.avg_rating_90d);
                avgRatingEl.textContent = (!isNaN(rating) && rating > 0) ? rating.toFixed(2) : '-';
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load all hosts dropdown
 */
async function loadHostsDropdown() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/top40`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load hosts:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.top40) {
            const select = document.getElementById('hostSelect');
            if (!select) return;
            
            select.innerHTML = data.top40.map(host => 
                `<option value="${host.host_id}">${host.host_name}</option>`
            ).join('');
            
            // Load first host data
            if (data.top40.length > 0) {
                loadHostData();
            }
        }
    } catch (error) {
        console.error('Error loading hosts:', error);
    }
}

/**
 * Load selected host data
 */
async function loadHostData() {
    const hostId = document.getElementById('hostSelect')?.value;
    if (!hostId) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success && data.host) {
            const host = data.host;
            
            // Update performance stats
            const avgRatingEl = document.getElementById('avgRating');
            const reviewCountEl = document.getElementById('reviewCount');
            const badgeStatusEl = document.getElementById('badgeStatus');
            const leaderboardRankEl = document.getElementById('leaderboardRank');
            
            if (avgRatingEl) {
                const rating = parseFloat(host.avg_rating_90d);
                avgRatingEl.textContent = (!isNaN(rating) && rating > 0) ? rating.toFixed(2) : '-';
            }
            
            if (reviewCountEl) {
                reviewCountEl.textContent = host.reviews_count_90d || '0';
            }
            
            if (badgeStatusEl) {
                badgeStatusEl.textContent = host.has_valuable_host_badge ? 'Valuable Host' : 'Ikke optjent';
                badgeStatusEl.className = 'stat-value ' + (host.has_valuable_host_badge ? 'badge-yes' : 'badge-no');
            }
            
            if (leaderboardRankEl) {
                leaderboardRankEl.textContent = '-';
            }
        }
    } catch (error) {
        console.error('Error loading host data:', error);
    }
}

/**
 * Load Top 40 Leaderboard
 */
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/hosts/top40`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load leaderboard:', response.status);
            showLeaderboardError('Kunne ikke indlæse rangliste');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.top40) {
            displayLeaderboard(data.top40);
        } else {
            showLeaderboardError('Ingen data tilgængelig');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showLeaderboardError('Fejl ved indlæsning af data');
    }
}

/**
 * Display leaderboard as TABLE
 */
function displayLeaderboard(hosts) {
    const tableBody = document.getElementById('leaderboardTableBody');
    
    if (!tableBody) {
        console.error('Leaderboard table body element not found');
        return;
    }
    
    if (!hosts || hosts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Ingen værter at vise</td></tr>';
        return;
    }
    
    tableBody.innerHTML = hosts.map((host, index) => {
        const rank = index + 1;
        
        // Safe rating parsing
        let ratingValue = '0.00';
        if (host.avg_rating_90d !== null && host.avg_rating_90d !== undefined) {
            const rating = parseFloat(host.avg_rating_90d);
            if (!isNaN(rating) && rating > 0) {
                ratingValue = rating.toFixed(2);
            }
        }
        
        const badgeIcon = host.final_badge_status ? '⭐' : '-';
        const reviewCount = host.count_90d || 0;
        const hostName = host.host_name || 'Unknown Host';
        
        return `
            <tr>
                <td>${rank}</td>
                <td>${hostName}</td>
                <td>${ratingValue}</td>
                <td>${reviewCount}</td>
                <td style="text-align: center;">${badgeIcon}</td>
            </tr>
        `;
    }).join('');
    
    console.log(`Loaded ${hosts.length} hosts to leaderboard`);
}

/**
 * Show leaderboard error
 */
function showLeaderboardError(message) {
    const tableBody = document.getElementById('leaderboardTableBody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #D32F2F;">${message}</td></tr>`;
    }
}

/**
 * Send SMS Evaluation
 */
async function sendSMS(event) {
    event.preventDefault();
    
    const hostId = document.getElementById('hostSelect')?.value;
    const phone = document.getElementById('smsPhone')?.value;
    const resultDiv = document.getElementById('smsResult');
    
    if (!hostId || !phone) {
        if (resultDiv) {
            resultDiv.textContent = 'Udfyld alle felter';
            resultDiv.style.display = 'block';
            resultDiv.style.color = '#D32F2F';
        }
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/evaluations/send`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hostId: parseInt(hostId),
                phoneNumbers: [phone]
            })
        });
        
        const data = await response.json();
        
        if (resultDiv) {
            if (data.success) {
                resultDiv.textContent = `SMS sendt! Sendt: ${data.sent}, Fejlet: ${data.failed}`;
                resultDiv.style.color = '#4CAF50';
                document.getElementById('smsPhone').value = '';
            } else {
                resultDiv.textContent = `Fejl: ${data.error || 'Kunne ikke sende SMS'}`;
                resultDiv.style.color = '#D32F2F';
            }
            resultDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        if (resultDiv) {
            resultDiv.textContent = 'Fejl ved afsendelse af SMS';
            resultDiv.style.color = '#D32F2F';
            resultDiv.style.display = 'block';
        }
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { 
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login';
}

/**
 * Initialize admin dashboard
 */
async function initAdmin() {
    console.log('Loading admin dashboard...');
    
    currentUser = await checkAuth();
    if (!currentUser) return;
    
    console.log('Admin authenticated:', currentUser);
    
    // Load all data
    loadStats();
    loadHostsDropdown();
    loadLeaderboard();
    
    // Setup SMS form
    const smsForm = document.querySelector('.admin-form');
    if (smsForm) {
        smsForm.addEventListener('submit', sendSMS);
    }
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadStats();
        loadLeaderboard();
    }, 60000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});