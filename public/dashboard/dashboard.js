// Dashboard logic - handles admin vs host views

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
        console.log('❌ Not authenticated, redirecting to login...');
        window.location.href = '/login';
        return null;
    }
    
    return role;
}

/**
 * Get host ID from cookie
 */
function getHostId() {
    return getCookie('host_id');
}

/**
 * Initialize dashboard based on role
 */
function initDashboard() {
    const role = checkAuth();
    if (!role) return;
    
    const hostId = getHostId();
    
    if (role === 'admin') {
        setupAdminView();
    } else if (role === 'host') {
        setupHostView(hostId);
    }
}

/**
 * Setup Admin view
 */
function setupAdminView() {
    console.log('👨‍💼 Setting up Admin view...');
    
    document.getElementById('welcomeTitle').textContent = 'Admin Dashboard';
    document.getElementById('welcomeSubtitle').textContent = 'Fuld adgang til alle butikker og funktioner';
    
    // Show store selector
    document.getElementById('adminStoreSelect').style.display = 'block';
    
    // Update descriptions
    document.getElementById('storefrontDesc').textContent = 'Se enhver butiks storefront (vælg butik ovenfor)';
    document.getElementById('performanceDesc').textContent = 'Se alle butikkers performance og send SMS';
}

/**
 * Setup Host view
 */
async function setupHostView(hostId) {
    console.log(`⭐ Setting up Host view for host ID: ${hostId}`);
    
    // Fetch host data
    try {
        const response = await fetch(`/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success) {
            const hostName = data.host.name;
            
            document.getElementById('welcomeTitle').textContent = `Velkommen, ${hostName}!`;
            document.getElementById('welcomeSubtitle').textContent = 'Din butik og performance data';
            
            // Update descriptions
            document.getElementById('storefrontDesc').textContent = 'Se din offentlige butikside';
            document.getElementById('performanceDesc').textContent = 'Se dine ratings og badge status';
        }
    } catch (error) {
        console.error('Error fetching host data:', error);
        document.getElementById('welcomeTitle').textContent = 'Velkommen!';
    }
}

/**
 * Navigate to Storefront
 */
function goToStorefront() {
    const role = getCookie('user_role');
    
    if (role === 'admin') {
        const storeId = document.getElementById('storeSelect').value;
        window.location.href = `/storefront/${storeId}`;
    } else {
        const hostId = getHostId();
        window.location.href = `/storefront/${hostId}`;
    }
}

/**
 * Navigate to Performance
 */
function goToPerformance() {
    window.location.href = '/performance';
}

/**
 * Logout function
 */
function logout() {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('👋 Logged out');
    window.location.href = '/login';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});