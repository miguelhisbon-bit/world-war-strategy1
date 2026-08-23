let minimapCanvas, minimapCtx;

export function initMinimap() {
    minimapCanvas = document.getElementById('miniMapCanvas');
    if (!minimapCanvas) return;
    minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.addEventListener('click', handleMinimapClick);
}

export function updateMinimap(units, nation) {
    if (!minimapCanvas || !minimapCtx) return;
    const ctx = minimapCtx;
    const w = minimapCanvas.width, h = minimapCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,16,22,0.9)';
    ctx.fillRect(0, 0, w, h);
    const countryKeys = Object.keys(nation);
    countryKeys.forEach((key, index) => {
        const data = nation[key];
        const color = data.color || 0x888888;
        const hex = '#' + color.toString(16).padStart(6, '0');
        const angle = (index / countryKeys.length) * Math.PI * 2;
        const radius = 30 + Math.random() * 15;
        const x = w/2 + Math.cos(angle) * radius;
        const y = h/2 + Math.sin(angle) * radius;
        ctx.fillStyle = hex;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '4px Arial';
        ctx.fillText(data.flag, x - 3, y - 5);
    });
    units.forEach(unit => {
        if (unit.state === 'DESTROYED') return;
        const worldX = unit.object.position.x;
        const worldZ = unit.object.position.z;
        const mapX = w/2 + (worldX / 420) * 70;
        const mapY = h/2 + (worldZ / 420) * 70;
        ctx.fillStyle = unit.friendly ? '#55d18a' : '#e45d5d';
        ctx.beginPath();
        ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0, 0, w, h);
    const cameraPos = window.camera?.position;
    if (cameraPos) {
        const cx = w/2 + (cameraPos.x / 420) * 70;
        const cy = h/2 + (cameraPos.z / 420) * 70;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 15, cy - 12, 30, 24);
    }
}

export function handleMinimapClick(event) {
    if (!minimapCanvas) return;
    const rect = minimapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const mapX = (x / rect.width) * 2 - 1;
    const mapY = (y / rect.height) * 2 - 1;
    const worldX = mapX * 210;
    const worldZ = mapY * 210;
    if (window.camera && window.controls) {
        window.camera.position.set(worldX, 30, worldZ + 50);
        window.controls.target.set(worldX, 0, worldZ);
        window.controls.update();
        if (window.toast) window.toast('📍 Navigated to location');
    }
}