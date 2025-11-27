let allUsers = [];
let hiddenUsers = new Set(); // Track hidden users by ID
let userToDelete = null; // Track user to delete
let userToUpdate = null; // Track user to update

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

// Fetch all users from the API
async function loadUsers() {
    const loadingMessage = document.getElementById('loadingMessage');
    const usersTable = document.getElementById('usersTable');
    const noUsersMessage = document.getElementById('noUsersMessage');

    try {
        loadingMessage.style.display = 'block';
        usersTable.style.display = 'none';
        noUsersMessage.style.display = 'none';

        const response = await fetch('/api/users');

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        allUsers = await response.json();

        loadingMessage.style.display = 'none';

        if (allUsers.length === 0) {
            noUsersMessage.style.display = 'block';
        } else {
            usersTable.style.display = 'table';
            displayUsers(allUsers);
            updateStats(allUsers);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        loadingMessage.textContent = 'Error loading members. Please refresh the page.';
    }
}

// Display users in the table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-user-id', user.id);

        const date = new Date(user.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isHidden = hiddenUsers.has(user.id);
        if (isHidden) {
            row.classList.add('user-hidden');
        }

        const hideButtonText = isHidden ? 'Show' : 'Hide';
        const hideButtonClass = isHidden ? 'hidden' : '';

        row.innerHTML = `
            <td class="user-id">#${user.id}</td>
            <td>${escapeHtml(user.username)}</td>
            <td class="email">${escapeHtml(user.email)}</td>
            <td>${formattedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-update" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}" data-email="${escapeHtml(user.email)}">Update</button>
                    <button class="action-btn btn-delete" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">Delete</button>
                    <button class="action-btn" style="background: #09f; color: #fff;" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}" class="btn-change-password">Change Password</button>
                    <button class="action-btn btn-toggle ${hideButtonClass}" data-user-id="${user.id}">${hideButtonText}</button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats(users) {
    document.getElementById('totalUsers').textContent = users.length;

    // Count users who joined today
    const today = new Date().toDateString();
    const todayUsers = users.filter(user => {
        const userDate = new Date(user.created_at).toDateString();
        return userDate === today;
    }).length;

    document.getElementById('todayUsers').textContent = todayUsers;
}

// Search functionality
document.getElementById('searchBox').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    displayUsers(filteredUsers);

    // Show/hide no users message
    const usersTable = document.getElementById('usersTable');
    const noUsersMessage = document.getElementById('noUsersMessage');

    if (filteredUsers.length === 0) {
        usersTable.style.display = 'none';
        noUsersMessage.style.display = 'block';
        noUsersMessage.textContent = 'No members match your search.';
    } else {
        usersTable.style.display = 'table';
        noUsersMessage.style.display = 'none';
    }
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    document.getElementById('searchBox').value = '';
    loadUsers();
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle user visibility
function toggleUserVisibility(userId) {
    if (hiddenUsers.has(userId)) {
        hiddenUsers.delete(userId);
    } else {
        hiddenUsers.add(userId);
    }

    // Re-display current filtered users
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

// Open delete modal
function openDeleteModal(userId, username) {
    userToDelete = userId;
    const modal = document.getElementById('deleteModal');
    const userInfo = document.getElementById('deleteUserInfo');

    userInfo.innerHTML = `
        <p style="color: #666; margin: 10px 0;">
            <strong>User ID:</strong> #${userId}<br>
            <strong>Username:</strong> ${username}
        </p>
    `;

    modal.classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    userToDelete = null;
}

// Confirm delete
async function confirmDelete() {
    if (!userToDelete) return;

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`/api/users/${userToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete user');
        }

        // Remove from local array
        allUsers = allUsers.filter(user => user.id !== userToDelete);
        hiddenUsers.delete(userToDelete);

        // Refresh display
        displayUsers(allUsers);
        updateStats(allUsers);

        closeDeleteModal();

        alert('User deleted successfully!');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + error.message);
    }
}

// Open update modal
function openUpdateModal(userId, username, email) {
    userToUpdate = userId;
    const modal = document.getElementById('updateModal');

    document.getElementById('updateUsername').value = username;
    document.getElementById('updateEmail').value = email;

    modal.classList.add('active');
}

// Close update modal
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.classList.remove('active');
    userToUpdate = null;
}

