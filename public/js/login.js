const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alertBox');

function showAlert(message, type) {
    alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
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
