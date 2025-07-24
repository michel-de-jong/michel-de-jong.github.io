// Storage Utilities - Enhanced with quota management and error handling
const STORAGE_PREFIX = 'roi_calculator_';

export const storage = {
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed value or null
     */
    get(key) {
        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            
            // Handle corrupted data
            if (e instanceof SyntaxError) {
                console.warn(`Corrupted data for key ${key}, removing...`);
                this.remove(key);
            }
            
            return null;
        }
    },
    
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(STORAGE_PREFIX + key, serialized);
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            
            // Handle quota exceeded
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded');
                
                // Try to free up space by removing old data
                if (this.cleanupOldData()) {
                    // Retry after cleanup
                    try {
                        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
                        return true;
                    } catch (retryError) {
                        console.error('Still failed after cleanup:', retryError);
                    }
                }
                
                // Re-throw to let app handle it
                throw e;
            }
            
            return false;
        }
    },
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    /**
     * Clear all items with our prefix
     * @returns {boolean} Success status
     */
    clear() {
        try {
            const keysToRemove = [];
            
            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove them
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    },
    
    /**
     * Check if a key exists
     * @param {string} key - Storage key
     * @returns {boolean} Whether key exists
     */
    has(key) {
        return localStorage.getItem(STORAGE_PREFIX + key) !== null;
    },
    
    /**
     * Get all keys with our prefix
     * @returns {string[]} Array of keys (without prefix)
     */
    keys() {
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keys.push(key.substring(STORAGE_PREFIX.length));
            }
        }
        
        return keys;
    },
    
    /**
     * Get storage size for our prefix
     * @returns {number} Size in bytes
     */
    getSize() {
        let size = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                const value = localStorage.getItem(key);
                if (value) {
                    size += key.length + value.length;
                }
            }
        }
        
        return size;
    },
    
    /**
     * Get storage quota information
     * @returns {Promise<object>} Quota information
     */
    async getQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                    usageDetails: estimate.usageDetails || {},
                    percentUsed: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
                };
            } catch (e) {
                console.error('Error getting storage quota:', e);
            }
        }
        
        // Fallback: estimate based on localStorage size
        const size = this.getSize();
        const estimatedQuota = 10 * 1024 * 1024; // 10MB typical limit
        
        return {
            usage: size,
            quota: estimatedQuota,
            percentUsed: (size / estimatedQuota) * 100,
            fallback: true
        };
    },
    
    /**
     * Check if storage is available
     * @returns {boolean} Whether localStorage is available
     */
    isAvailable() {
        try {
            const testKey = STORAGE_PREFIX + '_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Clean up old data to free space
     * @returns {boolean} Whether cleanup was successful
     */
    cleanupOldData() {
        try {
            // Get all our keys with timestamps
            const items = [];
            
            this.keys().forEach(key => {
                const data = this.get(key);
                if (data && (data.timestamp || data.savedAt || data.exportDate)) {
                    items.push({
                        key,
                        timestamp: new Date(data.timestamp || data.savedAt || data.exportDate).getTime(),
                        size: JSON.stringify(data).length
                    });
                }
            });
            
            // Sort by timestamp (oldest first)
            items.sort((a, b) => a.timestamp - b.timestamp);
            
            // Remove oldest 20% of items
            const toRemove = Math.floor(items.length * 0.2);
            let removed = 0;
            
            for (let i = 0; i < toRemove && i < items.length; i++) {
                if (this.remove(items[i].key)) {
                    removed++;
                }
            }
            
            return removed > 0;
            
        } catch (e) {
            console.error('Error during cleanup:', e);
            return false;
        }
    },
    
    /**
     * Export all data
     * @returns {object} All stored data
     */
    exportAll() {
        const data = {};
        
        this.keys().forEach(key => {
            data[key] = this.get(key);
        });
        
        return data;
    },
    
    /**
     * Import data
     * @param {object} data - Data to import
     * @param {boolean} merge - Whether to merge with existing data
     * @returns {boolean} Success status
     */
    importAll(data, merge = false) {
        try {
            if (!merge) {
                this.clear();
            }
            
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
};

// Utility functions for working with storage

/**
 * Compress JSON data using simple techniques
 * @param {any} data - Data to compress
 * @returns {string} Compressed string
 */
export function compressJSON(data) {
    // Simple compression: remove whitespace
    return JSON.stringify(data);
}

/**
 * Decompress JSON data
 * @param {string} compressed - Compressed string
 * @returns {any} Decompressed data
 */
export function decompressJSON(compressed) {
    return JSON.parse(compressed);
}

/**
 * Calculate size of data in bytes
 * @param {any} data - Data to measure
 * @returns {number} Size in bytes
 */
export function getDataSize(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return new Blob([str]).size;
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export default storage object for convenience
export default storage;