// Handle update form submission
document.getElementById('updateUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userToUpdate) return;

    const username = document.getElementById('updateUsername').value;
    const email = document.getElementById('updateEmail').value;

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`/api/users/${userToUpdate}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ username, email })
        });

        if (!response.ok) {
            throw new Error('Failed to update user');
        }

        // Update local array
        const userIndex = allUsers.findIndex(user => user.id === userToUpdate);
        if (userIndex !== -1) {
            allUsers[userIndex].username = username;
            allUsers[userIndex].email = email;
        }

        // Refresh display
        displayUsers(allUsers);

        closeUpdateModal();

        alert('User updated successfully!');
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
    }
});

// Close modals when clicking outside
document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
        closeDeleteModal();
    }
});

document.getElementById('updateModal').addEventListener('click', (e) => {
    if (e.target.id === 'updateModal') {
        closeUpdateModal();
    }
});

// Event delegation for action buttons
document.getElementById('usersTableBody').addEventListener('click', (e) => {
    const target = e.target;

    if (target.classList.contains('btn-update')) {
        const userId = parseInt(target.getAttribute('data-user-id'));
        const username = target.getAttribute('data-username');
        const email = target.getAttribute('data-email');
        openUpdateModal(userId, username, email);
    } else if (target.classList.contains('btn-delete')) {
        const userId = parseInt(target.getAttribute('data-user-id'));
        const username = target.getAttribute('data-username');
        openDeleteModal(userId, username);
    } else if (target.classList.contains('btn-change-password')) {
        const userId = parseInt(target.getAttribute('data-user-id'));
        const username = target.getAttribute('data-username');
        openChangePasswordModal(userId, username);
    } else if (target.classList.contains('btn-toggle')) {
        const userId = parseInt(target.getAttribute('data-user-id'));
        toggleUserVisibility(userId);
    }
});

// Change Password Modal Functions
let userToChangePassword = null;

function openChangePasswordModal(userId, username) {
    userToChangePassword = userId;
    document.getElementById('changePasswordUserInfo').textContent = `Changing password for: ${username} (ID: ${userId})`;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('changePasswordModal').classList.add('active');

    // Reset password requirements UI
    const requirements = {
        length: document.getElementById('req-length'),
        lowercase: document.getElementById('req-lowercase'),
        uppercase: document.getElementById('req-uppercase'),
        number: document.getElementById('req-number')
    };

    Object.values(requirements).forEach(req => {
        req.style.color = 'rgba(18, 18, 18, 0.5)';
        const icon = req.querySelector('.requirement-icon');
        icon.textContent = '✗';
        icon.style.background = 'rgba(18, 18, 18, 0.1)';
        icon.style.color = 'rgba(18, 18, 18, 0.5)';
    });
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
    userToChangePassword = null;
}

// Password validation
function validatePasswordRequirements(password) {
    const requirements = {
        length: { element: document.getElementById('req-length'), test: password.length >= 8 },
        lowercase: { element: document.getElementById('req-lowercase'), test: /[a-z]/.test(password) },
        uppercase: { element: document.getElementById('req-uppercase'), test: /[A-Z]/.test(password) },
        number: { element: document.getElementById('req-number'), test: /[0-9]/.test(password) }
    };

    let allMet = true;
    Object.values(requirements).forEach(req => {
        const icon = req.element.querySelector('.requirement-icon');
        if (req.test) {
            req.element.style.color = '#1e7e34';
            icon.textContent = '✓';
            icon.style.background = 'rgba(30, 126, 52, 0.1)';
            icon.style.color = '#1e7e34';
        } else {
            req.element.style.color = 'rgba(18, 18, 18, 0.5)';
            icon.textContent = '✗';
            icon.style.background = 'rgba(18, 18, 18, 0.1)';
            icon.style.color = 'rgba(18, 18, 18, 0.5)';
            allMet = false;
        }
    });

    return allMet;
}

// Real-time password validation
document.getElementById('newPassword').addEventListener('input', (e) => {
    validatePasswordRequirements(e.target.value);
});

// Cancel button for password modal
document.getElementById('closePasswordModalBtn').addEventListener('click', closeChangePasswordModal);

// Handle change password form submission
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate password requirements
    if (!validatePasswordRequirements(newPassword)) {
        alert('Password does not meet requirements');
        return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch('/api/admin/change-user-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                userId: userToChangePassword,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Password changed successfully!');
            closeChangePasswordModal();
        } else {
            alert(data.error || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error changing password. Please try again.');
    }
});

// Load users when page loads
loadUsers();
