// =========================================================
// HELPER FUNCTIONS (Enhanced for V2)
// =========================================================

export function random(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function lerpColor(color1, color2, t) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t);
}

export function distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

export function distance2D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx*dx + dz*dz);
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function truncate(string, length = 20) {
    if (string.length <= length) return string;
    return string.slice(0, length) + '...';
}

export function formatNumber(number) {
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
    if (number >= 1000) return (number / 1000).toFixed(1) + 'K';
    return number.toString();
}

export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function getTimeString(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
}

export function hexToRGB(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return { r, g, b };
}

export function rgbToHex(r, g, b) {
    return (r << 16) | (g << 8) | b;
}

export function hexToCSS(hex) {
    const { r, g, b } = hexToRGB(hex);
    return `rgb(${r}, ${g}, ${b})`;
}

export function log(message, type = 'info') {
    const styles = {
        info: 'color: #58a6ff',
        success: 'color: #55d18a',
        warning: 'color: #ffd700',
        error: 'color: #e45d5d'
    };
    console.log(`%c[${type.toUpperCase()}] ${message}`, styles[type] || styles.info);
}

export function debugObject(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

export function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}