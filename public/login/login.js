// Login logic with cookie-based authentication

/**
 * Set cookie helper function
 */
function setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Login as Admin
 */
function loginAsAdmin() {
    console.log('🔐 Logging in as Admin...');
    
    // Set admin cookies
    setCookie('user_role', 'admin');
    setCookie('admin_session', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
}

/**
 * Show host selection modal
 */
function showHostSelect() {
    document.getElementById('hostSelectModal').style.display = 'flex';
}

/**
 * Close host selection modal
 */
function closeHostSelect() {
    document.getElementById('hostSelectModal').style.display = 'none';
}

/**
 * Login as Host
 */
function loginAsHost() {
    const hostId = document.getElementById('hostSelect').value;
    
    if (!hostId) {
        alert('Vælg venligst en butik');
        return;
    }
    
    console.log(`🔐 Logging in as Host (ID: ${hostId})...`);
    
    // Set host cookies
    setCookie('user_role', 'host');
    setCookie('host_id', hostId);
    setCookie('host_session', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
}

/**
 * Check if already logged in
 */
function checkExistingLogin() {
    const cookies = document.cookie.split(';');
    const hasAdminSession = cookies.some(c => c.trim().startsWith('admin_session='));
    const hasHostSession = cookies.some(c => c.trim().startsWith('host_session='));
    
    if (hasAdminSession || hasHostSession) {
        console.log('✅ Already logged in, redirecting to dashboard...');
        window.location.href = '/dashboard';
    }
}

// Check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkExistingLogin();
});