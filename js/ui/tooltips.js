// =========================================================
// TOOLTIP SYSTEM — V2
// =========================================================

let tooltipElement = null;
let tooltipTimeout = null;
let currentTooltipTarget = null;

export function initTooltips() {
    // Create tooltip element
    tooltipElement = document.createElement('div');
    tooltipElement.style.cssText = `
        position: fixed;
        z-index: 1000;
        background: rgba(10,15,19,0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 11px;
        color: #eef4f8;
        pointer-events: none;
        max-width: 250px;
        opacity: 0;
        transition: opacity 0.2s ease;
        backdrop-filter: blur(8px);
        font-family: Inter, sans-serif;
    `;
    document.body.appendChild(tooltipElement);
}

export function showTooltip(target, content, event) {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    currentTooltipTarget = target;
    tooltipElement.innerHTML = content;
    tooltipElement.style.opacity = '1';
    
    // Position tooltip near cursor
    if (event) {
        const x = event.clientX + 15;
        const y = event.clientY + 15;
        tooltipElement.style.left = Math.min(x, window.innerWidth - 260) + 'px';
        tooltipElement.style.top = Math.min(y, window.innerHeight - 100) + 'px';
    }
}

export function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
        tooltipElement.style.opacity = '0';
        currentTooltipTarget = null;
    }, 300);
}

export function getUnitTooltip(unit) {
    if (!unit) return '';
    return `
        <div style="font-weight:700;color:var(--accent);">${unit.name}</div>
        <div style="font-size:10px;color:var(--muted);">Type: ${unit.type}</div>
        <div style="font-size:10px;color:var(--muted);">HP: ${Math.round(unit.hp)}%</div>
        <div style="font-size:10px;color:var(--muted);">Status: ${unit.state}</div>
        <div style="font-size:10px;color:var(--muted);">Kills: ${unit.kills}</div>
        <div style="font-size:10px;color:var(--muted);">XP: ${Math.round(unit.experience)}%</div>
    `;
}

export function getCountryTooltip(countryKey, nation) {
    const data = nation[countryKey];
    if (!data) return '';
    return `
        <div style="font-weight:700;color:var(--accent);">${data.flag} ${data.name}</div>
        <div style="font-size:10px;color:var(--muted);">${data.region}</div>
        <div style="font-size:10px;color:var(--muted);">Capital: ${data.capital}</div>
        <div style="font-size:10px;color:var(--muted);">States: ${data.states?.length || 0}</div>
    `;
}

export function getCityTooltip(cityData) {
    if (!cityData) return '';
    return `
        <div style="font-weight:700;color:var(--accent);">🏙️ ${cityData.name}</div>
        <div style="font-size:10px;color:var(--muted);">Population: ${cityData.population.toLocaleString()}</div>
        <div style="font-size:10px;color:var(--muted);">Industry: ${cityData.industry}</div>
        <div style="font-size:10px;color:var(--muted);">Agriculture: ${cityData.agriculture}</div>
        <div style="font-size:10px;color:var(--muted);">Fortification: ${cityData.fortification}%</div>
    `;
}
