// Community/Leaderboard page logic

const API_BASE = window.location.origin;

/**
 * Check authentication
 */
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`);
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = '/login';
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
 * Load community stats
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/public/community-stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalHosts').textContent = data.stats.total_hosts || '-';
            document.getElementById('valuableHosts').textContent = data.stats.valuable_hosts || '-';
            document.getElementById('totalReviews').textContent = data.stats.total_reviews || '-';
            document.getElementById('avgRating').textContent = data.stats.avg_rating ? data.stats.avg_rating.toFixed(1) : '-';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load leaderboard
 */
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/public/leaderboard`);
        const data = await response.json();
        
        if (data.success && data.leaderboard.length > 0) {
            displayLeaderboard(data.leaderboard);
        } else {
            document.getElementById('leaderboardTable').innerHTML = '<div class="loading">Failed to load leaderboard</div>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardTable').innerHTML = '<div class="loading">Failed to load leaderboard</div>';
    }
}

/**
 * Display leaderboard table
 */
function displayLeaderboard(leaderboard) {
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Vært</th>
                    <th>Rating</th>
                    <th>Anmeldelser</th>
                    <th>Badge</th>
                </tr>
            </thead>
            <tbody>
                ${leaderboard.map((host, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${host.name}</td>
                        <td>${host.avg_rating_90d ? host.avg_rating_90d.toFixed(2) : 'N/A'}</td>
                        <td>${host.reviews_count_90d || 0}</td>
                        <td class="badge-cell">
                            ${host.has_valuable_host_badge ? '<span class="badge-icon">★</span>' : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('leaderboardTable').innerHTML = tableHTML;
}

/**
 * Update back link based on role
 */
async function updateNavigation() {
    const user = await checkAuth();
    if (!user) return;
    
    const backLink = document.getElementById('backLink');
    if (user.role === 'admin') {
        backLink.href = '/admin';
    } else {
        backLink.href = '/dashboard';
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    loadStats();
    loadLeaderboard();
});