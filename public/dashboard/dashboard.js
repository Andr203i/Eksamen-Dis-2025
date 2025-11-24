// Dashboard logic - Host only

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
        
        // If admin, redirect to admin page
        if (data.user.role === 'admin') {
            console.log('Admin user detected, redirecting to admin');
            window.location.href = '/admin';
            return null;
        }
        
        // Check if host
        if (data.user.role !== 'host') {
            console.log('Not a host, redirecting to login');
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
 * Initialize dashboard
 */
async function initDashboard() {
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User authenticated:', user);
    
    const welcomeTitleEl = document.getElementById('welcomeTitle');
    const welcomeSubtitleEl = document.getElementById('welcomeSubtitle');
    
    if (welcomeTitleEl) {
        welcomeTitleEl.textContent = `Velkommen, ${user.name}`;
    }
    
    if (welcomeSubtitleEl) {
        welcomeSubtitleEl.textContent = 'Vælg hvad du vil se';
    }
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
        await fetch(`${API_BASE}/api/auth/logout`, { 
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});