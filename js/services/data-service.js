// Data Service - Handles data persistence
import { storage } from '../utils/storage-utils.js';

export class DataService {
    constructor() {
        this.SCENARIOS_KEY = 'saved_scenarios';
        this.SETTINGS_KEY = 'user_settings';
        this.MAX_SCENARIOS = 50;
    }
    
    // Scenarios
    saveScenario(scenario) {
        const scenarios = this.loadScenarios();
        scenarios.push({
            ...scenario,
            id: this.generateId(),
            timestamp: new Date().toISOString()
        });
        
        // Keep only latest MAX_SCENARIOS
        if (scenarios.length > this.MAX_SCENARIOS) {
            scenarios.shift();
        }
        
        return storage.set(this.SCENARIOS_KEY, scenarios);
    }
    
    loadScenarios() {
        return storage.get(this.SCENARIOS_KEY) || [];
    }
    
    deleteScenario(id) {
        const scenarios = this.loadScenarios();
        const filtered = scenarios.filter(s => s.id !== id);
        return storage.set(this.SCENARIOS_KEY, filtered);
    }
    
    // Settings
    saveSettings(settings) {
        return storage.set(this.SETTINGS_KEY, settings);
    }
    
    loadSettings() {
        return storage.get(this.SETTINGS_KEY);
    }
    
    // Helpers
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    exportData() {
        return {
            scenarios: this.loadScenarios(),
            settings: this.loadSettings(),
            exportDate: new Date().toISOString()
        };
    }
    
    importData(data) {
        if (data.scenarios) {
            storage.set(this.SCENARIOS_KEY, data.scenarios);
        }
        if (data.settings) {
            storage.set(this.SETTINGS_KEY, data.settings);
        }
    }
    
    clearAll() {
        storage.clear();
    }
}
