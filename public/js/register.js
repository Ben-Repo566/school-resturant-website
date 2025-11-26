const form = document.getElementById('registerForm');
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
    console.log('Registration form submitted');

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (username.length < 3) {
        showAlert('Username must be at least 3 characters', 'error');
        return;
    }

    if (!email.includes('@')) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    // Validate password strength
    if (password.length < 8) {
        showAlert('Password must be at least 8 characters', 'error');
        return;
    }

    if (!/[a-z]/.test(password)) {
        showAlert('Password must contain at least one lowercase letter', 'error');
        return;
    }

    if (!/[A-Z]/.test(password)) {
        showAlert('Password must contain at least one uppercase letter', 'error');
        return;
    }

    if (!/[0-9]/.test(password)) {
        showAlert('Password must contain at least one number', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        console.log('Sending registration request to /api/register');

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        console.log('Registration response status:', response.status);

        const data = await response.json();
        console.log('Registration response data:', data);

        if (response.ok) {
            showAlert('Registration successful! Redirecting to login...', 'success');
            console.log('Registration successful, redirecting to login');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            console.error('Registration failed:', data.error);
            showAlert(data.error || 'Registration failed', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Cannot connect to server. Please make sure the server is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Password visibility toggles
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle eye icon
    togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';

    // Update aria-label for accessibility
    togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);

    // Toggle eye icon
    toggleConfirmPassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';

    // Update aria-label for accessibility
    toggleConfirmPassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});
