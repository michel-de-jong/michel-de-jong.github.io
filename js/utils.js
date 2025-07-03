// Utility functions for ROI Calculator

const Utils = {
    // Number Formatting
    formatNumber(num) {
        return new Intl.NumberFormat(Config.locale.language, {
            style: 'currency',
            currency: Config.locale.currency,
            ...Config.locale.numberFormat
        }).format(num);
    },
    
    formatPercentage(num) {
        return new Intl.NumberFormat(Config.locale.language, {
            style: 'percent',
            ...Config.locale.percentFormat
        }).format(num / 100);
    },
    
    // Input Validation
    validateInput(value, rules) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (rules.min !== null && num < rules.min) return false;
        if (rules.max !== null && num > rules.max) return false;
        return true;
    },
    
    // Debounce Function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle Function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Calculate Annuity Payment
    calculateAnnuity(principal, rate, months) {
        if (rate === 0) return principal / months;
        const r = rate / 12 / 100;
        return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    },
    
    // Calculate Linear Payment
    calculateLinearPayment(principal, rate, months, currentMonth) {
        const monthlyPrincipal = principal / months;
        const remainingPrincipal = principal - (monthlyPrincipal * currentMonth);
        const monthlyInterest = remainingPrincipal * (rate / 100 / 12);
        return monthlyPrincipal + monthlyInterest;
    },
    
    // Random Normal Distribution (Box-Muller transform)
    randomNormal() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },
    
    // Deep Clone Object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Get Current Date String
    getCurrentDateString() {
        return new Date().toLocaleDateString(Config.locale.language);
    },
    
    // Get ISO Date String
    getISODateString() {
        return new Date().toISOString().slice(0, 10);
    },
    
    // Parse Number from Locale String
    parseLocaleNumber(str) {
        // Remove currency symbols and spaces
        const cleaned = str.replace(/[€$\s]/g, '');
        // Replace comma with dot for parsing
        const normalized = cleaned.replace(',', '.');
        return parseFloat(normalized);
    },
    
    // Calculate Compound Interest
    compoundInterest(principal, rate, time, n = 12) {
        // A = P(1 + r/n)^(nt)
        return principal * Math.pow(1 + (rate / 100) / n, n * time);
    },
    
    // Calculate Present Value
    presentValue(futureValue, rate, time) {
        return futureValue / Math.pow(1 + rate / 100, time);
    },
    
    // Generate Unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Local Storage Helpers
    storage: {
        get(key) {
            try {
                const item = localStorage.getItem(Config.storage.prefix + key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(Config.storage.prefix + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error writing to localStorage:', e);
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(Config.storage.prefix + key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },
        
        clear() {
            try {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(Config.storage.prefix))
                    .forEach(key => localStorage.removeItem(key));
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    },
    
    // Export Helpers
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Chart Helpers
    createGradient(ctx, colorArray, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        colorArray.forEach((color, index) => {
            gradient.addColorStop(index / (colorArray.length - 1), color);
        });
        return gradient;
    },
    
    // Number Range Generator
    range(start, end, step = 1) {
        const arr = [];
        for (let i = start; i <= end; i += step) {
            arr.push(i);
        }
        return arr;
    },
    
    // Calculate Statistics
    statistics: {
        mean(arr) {
            return arr.reduce((a, b) => a + b, 0) / arr.length;
        },
        
        median(arr) {
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        },
        
        percentile(arr, p) {
            const sorted = [...arr].sort((a, b) => a - b);
            const index = (p / 100) * (sorted.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        },
        
        standardDeviation(arr) {
            const avg = this.mean(arr);
            const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
            return Math.sqrt(this.mean(squareDiffs));
        }
    },
    
    // Error Handling
    handleError(error, userMessage = 'Er is een fout opgetreden') {
        console.error('Error:', error);
        // In production, you might want to send this to an error tracking service
        if (Config.features.enableErrorTracking) {
            // Send to error tracking service
        }
        return userMessage;
    },
    
    // Performance Monitoring
    measurePerformance(name, fn) {
        if (!window.performance) return fn();
        
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        
        performance.mark(startMark);
        const result = fn();
        performance.mark(endMark);
        
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
        
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(name);
        
        return result;
    }
};

// Make Utils globally available
window.Utils = Utils;