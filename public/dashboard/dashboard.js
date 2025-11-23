// Dashboard logic - handles admin vs host views

const API_BASE = window.location.origin;

/**
 * Check authentication via JWT
 */
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`);
        const data = await response.json();
        
        if (!data.success) {
            console.log('Not authenticated, redirecting to login...');
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
 * Initialize dashboard based on role
 */
async function initDashboard() {
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User logged in:', user);
    
    if (user.role === 'admin') {
        setupAdminView(user);
    } else if (user.role === 'host') {
        setupHostView(user);
    }
}

/**
 * Setup Admin view
 */
function setupAdminView(user) {
    console.log('Setting up Admin view');
    
    document.getElementById('welcomeTitle').textContent = `Velkommen, ${user.name}`;
    document.getElementById('welcomeSubtitle').textContent = 'Administrator dashboard';
    
    // Update card 1
    document.querySelector('#storefrontCard h2').textContent = 'Se Shopfronts';
    document.querySelector('#storefrontCard p').textContent = 'Se alle butikkers offentlige sider';
    
    // Update card 2
    document.querySelector('#performanceCard h2').textContent = 'Performance & SMS';
    document.querySelector('#performanceCard p').textContent = 'Se performance data og send SMS';
}

/**
 * Setup Host view
 */
async function setupHostView(user) {
    console.log('Setting up Host view for:', user.name);
    
    document.getElementById('welcomeTitle').textContent = `Velkommen, ${user.name}`;
    document.getElementById('welcomeSubtitle').textContent = 'Din butiks dashboard';
    
    // Update card 1
    document.querySelector('#storefrontCard h2').textContent = 'Min Shopfront';
    document.querySelector('#storefrontCard p').textContent = 'Se din offentlige butikside';
    
    // Update card 2
    document.querySelector('#performanceCard h2').textContent = 'Performance';
    document.querySelector('#performanceCard p').textContent = 'Se dine ratings og badge status';
}

/**
 * Navigate to Storefront
 */
async function goToStorefront() {
    const user = await checkAuth();
    if (!user) return;
    
    if (user.role === 'admin') {
        // Admin: Go to first host's storefront (or could show selector)
        window.location.href = '/storefront/1';
    } else if (user.role === 'host') {
        // Host: Go to own storefront
        window.location.href = `/storefront/${user.hostId}`;
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});