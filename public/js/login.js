const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alertBox');

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    // Validate type to prevent class injection
    const validTypes = ['error', 'success', 'warning', 'info'];
    const safeType = validTypes.includes(type) ? type : 'info';

    // Escape message to prevent XSS
    const safeMessage = escapeHtml(message);

    alertBox.innerHTML = `<div class="alert alert-${safeType}">${safeMessage}</div>`;
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 5000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (!email.includes('@')) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        console.log('Sending login request to /api/login');

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', response.status);

        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok) {
            // Store CSRF token in localStorage
            if (data.csrfToken) {
                localStorage.setItem('csrfToken', data.csrfToken);
            }
            showAlert('Login successful! Redirecting...', 'success');
            console.log('Login successful, redirecting to dashboard');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            console.error('Login failed:', data.error);
            showAlert(data.error || 'Login failed', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Cannot connect to server. Please make sure the server is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Password visibility toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle eye icon (closed eye when showing password, open eye when hiding)
    togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';

    // Update aria-label for accessibility
    togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});
