// Performance page logic

const API_BASE = window.location.origin;

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
        
        return data.user;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
        return null;
    }
}

/**
 * Initialize page based on role
 */
async function initPage() {
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User authenticated:', user);
    
    if (user.role === 'admin') {
        setupAdminView();
    } else if (user.role === 'host') {
        setupHostView(user.hostId);
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
    const adminStoreSelect = document.getElementById('adminStoreSelect');
    if (adminStoreSelect) {
        adminStoreSelect.style.display = 'flex';
    }
    
    // Show SMS form
    const adminSmsForm = document.getElementById('adminSmsForm');
    if (adminSmsForm) {
        adminSmsForm.style.display = 'block';
    }
    
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
    const rankCard = document.getElementById('rankCard');
    if (rankCard) {
        rankCard.style.display = 'block';
    }
    
    // Load performance data
    loadPerformanceData(hostId);
}

/**
 * Load performance data
 */
async function loadPerformanceData(specificHostId = null) {
    let hostId = specificHostId;
    
    if (!hostId) {
        const storeSelect = document.getElementById('storeSelect');
        if (storeSelect) {
            hostId = storeSelect.value;
        } else {
            const user = await checkAuth();
            hostId = user ? user.hostId : null;
        }
    }
    
    if (!hostId) {
        console.error('No host ID available');
        return;
    }
    
    try {
        // Fetch host data with badge info
        const hostResponse = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const hostData = await hostResponse.json();
        
        if (hostData.success) {
            const host = hostData.host;
            
            // Update stats
            const avgRatingEl = document.getElementById('avgRating');
            if (avgRatingEl) {
                avgRatingEl.textContent = host.avg_rating_90d ? host.avg_rating_90d.toFixed(1) : '-';
            }
            
            const reviewCountEl = document.getElementById('reviewCount');
            if (reviewCountEl) {
                reviewCountEl.textContent = host.reviews_count_90d || '0';
            }
            
            // Badge status
            const badgeStatusEl = document.getElementById('badgeStatus');
            if (badgeStatusEl) {
                if (host.has_valuable_host_badge) {
                    badgeStatusEl.innerHTML = '<span class="badge-yes">⭐ Valuable Host</span>';
                } else {
                    badgeStatusEl.innerHTML = '<span class="badge-no">Ikke optjent endnu</span>';
                }
            }
            
            // Load reviews
            loadReviews(hostId);
        }
    } catch (error) {
        console.error('Error loading performance data:', error);
    }
}

/**
 * Load reviews
 */
async function loadReviews(hostId) {
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}/reviews?limit=10`);
        const data = await response.json();
        
        if (data.success) {
            displayReviews(data.reviews);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Display reviews
 */
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>Ingen anmeldelser endnu</p>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-rating">${'★'.repeat(review.rating)}</div>
            <div class="review-comment">${review.comment_text || 'Ingen kommentar'}</div>
            <div class="review-date">${new Date(review.created_at).toLocaleDateString('da-DK')}</div>
        </div>
    `).join('');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initPage();
});