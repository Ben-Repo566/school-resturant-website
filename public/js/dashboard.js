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

// Fetch all orders
async function loadOrderHistory() {
    try {
        const response = await fetch('/api/orders');

        if (!response.ok) {
            return;
        }

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            document.getElementById('noOrderMessage').style.display = 'block';
            return;
        }

        document.getElementById('orderHistorySection').style.display = 'block';

        let ordersHTML = '';
        orders.forEach((order, index) => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let itemsHTML = '';
            order.items.forEach(item => {
                itemsHTML += `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(18, 18, 18, 0.05);">
                        <div>
                            <strong>${item.item_name}</strong>
                            <span style="color: rgba(18, 18, 18, 0.6);"> x${item.quantity}</span>
                        </div>
                        <span>₪${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `;
            });

            ordersHTML += `
                <div class="order-card fade-in" style="background: ${index === 0 ? 'rgba(0, 153, 255, 0.05)' : '#ffffff'}; border: 1px solid rgba(18, 18, 18, 0.08); border-radius: 8px; padding: 24px; margin-bottom: 16px;">
                    ${index === 0 ? '<div style="color: #09f; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Most Recent</div>' : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div style="font-weight: 600; color: #121212; margin-bottom: 4px;">Order #${order.id}</div>
                            <div style="color: rgba(18, 18, 18, 0.6); font-size: 14px;">${orderDate}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 20px; font-weight: 600; color: #09f;">₪${order.total_amount.toFixed(2)}</div>
                            <div style="font-size: 13px; color: rgba(18, 18, 18, 0.6); text-transform: capitalize;">${order.status}</div>
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        });

        document.getElementById('orderHistoryList').innerHTML = ordersHTML;
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Load user data when page loads
loadUserData();
loadOrderHistory();
