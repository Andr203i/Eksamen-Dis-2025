// Dashboard logic - Host only

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
        
        // If admin, redirect to admin page
        if (data.user.role === 'admin') {
            window.location.href = '/admin';
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
 * Initialize dashboard
 */
async function initDashboard() {
    const user = await checkAuth();
    if (!user) return;
    
    document.getElementById('welcomeTitle').textContent = `Velkommen, ${user.name}`;
    document.getElementById('welcomeSubtitle').textContent = 'Vælg hvad du vil se';
}

/**
 * Navigate to Performance
 */
function goToPerformance() {
    window.location.href = '/performance';
}

/**
 * Navigate to Storefront
 */
async function goToStorefront() {
    const user = await checkAuth();
    if (!user) return;
    
    window.location.href = `/storefront/${user.hostId}`;
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
    initDashboard();
});