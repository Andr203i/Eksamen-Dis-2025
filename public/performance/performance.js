// Performance Page - Host View with TABLE rendering

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
 * Load performance data
 */
async function loadPerformanceData() {
    const user = await checkAuth();
    if (!user) return;
    
    let hostId = user.hostId;
    
    // If admin, get selected store
    if (user.role === 'admin') {
        const storeSelect = document.getElementById('storeSelect');
        if (storeSelect) {
            hostId = storeSelect.value;
        }
    }
    
    if (!hostId) {
        console.error('No host ID available');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}`);
        const data = await response.json();
        
        if (data.success && data.host) {
            displayPerformanceData(data.host);
        }
    } catch (error) {
        console.error('Error loading performance data:', error);
    }
}

/**
 * Display performance data
 */
function displayPerformanceData(host) {
    // Update stats
    const avgRatingEl = document.getElementById('avgRating');
    const reviewCountEl = document.getElementById('reviewCount');
    const badgeStatusEl = document.getElementById('badgeStatus');
    
    if (avgRatingEl) {
        const rating = parseFloat(host.avg_rating_90d);
        avgRatingEl.textContent = (!isNaN(rating) && rating > 0) ? rating.toFixed(1) : '-';
    }
    
    if (reviewCountEl) {
        reviewCountEl.textContent = host.reviews_count_90d || '0';
    }
    
    if (badgeStatusEl) {
        if (host.has_valuable_host_badge) {
            badgeStatusEl.textContent = 'Valuable Host ⭐';
            badgeStatusEl.style.color = '#4CAF50';
        } else {
            badgeStatusEl.textContent = 'Ikke optjent endnu';
            badgeStatusEl.style.color = '#757575';
        }
    }
    
    // Update page title
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl && host.name) {
        pageTitleEl.textContent = `Performance - ${host.name}`;
    }
    
    // Load reviews
    loadReviews(host.id);
}

/**
 * Load reviews with TABLE rendering
 * FIXED: Use /reviews endpoint (not /evaluations)
 */
async function loadReviews(hostId) {
    try {
        // CORRECT endpoint name: /reviews
        const response = await fetch(`${API_BASE}/api/public/host/${hostId}/reviews`);
        
        if (!response.ok) {
            console.error('Failed to load reviews');
            showReviewsError('Kunne ikke indlæse evalueringer');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.reviews) {
            displayReviews(data.reviews);
        } else {
            showReviewsError('Ingen evalueringer tilgængelige');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showReviewsError('Fejl ved indlæsning');
    }
}

/**
 * Display reviews as TABLE
 */
function displayReviews(reviews) {
    const tableBody = document.getElementById('reviewsTableBody');
    
    if (!tableBody) {
        console.error('Reviews table body not found');
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Ingen evalueringer endnu</td></tr>';
        return;
    }
    
    tableBody.innerHTML = reviews.map(review => {
        const date = new Date(review.created_at);
        const dateStr = date.toLocaleDateString('da-DK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const rating = parseInt(review.rating);
        const stars = '★'.repeat(Math.max(0, Math.min(5, rating)));
        
        const comment = review.comment_text || '-';
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td>
                    <span class="rating-stars">${stars}</span>
                    <span class="rating-number">${rating}/5</span>
                </td>
                <td>${comment}</td>
            </tr>
        `;
    }).join('');
    
    console.log(`Loaded ${reviews.length} reviews`);
}

/**
 * Show reviews error
 */
function showReviewsError(message) {
    const tableBody = document.getElementById('reviewsTableBody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #D32F2F;">${message}</td></tr>`;
    }
}

/**
 * Send SMS (admin only)
 */
async function sendSMS(event) {
    event.preventDefault();
    
    const user = await checkAuth();
    if (!user || user.role !== 'admin') return;
    
    const storeSelect = document.getElementById('storeSelect');
    const phoneInput = document.getElementById('smsPhone');
    const resultDiv = document.getElementById('smsResult');
    
    if (!storeSelect || !phoneInput) return;
    
    const hostId = storeSelect.value;
    const phone = phoneInput.value;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/evaluations/send`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hostId: parseInt(hostId),
                phoneNumbers: [phone]
            })
        });
        
        const data = await response.json();
        
        if (resultDiv) {
            if (data.success) {
                resultDiv.textContent = `SMS sendt!`;
                resultDiv.style.color = '#4CAF50';
                phoneInput.value = '';
            } else {
                resultDiv.textContent = `Fejl: ${data.error}`;
                resultDiv.style.color = '#D32F2F';
            }
            resultDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        if (resultDiv) {
            resultDiv.textContent = 'Fejl ved afsendelse';
            resultDiv.style.color = '#D32F2F';
            resultDiv.style.display = 'block';
        }
    }
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

/**
 * Initialize page
 */
async function initPerformance() {
    console.log('Loading performance page...');
    
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User authenticated:', user);
    
    // Show admin controls if admin
    if (user.role === 'admin') {
        const adminStoreSelect = document.getElementById('adminStoreSelect');
        const adminSmsForm = document.getElementById('adminSmsForm');
        
        if (adminStoreSelect) adminStoreSelect.style.display = 'flex';
        if (adminSmsForm) adminSmsForm.style.display = 'block';
    }
    
    // Load data
    loadPerformanceData();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initPerformance();
});