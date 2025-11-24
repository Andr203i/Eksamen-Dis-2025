// Storefront JavaScript - Display host info and Valuable Host badge

const API_BASE = window.location.origin;

/**
 * Get host ID from URL
 */
function getHostIdFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/storefront\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Load host data
 */
async function loadHostData() {
    const hostId = getHostIdFromURL();
    
    if (!hostId) {
        console.error('No host ID in URL');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success) {
            displayHostData(data.host);
        } else {
            console.error('Failed to load host data:', data.error);
        }
    } catch (error) {
        console.error('Error loading host data:', error);
    }
}

/**
 * Display host data on page
 */
function displayHostData(host) {
    // Update host name
    const hostNameEl = document.getElementById('hostName');
    if (hostNameEl) {
        hostNameEl.textContent = host.name;
    }
    
    // Update title
    const titleEl = document.getElementById('experienceTitle');
    if (titleEl) {
        titleEl.textContent = host.experience_name || `Oplevelse hos ${host.name}`;
    }
    
    // Update location
    const locationEl = document.getElementById('location');
    if (locationEl) {
        locationEl.textContent = host.location || 'København';
    }
    
    // Update description
    const descEl = document.getElementById('description');
    if (descEl) {
        descEl.textContent = host.description || 'Unik oplevelse';
    }
    
    // Update price
    const priceEl = document.getElementById('price');
    if (priceEl) {
        priceEl.textContent = `Fra ${host.price || 200} kr.`;
    }
    
    // Display Valuable Host Badge if applicable
    if (host.has_valuable_host_badge) {
        displayValuableHostBadge(host);
    }
}

/**
 * Display Valuable Host Badge
 */
function displayValuableHostBadge(host) {
    const badgeEl = document.getElementById('valuableHostBadge');
    
    if (!badgeEl) return;
    
    // Update badge data
    const ratingEl = document.getElementById('badgeRating');
    if (ratingEl) {
        ratingEl.textContent = host.avg_rating_90d ? host.avg_rating_90d.toFixed(1) : '5.0';
    }
    
    const reviewsEl = document.getElementById('badgeReviews');
    if (reviewsEl) {
        reviewsEl.textContent = `${host.reviews_count_90d || 0} anmeldelser`;
    }
    
    // Show badge
    badgeEl.style.display = 'flex';
}

/**
 * Logout function
 */
async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHostData();
});