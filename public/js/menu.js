// Get CSRF token
async function getCsrfToken() {
    let token = localStorage.getItem('csrfToken');
    if (!token) {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        token = data.csrfToken;
        localStorage.setItem('csrfToken', token);
    }
    return token;
}

// Add to cart functionality
async function addToCart(itemName, buttonElement) {
    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                item_name: itemName,
                quantity: 1
            })
        });

        if (response.status === 401) {
            // Not logged in
            if (confirm('You need to login first. Go to login page?')) {
                window.location.href = '/login';
            }
            return;
        }

        const data = await response.json();

        if (response.ok) {
            // Show success message
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '✓ Added!';
            buttonElement.style.background = '#09f';

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.style.background = '';
            }, 2000);
        } else {
            alert(data.error || 'Error adding to cart');
        }
    } catch (error) {
        console.error('Error:', error);
        // Check if user is not logged in
        if (confirm('You need to login first. Go to login page?')) {
            window.location.href = '/login';
        }
    }
}

// Add buttons to all menu items
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item-content');

    menuItems.forEach(item => {
        const name = item.querySelector('h3').textContent;

        const button = document.createElement('button');
        button.className = 'add-to-cart-btn';
        button.textContent = 'Add to Cart';
        button.onclick = () => addToCart(name, button);

        item.appendChild(button);
    });
});
