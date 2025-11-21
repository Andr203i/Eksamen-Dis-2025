// Login logic with JWT authentication

/**
 * Login form handler
 */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Disable button during login
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logger ind...';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Login successful:', data.user.name);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else if (data.user.role === 'host') {
                window.location.href = '/dashboard';
            }
        } else {
            // Show error
            errorDiv.textContent = data.error || 'Login fejlede';
            errorDiv.style.display = 'block';
            
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log ind';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Der skete en fejl - prøv igen';
        errorDiv.style.display = 'block';
        
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log ind';
    }
});

/**
 * Check if already logged in
 */
async function checkExistingLogin() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Already logged in, redirecting...');
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else if (data.user.role === 'host') {
                window.location.href = '/dashboard';
            }
        }
    } catch (error) {
        // Not logged in, stay on login page
        console.log('Not logged in');
    }
}

// Check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkExistingLogin();
});