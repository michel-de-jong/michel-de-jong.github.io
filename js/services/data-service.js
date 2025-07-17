// Data Service - Handles data persistence with performance optimizations
import { storage } from '../utils/storage-utils.js';

export class DataService {
    constructor() {
        // Storage keys
        this.SCENARIOS_KEY = 'saved_scenarios';
        this.PORTFOLIOS_KEY = 'saved_portfolios';
        this.SETTINGS_KEY = 'user_settings';
        this.PREFERENCES_KEY = 'user_preferences';
        
        // Limits (can be overridden from config)
        this.MAX_SCENARIOS = 50;
        this.MAX_PORTFOLIOS = 20;
        
        // Performance: Cache for frequently accessed data
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Performance: Track storage usage
        this.storageUsage = {
            scenarios: 0,
            portfolios: 0,
            total: 0
        };
    }
    
    // Scenarios
    saveScenario(scenario) {
        try {
            const scenarios = this.loadScenarios();
            
            // Add new scenario with metadata
            const newScenario = {
                ...scenario,
                id: scenario.id || this.generateId(),
                timestamp: scenario.timestamp || new Date().toISOString(),
                version: '2.0' // For future migration support
            };
            
            scenarios.push(newScenario);
            
            // Performance: Keep only latest MAX_SCENARIOS
            if (scenarios.length > this.MAX_SCENARIOS) {
                // Remove oldest scenarios
                const toRemove = scenarios.length - this.MAX_SCENARIOS;
                scenarios.splice(0, toRemove);
            }
            
            // Performance: Compress if enabled
            const dataToSave = this.shouldCompress() ? this.compress(scenarios) : scenarios;
            
            const success = storage.set(this.SCENARIOS_KEY, dataToSave);
            
            if (success) {
                // Update cache
                this.updateCache(this.SCENARIOS_KEY, scenarios);
                // Update storage usage
                this.updateStorageUsage();
            }
            
            return success;
        } catch (error) {
            console.error('Error saving scenario:', error);
            
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                throw error; // Let the app handle this
            }
            
            return false;
        }
    }
    
    loadScenarios() {
        // Performance: Check cache first
        const cached = this.getFromCache(this.SCENARIOS_KEY);
        if (cached) {
            return cached;
        }
        
        try {
            let data = storage.get(this.SCENARIOS_KEY) || [];
            
            // Performance: Decompress if needed
            if (this.isCompressed(data)) {
                data = this.decompress(data);
            }
            
            // Update cache
            this.updateCache(this.SCENARIOS_KEY, data);
            
            return data;
        } catch (error) {
            console.error('Error loading scenarios:', error);
            return [];
        }
    }
    
    deleteScenario(id) {
        const scenarios = this.loadScenarios();
        const filtered = scenarios.filter(s => s.id !== id);
        
        const success = storage.set(this.SCENARIOS_KEY, filtered);
        
        if (success) {
            this.updateCache(this.SCENARIOS_KEY, filtered);
            this.updateStorageUsage();
        }
        
        return success;
    }
    
    clearScenarios() {
        storage.remove(this.SCENARIOS_KEY);
        this.clearCache(this.SCENARIOS_KEY);
        this.updateStorageUsage();
    }
    
    // Portfolios
    savePortfolio(portfolio) {
        try {
            const portfolios = this.loadPortfolios();
            
            // Check if updating existing portfolio
            const existingIndex = portfolios.findIndex(p => p.id === portfolio.id);
            
            if (existingIndex !== -1) {
                // Update existing
                portfolios[existingIndex] = {
                    ...portfolios[existingIndex],
                    ...portfolio,
                    lastModified: new Date().toISOString()
                };
            } else {
                // Add new portfolio
                const newPortfolio = {
                    ...portfolio,
                    id: portfolio.id || this.generateId(),
                    timestamp: portfolio.timestamp || new Date().toISOString(),
                    version: '2.0'
                };
                
                portfolios.push(newPortfolio);
            }
            
            // Performance: Keep only latest MAX_PORTFOLIOS
            if (portfolios.length > this.MAX_PORTFOLIOS) {
                const toRemove = portfolios.length - this.MAX_PORTFOLIOS;
                portfolios.splice(0, toRemove);
            }
            
            // Performance: Compress if enabled
            const dataToSave = this.shouldCompress() ? this.compress(portfolios) : portfolios;
            
            const success = storage.set(this.PORTFOLIOS_KEY, dataToSave);
            
            if (success) {
                this.updateCache(this.PORTFOLIOS_KEY, portfolios);
                this.updateStorageUsage();
            }
            
            return success;
        } catch (error) {
            console.error('Error saving portfolio:', error);
            
            if (error.name === 'QuotaExceededError') {
                throw error;
            }
            
            return false;
        }
    }
    
    loadPortfolios() {
        // Performance: Check cache first
        const cached = this.getFromCache(this.PORTFOLIOS_KEY);
        if (cached) {
            return cached;
        }
        
        try {
            let data = storage.get(this.PORTFOLIOS_KEY) || [];
            
            // Performance: Decompress if needed
            if (this.isCompressed(data)) {
                data = this.decompress(data);
            }
            
            // Update cache
            this.updateCache(this.PORTFOLIOS_KEY, data);
            
            return data;
        } catch (error) {
            console.error('Error loading portfolios:', error);
            return [];
        }
    }
    
    deletePortfolio(id) {
        const portfolios = this.loadPortfolios();
        const filtered = portfolios.filter(p => p.id !== id);
        
        const success = storage.set(this.PORTFOLIOS_KEY, filtered);
        
        if (success) {
            this.updateCache(this.PORTFOLIOS_KEY, filtered);
            this.updateStorageUsage();
        }
        
        return success;
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
            
            const success = storage.set(this.PORTFOLIOS_KEY, portfolios);
            
            if (success) {
                this.updateCache(this.PORTFOLIOS_KEY, portfolios);
                this.updateStorageUsage();
            }
            
            return success;
        }
        
        return false;
    }
    
    clearPortfolios() {
        storage.remove(this.PORTFOLIOS_KEY);
        this.clearCache(this.PORTFOLIOS_KEY);
        this.updateStorageUsage();
    }
    
    // Settings
    saveSettings(settings) {
        const success = storage.set(this.SETTINGS_KEY, settings);
        if (success) {
            this.updateCache(this.SETTINGS_KEY, settings);
        }
        return success;
    }
    
    loadSettings() {
        const cached = this.getFromCache(this.SETTINGS_KEY);
        if (cached) {
            return cached;
        }
        
        const settings = storage.get(this.SETTINGS_KEY);
        if (settings) {
            this.updateCache(this.SETTINGS_KEY, settings);
        }
        
        return settings;
    }
    
    // Preferences
    savePreferences(preferences) {
        const success = storage.set(this.PREFERENCES_KEY, preferences);
        if (success) {
            this.updateCache(this.PREFERENCES_KEY, preferences);
        }
        return success;
    }
    
    loadPreferences() {
        const cached = this.getFromCache(this.PREFERENCES_KEY);
        if (cached) {
            return cached;
        }
        
        const preferences = storage.get(this.PREFERENCES_KEY);
        if (preferences) {
            this.updateCache(this.PREFERENCES_KEY, preferences);
        }
        
        return preferences;
    }
    
    // Performance: Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    updateCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
    
    // Performance: Compression (simple implementation)
    shouldCompress() {
        // Only compress if total storage usage is high
        return this.storageUsage.total > 1024 * 1024; // 1MB
    }
    
    compress(data) {
        // Simple compression: remove whitespace from JSON
        // In production, consider using a proper compression library
        return {
            compressed: true,
            data: JSON.stringify(data)
        };
    }
    
    decompress(data) {
        if (data && data.compressed) {
            return JSON.parse(data.data);
        }
        return data;
    }
    
    isCompressed(data) {
        return data && data.compressed === true;
    }
    
    // Helpers
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    exportData() {
        const data = {
            scenarios: this.loadScenarios(),
            portfolios: this.loadPortfolios(),
            settings: this.loadSettings(),
            preferences: this.loadPreferences(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        // Performance: Calculate export size
        const exportSize = JSON.stringify(data).length;
        console.log(`Export size: ${(exportSize / 1024).toFixed(2)}KB`);
        
        return data;
    }
    
    importData(data, options = {}) {
        try {
            // Validate import data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid import data');
            }
            
            // Version check
            if (data.version && data.version !== '2.0') {
                console.warn(`Importing data from version ${data.version}`);
                // Could implement migration logic here
            }
            
            const { merge = false } = options;
            
            if (data.scenarios) {
                if (merge) {
                    const existing = this.loadScenarios();
                    const merged = [...existing, ...data.scenarios];
                    storage.set(this.SCENARIOS_KEY, merged.slice(-this.MAX_SCENARIOS));
                } else {
                    storage.set(this.SCENARIOS_KEY, data.scenarios);
                }
            }
            
            if (data.portfolios) {
                if (merge) {
                    const existing = this.loadPortfolios();
                    const merged = [...existing, ...data.portfolios];
                    storage.set(this.PORTFOLIOS_KEY, merged.slice(-this.MAX_PORTFOLIOS));
                } else {
                    storage.set(this.PORTFOLIOS_KEY, data.portfolios);
                }
            }
            
            if (data.settings) {
                storage.set(this.SETTINGS_KEY, data.settings);
            }
            
            if (data.preferences) {
                storage.set(this.PREFERENCES_KEY, data.preferences);
            }
            
            // Clear cache after import
            this.clearCache();
            
            // Update storage usage
            this.updateStorageUsage();
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
    
    clearAll() {
        storage.clear();
        this.clearCache();
        this.storageUsage = {
            scenarios: 0,
            portfolios: 0,
            total: 0
        };
    }
    
    // Get storage size info
    getStorageInfo() {
        this.updateStorageUsage();
        
        const scenarios = this.loadScenarios();
        const portfolios = this.loadPortfolios();
        
        return {
            scenarioCount: scenarios.length,
            portfolioCount: portfolios.length,
            scenarioSize: this.storageUsage.scenarios,
            portfolioSize: this.storageUsage.portfolios,
            totalSize: this.storageUsage.total,
            totalSizeKB: (this.storageUsage.total / 1024).toFixed(2),
            totalSizeMB: (this.storageUsage.total / (1024 * 1024)).toFixed(2),
            maxScenarios: this.MAX_SCENARIOS,
            maxPortfolios: this.MAX_PORTFOLIOS,
            scenarioUtilization: (scenarios.length / this.MAX_SCENARIOS * 100).toFixed(1),
            portfolioUtilization: (portfolios.length / this.MAX_PORTFOLIOS * 100).toFixed(1)
        };
    }
    
    // Performance: Update storage usage statistics
    updateStorageUsage() {
        try {
            this.storageUsage.scenarios = this.calculateSize(this.SCENARIOS_KEY);
            this.storageUsage.portfolios = this.calculateSize(this.PORTFOLIOS_KEY);
            this.storageUsage.total = this.calculateTotalStorageSize();
        } catch (e) {
            console.error('Error calculating storage usage:', e);
        }
    }
    
    calculateSize(key) {
        try {
            const item = localStorage.getItem('roi_calculator_' + key);
            return item ? item.length + key.length : 0;
        } catch (e) {
            return 0;
        }
    }
    
    calculateTotalStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('roi_calculator_')) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (e) {
            return 0;
        }
    }
    
    // Performance: Batch operations
    batchSaveScenarios(scenarios) {
        try {
            // Validate array
            if (!Array.isArray(scenarios)) {
                throw new Error('Scenarios must be an array');
            }
            
            // Add metadata to all scenarios
            const processedScenarios = scenarios.map(scenario => ({
                ...scenario,
                id: scenario.id || this.generateId(),
                timestamp: scenario.timestamp || new Date().toISOString(),
                version: '2.0'
            }));
            
            // Limit to MAX_SCENARIOS most recent
            const toSave = processedScenarios.slice(-this.MAX_SCENARIOS);
            
            const success = storage.set(this.SCENARIOS_KEY, toSave);
            
            if (success) {
                this.updateCache(this.SCENARIOS_KEY, toSave);
                this.updateStorageUsage();
            }
            
            return success;
        } catch (error) {
            console.error('Error batch saving scenarios:', error);
            return false;
        }
    }
    
    batchSavePortfolios(portfolios) {
        try {
            if (!Array.isArray(portfolios)) {
                throw new Error('Portfolios must be an array');
            }
            
            const processedPortfolios = portfolios.map(portfolio => ({
                ...portfolio,
                id: portfolio.id || this.generateId(),
                timestamp: portfolio.timestamp || new Date().toISOString(),
                version: '2.0'
            }));
            
            const toSave = processedPortfolios.slice(-this.MAX_PORTFOLIOS);
            
            const success = storage.set(this.PORTFOLIOS_KEY, toSave);
            
            if (success) {
                this.updateCache(this.PORTFOLIOS_KEY, toSave);
                this.updateStorageUsage();
            }
            
            return success;
        } catch (error) {
            console.error('Error batch saving portfolios:', error);
            return false;
        }
    }
}