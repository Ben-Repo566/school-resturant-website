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

// Fetch last order
async function loadLastOrder() {
    try {
        const response = await fetch('/api/orders/last');

        if (!response.ok) {
            return;
        }

        const order = await response.json();

        if (!order) {
            document.getElementById('noOrderMessage').style.display = 'block';
            return;
        }

        document.getElementById('lastOrderSection').style.display = 'block';

        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let itemsHTML = '<div style="margin-top: 16px;">';
        order.items.forEach(item => {
            itemsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(18, 18, 18, 0.08);">
                    <div>
                        <strong>${item.item_name}</strong>
                        <span style="color: rgba(18, 18, 18, 0.6);"> x${item.quantity}</span>
                    </div>
                    <span>₪${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        itemsHTML += '</div>';

        document.getElementById('lastOrderDetails').innerHTML = `
            <div class="user-detail">
                <span>Order Date:</span>
                <span>${orderDate}</span>
            </div>
            <div class="user-detail">
                <span>Total:</span>
                <span style="color: #09f; font-weight: 600;">₪${order.total_amount.toFixed(2)}</span>
            </div>
            <div class="user-detail">
                <span>Status:</span>
                <span style="text-transform: capitalize;">${order.status}</span>
            </div>
            ${itemsHTML}
        `;
    } catch (error) {
        console.error('Error loading last order:', error);
    }
}

// Load user data when page loads
loadUserData();
loadLastOrder();
