// Add to cart functionality
async function addToCart(itemName, price, buttonElement) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_name: itemName,
                price: price,
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
        const priceText = item.querySelector('.price').textContent;
        const price = parseFloat(priceText.replace('₪', ''));

        const button = document.createElement('button');
        button.className = 'add-to-cart-btn';
        button.textContent = 'Add to Cart';
        button.onclick = () => addToCart(name, price, button);

        item.appendChild(button);
    });
});
