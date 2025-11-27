// Dynamic navbar based on authentication status
(async function() {
    try {
        // Check if user is logged in
        const response = await fetch('/api/user');

        if (response.ok) {
            const data = await response.json();

            // User is logged in
            const navMenu = document.getElementById('navMenu');

            // Remove Login and Register links
            const loginLink = navMenu.querySelector('a[href="/login"]');
            const registerLink = navMenu.querySelector('a[href="/register"]');

            if (loginLink) loginLink.parentElement.remove();
            if (registerLink) registerLink.parentElement.remove();

            // Add Dashboard link if not already present
            const dashboardLink = navMenu.querySelector('a[href="/dashboard"]');
            if (!dashboardLink) {
                const dashboardLi = document.createElement('li');
                dashboardLi.innerHTML = '<a href="/dashboard" class="nav-link">Dashboard</a>';
                navMenu.appendChild(dashboardLi);
            }

            // Add Admin link if user is admin
            if (data.isAdmin) {
                const adminLink = navMenu.querySelector('a[href="/admin"]');
                if (!adminLink) {
                    const adminLi = document.createElement('li');
                    adminLi.innerHTML = '<a href="/admin" class="nav-link">Admin Panel</a>';
                    navMenu.appendChild(adminLi);
                }
            }

            // Highlight active page
            const currentPage = window.location.pathname;
            const links = navMenu.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        } else {
            // User is not logged in - navbar stays as is
            // Highlight active page
            const currentPage = window.location.pathname;
            const navMenu = document.getElementById('navMenu');
            const links = navMenu.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    } catch (error) {
        // Silently fail - user is not logged in or server error
        console.log('Auth check failed:', error);
    }
})();
