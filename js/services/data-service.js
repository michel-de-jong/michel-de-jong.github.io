// Data Service - Handles data persistence
import { storage } from '../utils/storage-utils.js';

export class DataService {
    constructor() {
        this.SCENARIOS_KEY = 'saved_scenarios';
        this.PORTFOLIOS_KEY = 'saved_portfolios';
        this.SETTINGS_KEY = 'user_settings';
        this.PREFERENCES_KEY = 'user_preferences';
        this.MAX_SCENARIOS = 50;
        this.MAX_PORTFOLIOS = 20;
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
    
    // Portfolios
    savePortfolio(portfolio) {
        const portfolios = this.loadPortfolios();
        portfolios.push({
            ...portfolio,
            id: this.generateId(),
            timestamp: new Date().toISOString()
        });
        
        // Keep only latest MAX_PORTFOLIOS
        if (portfolios.length > this.MAX_PORTFOLIOS) {
            portfolios.shift();
        }
        
        return storage.set(this.PORTFOLIOS_KEY, portfolios);
    }
    
    loadPortfolios() {
        return storage.get(this.PORTFOLIOS_KEY) || [];
    }
    
    deletePortfolio(id) {
        const portfolios = this.loadPortfolios();
        const filtered = portfolios.filter(p => p.id !== id);
        return storage.set(this.PORTFOLIOS_KEY, filtered);
    }
    
    updatePortfolio(id, updates) {
        const portfolios = this.loadPortfolios();
        const index = portfolios.findIndex(p => p.id === id);
        
        if (index !== -1) {
            portfolios[index] = {
                ...portfolios[index],
                ...updates,
                lastModified: new Date().toISOString()
            };
            return storage.set(this.PORTFOLIOS_KEY, portfolios);
        }
        
        return false;
    }
    
    // Settings
    saveSettings(settings) {
        return storage.set(this.SETTINGS_KEY, settings);
    }
    
    loadSettings() {
        return storage.get(this.SETTINGS_KEY);
    }
    
    // Preferences
    savePreferences(preferences) {
        return storage.set(this.PREFERENCES_KEY, preferences);
    }
    
    loadPreferences() {
        return storage.get(this.PREFERENCES_KEY);
    }
    
    // Helpers
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    exportData() {
        return {
            scenarios: this.loadScenarios(),
            portfolios: this.loadPortfolios(),
            settings: this.loadSettings(),
            preferences: this.loadPreferences(),
            exportDate: new Date().toISOString()
        };
    }
    
    importData(data) {
        if (data.scenarios) {
            storage.set(this.SCENARIOS_KEY, data.scenarios);
        }
        if (data.portfolios) {
            storage.set(this.PORTFOLIOS_KEY, data.portfolios);
        }
        if (data.settings) {
            storage.set(this.SETTINGS_KEY, data.settings);
        }
        if (data.preferences) {
            storage.set(this.PREFERENCES_KEY, data.preferences);
        }
    }
    
    clearAll() {
        storage.clear();
    }
    
    // Get storage size info
    getStorageInfo() {
        const scenarios = this.loadScenarios();
        const portfolios = this.loadPortfolios();
        
        return {
            scenarioCount: scenarios.length,
            portfolioCount: portfolios.length,
            totalSize: this.calculateStorageSize(),
            maxScenarios: this.MAX_SCENARIOS,
            maxPortfolios: this.MAX_PORTFOLIOS
        };
    }
    
    calculateStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (e) {
            return 0;
        }
    }
}