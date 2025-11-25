// Community Page - Public Leaderboard (NO EMOJIS)

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
 * Display leaderboard with SAFE parsing
 */
function displayLeaderboard(hosts) {
    const leaderboard = document.getElementById('leaderboard');
    
    if (!leaderboard) {
        console.error('Leaderboard element not found');
        return;
    }
    
    if (!hosts || hosts.length === 0) {
        leaderboard.innerHTML = '<div class="loading">Ingen værter at vise endnu</div>';
        return;
    }
    
    leaderboard.innerHTML = hosts.map((host, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        // SAFE parsing of rating - FIX for toFixed error
        let ratingValue = '0.00';
        let ratingStars = 0;
        
        if (host.avg_rating_90d !== null && host.avg_rating_90d !== undefined) {
            const rating = parseFloat(host.avg_rating_90d);
            if (!isNaN(rating) && rating > 0) {
                ratingValue = rating.toFixed(2);
                ratingStars = Math.round(rating);
            }
        }
        
        const stars = '★'.repeat(Math.max(0, Math.min(5, ratingStars)));
        
        // Badge indicator (only star emoji kept)
        const badgeIcon = host.has_valuable_host_badge ? '⭐ ' : '';
        
        // Host name
        const hostName = host.name || host.host_name || 'Unknown Host';
        
        // Review count
        const reviewCount = host.reviews_count_90d || 0;
        
        return `
            <div class="leaderboard-item">
                <div class="rank ${rankClass}">${rank}</div>
                
                <div class="host-info">
                    <div class="host-name">
                        ${badgeIcon}${hostName}
                    </div>
                    <div class="host-stats">
                        Host ID: ${host.host_id}
                    </div>
                </div>
                
                <div class="rating-display">
                    <div class="rating-number">${ratingValue}</div>
                    <div class="rating-stars">${stars}</div>
                </div>
                
                <div class="reviews-count">
                    <div class="reviews-number">${reviewCount}</div>
                    <div class="reviews-label">anmeldelser</div>
                </div>
                
                <div class="badge-status">
                    ${host.has_valuable_host_badge 
                        ? '<span class="badge-yes">Valuable Host</span>' 
                        : '<span class="badge-no">-</span>'}
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`Loaded ${hosts.length} hosts to leaderboard`);
}

/**
 * Show leaderboard error
 */
function showLeaderboardError(message) {
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
        leaderboard.innerHTML = `<div class="loading" style="color: #D32F2F;">${message}</div>`;
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
    
    // Show/hide login button based on auth
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
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