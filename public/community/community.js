// Community Page - Public Leaderboard with TABLE rendering

const API_BASE = window.location.origin;

/**
 * Check authentication (optional for community page)
 */
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                return data.user;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Load community statistics
 */
async function loadCommunityStats() {
    try {
        const response = await fetch(`${API_BASE}/api/public/community-stats`);
        const data = await response.json();
        
        if (data.success && data.stats) {
            const stats = data.stats;
            
            const totalHostsEl = document.getElementById('totalHosts');
            const valuableHostsEl = document.getElementById('valuableHosts');
            const totalReviewsEl = document.getElementById('totalReviews');
            const avgRatingEl = document.getElementById('avgRating');
            
            if (totalHostsEl) totalHostsEl.textContent = stats.total_hosts || '0';
            if (valuableHostsEl) valuableHostsEl.textContent = stats.valuable_hosts || '0';
            if (totalReviewsEl) totalReviewsEl.textContent = stats.total_reviews || '0';
            if (avgRatingEl) {
                const rating = parseFloat(stats.avg_rating);
                avgRatingEl.textContent = (!isNaN(rating) && rating > 0) ? rating.toFixed(1) : '-';
            }
        }
    } catch (error) {
        console.error('Error loading community stats:', error);
    }
}

/**
 * Load leaderboard
 */
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/public/leaderboard`);
        const data = await response.json();
        
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        } else {
            showLeaderboardError('Kunne ikke indlæse leaderboard');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showLeaderboardError('Kunne ikke forbinde til serveren');
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
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Ingen værter at vise endnu</td></tr>';
        return;
    }
    
    tableBody.innerHTML = hosts.map((host, index) => {
        const rank = index + 1;
        
        // Safe parsing of rating
        let ratingValue = '0.00';
        if (host.avg_rating_90d !== null && host.avg_rating_90d !== undefined) {
            const rating = parseFloat(host.avg_rating_90d);
            if (!isNaN(rating) && rating > 0) {
                ratingValue = rating.toFixed(2);
            }
        }
        
        // Badge indicator (only star emoji)
        const badgeIcon = host.has_valuable_host_badge ? '⭐' : '-';
        
        // Host name
        const hostName = host.name || host.host_name || 'Unknown Host';
        
        // Review count
        const reviewCount = host.reviews_count_90d || 0;
        
        // Rank styling for top 3
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-gold';
        else if (rank === 2) rankClass = 'rank-silver';
        else if (rank === 3) rankClass = 'rank-bronze';
        
        return `
            <tr class="${rankClass}">
                <td><strong>${rank}</strong></td>
                <td>${hostName}</td>
                <td>${ratingValue}</td>
                <td>${reviewCount}</td>
                <td style="text-align: center; font-size: 20px;">${badgeIcon}</td>
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
 * Logout function
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
 * Initialize page
 */
async function initPage() {
    console.log('Loading community page...');
    
    // Check if user is logged in (optional)
    const user = await checkAuth();
    
    // Show/hide navigation buttons based on auth
    const loginBtn = document.getElementById('loginBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (dashboardBtn) dashboardBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (dashboardBtn) dashboardBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
    
    // Load data
    loadCommunityStats();
    loadLeaderboard();
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadCommunityStats();
        loadLeaderboard();
    }, 60000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initPage();
});