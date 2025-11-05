// Fetch user data on page load
async function loadUserData() {
    try {
        const response = await fetch('/api/user');

        if (!response.ok) {
            window.location.href = '/login';
            return;
        }

        const user = await response.json();

        document.getElementById('usernameDisplay').textContent = user.username;
        document.getElementById('username').textContent = user.username;
        document.getElementById('email').textContent = user.email;

        // Format date
        const date = new Date(user.created_at);
        document.getElementById('createdAt').textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error loading user data:', error);
        window.location.href = '/login';
    }
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Load user data when page loads
loadUserData();
