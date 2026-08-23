// =========================================================
// TRAINING SYSTEM
// =========================================================

import { UNITS_DATA } from '../data/units.js';

export const trainingQueue = [];

export function trainUnit(cityId, unitType, country = 'BANGLADESH') {
    const unitData = UNITS_DATA[unitType];
    if (!unitData) return false;
    
    trainingQueue.push({
        id: `train_${Date.now()}_${Math.random()}`,
        cityId: cityId,
        unitType: unitType,
        country: country,
        progress: 0,
        totalTime: unitData.buildTime || 20,
        status: 'QUEUED'
    });
    
    return true;
}

export function getTrainingQueue() {
    return trainingQueue;
}

export function processTraining(dt, units, nation) {
    for (let i = trainingQueue.length - 1; i >= 0; i--) {
        const item = trainingQueue[i];
        if (item.status === 'COMPLETED') continue;
        
        item.progress += dt;
        item.status = 'TRAINING';
        
        if (item.progress >= item.totalTime) {
            item.status = 'COMPLETED';
            const unit = spawnTrainedUnit(item, units, nation);
            if (unit) {
                trainingQueue.splice(i, 1);
            }
        }
    }
}

function spawnTrainedUnit(item, units, nation) {
    const cityData = window.cityManager ? window.cityManager[item.cityId] : null;
    if (!cityData) return null;
    
    const countryData = nation[item.country];
    if (!countryData) return null;
    
    const mesh = window.countryMeshMap ? window.countryMeshMap[item.country] : null;
    if (!mesh) return null;
    
    const positions = mesh.geometry.attributes.position;
    const center = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < positions.count; i++) {
        center.x += positions.getX(i);
        center.z += positions.getY(i);
        count++;
    }
    center.x /= count;
    center.z /= count;
    
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetZ = (Math.random() - 0.5) * 10;
    
    const unitName = `${item.unitType} (${item.cityId})`;
    const unit = window.create3DUnit ? 
        window.create3DUnit(unitName, item.unitType, center.x + offsetX, center.z + offsetZ, true, item.country) :
        null;
    
    if (unit) {
        unit.city = item.cityId;
        if (units) units.push(unit);
        return unit;
    }
    
    return null;
}

export function getUnitTrainingCost(unitType) {
    const unitData = UNITS_DATA[unitType];
    if (!unitData) return null;
    return unitData.cost;
}

export function getUnitTrainingTime(unitType) {
    const unitData = UNITS_DATA[unitType];
    if (!unitData) return null;
    return unitData.buildTime || 20;
}

export function cancelTraining(trainingId) {
    const index = trainingQueue.findIndex(item => item.id === trainingId);
    if (index === -1) return false;
    trainingQueue.splice(index, 1);
    return true;
}