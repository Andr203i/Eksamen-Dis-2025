// Storefront - Fetch host data and display Valuable Host badge

// Get hostId from URL (e.g., /storefront/1)
const hostId = window.location.pathname.split('/').pop() || '1';

// API base URL
const API_BASE = window.location.origin;

/**
 * Fetch host data from public API
 */
async function loadHostData() {
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        
        if (!response.ok) {
            throw new Error('Host not found');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayHostData(data.host);
        } else {
            showError('Could not load host data');
        }
        
    } catch (error) {
        console.error('Error loading host data:', error);
        showError('Failed to connect to server');
    }
}

/**
 * Display host data on the page
 */
function displayHostData(host) {
    // Update host name
    document.getElementById('hostName').textContent = host.name;
    document.getElementById('hostAvatar').textContent = getInitials(host.name);
    document.title = `Experience with ${host.name} | Understory`;
    
    // Show/hide Valuable Host badge
    const badge = host.badge;
    
    if (badge.hasValuableHostBadge) {
        // Show the badge
        const badgeElement = document.getElementById('valuableHostBadge');
        badgeElement.style.display = 'flex';
        
        // Update badge stats
        document.getElementById('badgeRating').textContent = badge.avgRating90d;
        document.getElementById('badgeReviews').textContent = `(${badge.reviewsCount90d} anmeldelser)`;
        
        // Show host badge text
        const hostBadgeText = document.getElementById('hostBadgeText');
        hostBadgeText.style.display = 'block';
        
        console.log('✨ Valuable Host badge displayed!');
    } else {
        console.log('No badge for this host yet.');
    }
    
    // Display experience if available
    if (host.experiences && host.experiences.length > 0) {
        const experience = host.experiences[0];
        
        if (experience.image_url) {
            document.getElementById('experienceImage').src = experience.image_url;
        }
        
        if (experience.title) {
            document.getElementById('experienceTitle').textContent = experience.title;
        }
        
        if (experience.price) {
            document.getElementById('experiencePrice').textContent = `Fra ${experience.price} kr.`;
        }
    }
}

/**
 * Get initials from name
 */
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Show error message
 */
function showError(message) {
    const experienceTitle = document.getElementById('experienceTitle');
    experienceTitle.textContent = message;
    experienceTitle.style.color = '#D32F2F';
    
    // Hide badge on error
    document.getElementById('valuableHostBadge').style.display = 'none';
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
    console.log('🏪 Loading storefront for host:', hostId);
    loadHostData();
});