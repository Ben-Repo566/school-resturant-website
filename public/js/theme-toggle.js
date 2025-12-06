// Theme Toggle Functionality
// Handles dark/light mode switching with localStorage persistence

(function() {
    'use strict';

    // Get saved theme from localStorage or default to light
    const getSavedTheme = () => {
        return localStorage.getItem('theme') || 'light';
    };

    // Apply theme to document
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    // Save theme to localStorage
    const saveTheme = (theme) => {
        localStorage.setItem('theme', theme);
    };

    // Toggle between light and dark
    const toggleTheme = () => {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        saveTheme(newTheme);
    };

    // Initialize theme on page load
    const initTheme = () => {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
    };

    // Apply theme immediately to prevent flash
    initTheme();

    // Set up toggle button when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    });

    // Expose toggleTheme function globally if needed
    window.toggleTheme = toggleTheme;
})();
