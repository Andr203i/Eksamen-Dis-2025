// Storefront logic

const API_BASE = window.location.origin;

/**
 * Get host ID from URL
 */
function getHostIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

/**
 * Load host data from API
 */
async function loadHostData() {
    const hostId = getHostIdFromUrl();
    
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success) {
            displayHostInfo(data.host);
        } else {
            console.error('Failed to load host data:', data.error);
        }
    } catch (error) {
        console.error('Error loading host data:', error);
    }
}

/**
 * Display host information
 */
function displayHostInfo(host) {
    // Update page title
    document.title = `${host.experience_name} | Understory`;
    
    // Update experience title
    document.getElementById('experienceTitle').textContent = host.experience_name;
    
    // Update host name
    const hostNameEl = document.getElementById('hostName');
    if (hostNameEl) {
        hostNameEl.textContent = host.name;
    }
    
    // Update location
    const locationEl = document.getElementById('location');
    if (locationEl) {
        locationEl.textContent = host.location || 'København';
    }
    
    // Update description
    const descriptionEl = document.getElementById('description');
    if (descriptionEl) {
        descriptionEl.textContent = host.description || 'En fantastisk oplevelse';
    }
    
    // Update price
    const priceEl = document.getElementById('price');
    if (priceEl) {
        priceEl.textContent = `Fra ${host.price || 200} kr.`;
    }
    
    // **VALUABLE HOST BADGE** - Show if host has badge
    const badgeEl = document.getElementById('valuableHostBadge');
    if (host.has_valuable_host_badge) {
        badgeEl.style.display = 'flex';
        
        // Update badge stats
        const ratingEl = document.querySelector('.badge-rating');
        const reviewsEl = document.querySelector('.badge-reviews');
        
        if (ratingEl) {
            ratingEl.textContent = host.avg_rating_90d ? host.avg_rating_90d.toFixed(1) : '4.8';
        }
        
        if (reviewsEl) {
            reviewsEl.textContent = `${host.reviews_count_90d || 0} anmeldelser`;
        }
    } else {
        // Hide badge if host doesn't have it
        badgeEl.style.display = 'none';
    }
}

/**
 * Logout function
 */
async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    window.location.href = '/login';
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHostData();
});