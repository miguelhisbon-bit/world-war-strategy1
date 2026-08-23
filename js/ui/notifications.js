// =========================================================
// NOTIFICATION SYSTEM — V2
// =========================================================

export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
};

export const notifications = [];

const NOTIFICATION_COLORS = {
    info: '#58a6ff',
    success: '#55d18a',
    warning: '#ffd700',
    danger: '#e45d5d'
};

const NOTIFICATION_ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '🚨'
};

let notificationContainer = null;

export function initNotifications() {
    notificationContainer = document.getElementById('notificationCenter');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationCenter';
        notificationContainer.style.cssText = `
            position: absolute;
            z-index: 50;
            right: 20px;
            top: 90px;
            width: 300px;
            max-height: 300px;
            overflow-y: auto;
            pointer-events: none;
        `;
        document.getElementById('game').appendChild(notificationContainer);
    }
}

export function addNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 5000) {
    const notification = {
        id: Date.now() + Math.random(),
        message: message,
        type: type,
        timestamp: Date.now(),
        duration: duration
    };
    
    notifications.push(notification);
    renderNotification(notification);
    
    // Auto remove
    setTimeout(() => {
        removeNotification(notification.id);
    }, duration);
    
    return notification.id;
}

function renderNotification(notification) {
    if (!notificationContainer) return;
    
    const div = document.createElement('div');
    div.className = `notification ${notification.type}`;
    div.dataset.id = notification.id;
    div.style.cssText = `
        padding: 10px 14px;
        margin-bottom: 6px;
        background: rgba(10,15,19,0.92);
        border: 1px solid ${NOTIFICATION_COLORS[notification.type]};
        border-radius: 6px;
        font-size: 11px;
        color: #eef4f8;
        animation: slideInRight 0.3s ease;
        pointer-events: auto;
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    div.innerHTML = `
        <span style="font-size:16px;">${NOTIFICATION_ICONS[notification.type]}</span>
        <span>${notification.message}</span>
        <span style="margin-left:auto;cursor:pointer;font-size:12px;color:var(--muted);" onclick="this.parentElement.remove()">✕</span>
    `;
    
    notificationContainer.appendChild(div);
    
    // Limit to 5 notifications
    while (notificationContainer.children.length > 5) {
        notificationContainer.removeChild(notificationContainer.firstChild);
    }
}

export function removeNotification(id) {
    if (!notificationContainer) return;
    const elements = notificationContainer.querySelectorAll(`[data-id="${id}"]`);
    elements.forEach(el => el.remove());
    
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) notifications.splice(index, 1);
}

export function clearNotifications() {
    if (notificationContainer) {
        notificationContainer.innerHTML = '';
    }
    notifications.length = 0;
}

export function getNotifications() {
    return notifications;
}

export function getUnreadCount() {
    return notifications.length;
}
