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

// Load cart on page load
document.addEventListener('DOMContentLoaded', loadCart);

async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        const cart = await response.json();

        document.getElementById('loadingMessage').style.display = 'none';

        if (cart.length === 0) {
            document.getElementById('emptyCart').style.display = 'block';
            return;
        }

        document.getElementById('cartItems').style.display = 'block';
        displayCart(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('loadingMessage').textContent = 'Error loading cart';
    }
}

function displayCart(cart) {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'background: rgba(18, 18, 18, 0.02); border: 1px solid rgba(18, 18, 18, 0.08); border-radius: 12px; padding: 32px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;';

        itemDiv.innerHTML = `
            <div style="flex: 1; min-width: 200px;">
                <h3 style="font-size: 24px; font-weight: 600; color: #121212; margin-bottom: 8px; letter-spacing: -0.02em;">${item.item_name}</h3>
                <p style="font-size: 18px; color: #09f; font-weight: 600;">₪${item.price}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; background: #ffffff; border: 1px solid rgba(18, 18, 18, 0.15); border-radius: 6px; padding: 8px 16px;">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #121212; padding: 4px 8px;">-</button>
                    <span style="font-size: 16px; font-weight: 500; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #121212; padding: 4px 8px;">+</button>
                </div>
                <span style="font-size: 20px; font-weight: 600; color: #121212; min-width: 80px; text-align: right;">₪${itemTotal.toFixed(2)}</span>
                <button onclick="removeItem(${item.id})" style="background: rgba(18, 18, 18, 0.6); color: #ffffff; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.3s;">Remove</button>
            </div>
        `;

        itemsList.appendChild(itemDiv);
    });

    document.getElementById('totalAmount').textContent = `₪${total.toFixed(2)}`;
}

async function updateQuantity(cartId, newQuantity) {
    if (newQuantity < 1) {
        return removeItem(cartId);
    }

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`/api/cart/${cartId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (response.ok) {
            loadCart();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function removeItem(cartId) {
    if (!confirm('Remove this item from cart?')) {
        return;
    }

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`/api/cart/${cartId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });

        if (response.ok) {
            loadCart();
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

// Place order
document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    if (!confirm('Place this order?')) {
        return;
    }

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Order placed successfully! Total: ₪${data.total.toFixed(2)}`);
            window.location.href = '/dashboard';
        } else {
            alert(data.error || 'Error placing order');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order');
    }
});
