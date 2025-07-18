// Deployment Configuration for GitHub Pages
// This file is for deployment and debugging purposes only
// Your main application config remains in js/config/config.js

window.DEPLOYMENT_CONFIG = {
    // IMPORTANT: Update this with your GitHub repository name
    // For example, if your repo URL is https://github.com/yourusername/roi-calculator
    // then set this to 'roi-calculator'
    GITHUB_REPO_NAME: '', // Leave empty for automatic detection
    
    // Deployment environment
    ENVIRONMENT: {
        // Set to true to enable debug logging
        DEBUG_MODE: true,
        
        // Show detailed error messages
        SHOW_DETAILED_ERRORS: true,
        
        // Log module loading attempts
        LOG_MODULE_LOADING: true,
        
        // Show performance metrics
        SHOW_PERFORMANCE_METRICS: false
    },
    
    // Module loading configuration
    MODULE_LOADING: {
        // Retry attempts for failed module loads
        MAX_RETRY_ATTEMPTS: 3,
        
        // Delay between retry attempts (ms)
        RETRY_DELAY: 2000,
        
        // Create mock modules for failed imports
        USE_MOCK_MODULES: true,
        
        // Show loading indicator
        SHOW_LOADING_INDICATOR: true
    },
    
    // Path configuration
    PATHS: {
        // Override base path detection (leave empty for auto-detection)
        FORCE_BASE_PATH: '',
        
        // Module directories (relative to base path)
        MODULES: {
            CORE: '/js/core/',
            UI: '/js/ui/',
            SERVICES: '/js/services/',
            FEATURES: '/js/features/',
            CONFIG: '/js/config/',
            UTILS: '/js/utils/',
            TAX: '/js/tax/'
        }
    },
    
    // Error reporting
    ERROR_REPORTING: {
        // Show errors in UI
        SHOW_UI_ERRORS: true,
        
        // Log errors to console
        LOG_TO_CONSOLE: true,
        
        // Error display duration (ms)
        ERROR_DISPLAY_DURATION: 10000
    },
    
    // Development/debugging features
    DEBUGGING: {
        // Enable module load timing
        TIME_MODULE_LOADS: true,
        
        // Log successful module loads
        LOG_SUCCESS: true,
        
        // Create diagnostic report on error
        AUTO_DIAGNOSTIC_REPORT: true
    }
};

// Helper function to get the correct base path
window.getDeploymentBasePath = function() {
    // Check for forced base path
    if (window.DEPLOYMENT_CONFIG.PATHS.FORCE_BASE_PATH) {
        return window.DEPLOYMENT_CONFIG.PATHS.FORCE_BASE_PATH;
    }
    
    // If repo name is explicitly set, use it
    if (window.DEPLOYMENT_CONFIG.GITHUB_REPO_NAME) {
        return `/${window.DEPLOYMENT_CONFIG.GITHUB_REPO_NAME}`;
    }
    
    // Otherwise, try to detect it
    const path = window.location.pathname;
    if (window.location.hostname.includes('github.io')) {
        const pathParts = path.split('/').filter(p => p && !p.includes('.html'));
        if (pathParts.length > 0) {
            return `/${pathParts[0]}`;
        }
    }
    
    // Default to root for local development
    return '';
};

// Debug logger
window.deploymentLog = function(category, ...args) {
    if (window.DEPLOYMENT_CONFIG.ENVIRONMENT.DEBUG_MODE) {
        console.log(`[${category}]`, ...args);
    }
};

// Performance timer
window.deploymentTimer = {
    timers: {},
    
    start: function(name) {
        if (window.DEPLOYMENT_CONFIG.DEBUGGING.TIME_MODULE_LOADS) {
            this.timers[name] = performance.now();
        }
    },
    
    end: function(name) {
        if (window.DEPLOYMENT_CONFIG.DEBUGGING.TIME_MODULE_LOADS && this.timers[name]) {
            const duration = performance.now() - this.timers[name];
            deploymentLog('Performance', `${name}: ${duration.toFixed(2)}ms`);
            delete this.timers[name];
        }
    }
};

// Export for use in modules
export default window.DEPLOYMENT_CONFIG;