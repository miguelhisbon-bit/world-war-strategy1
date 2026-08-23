export const SHORTCUTS = { MOVE: 'm', ATTACK: 'a', DEFEND: 'd', HOLD: 'h', RETREAT: 'r', AIRSTRIKE: 's', PAUSE: ' ', SPEED_UP: '=', SPEED_DOWN: '-', ZOOM_IN: ']', ZOOM_OUT: '[', RESET: '0', TOP_VIEW: 't', ZOOM_COUNTRY: 'z' };

export function initShortcuts() { document.addEventListener('keydown', handleKeyPress); }

export function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    switch(key) {
        case SHORTCUTS.MOVE: triggerCommand('moveCommand'); break;
        case SHORTCUTS.ATTACK: triggerCommand('attackCommand'); break;
        case SHORTCUTS.DEFEND: triggerCommand('defendCommand'); break;
        case SHORTCUTS.HOLD: triggerCommand('holdCommand'); break;
        case SHORTCUTS.RETREAT: triggerCommand('retreatCommand'); break;
        case SHORTCUTS.AIRSTRIKE: triggerCommand('airstrikeCommand'); break;
        case SHORTCUTS.PAUSE: triggerCommand('pauseBtn'); break;
        case SHORTCUTS.SPEED_UP: triggerCommand('speedBtn'); break;
        case SHORTCUTS.SPEED_DOWN: if (window.speed > 1) { window.speed = window.speed / 2; const speedBtn = document.getElementById('speedBtn'); if (speedBtn) speedBtn.textContent = `${window.speed}×`; if (window.toast) window.toast(`Speed: ${window.speed}×`); } break;
        case SHORTCUTS.ZOOM_IN: triggerCommand('zoomIn'); break;
        case SHORTCUTS.ZOOM_OUT: triggerCommand('zoomOut'); break;
        case SHORTCUTS.RESET: triggerCommand('resetCamera'); break;
        case SHORTCUTS.TOP_VIEW: triggerCommand('topDown'); break;
        case SHORTCUTS.ZOOM_COUNTRY: triggerCommand('zoomToCountry'); break;
        default: break;
    }
}

function triggerCommand(elementId) {
    const element = document.getElementById(elementId);
    if (element) { element.click(); element.style.transform = 'scale(0.9)'; setTimeout(() => element.style.transform = '', 200); }
}