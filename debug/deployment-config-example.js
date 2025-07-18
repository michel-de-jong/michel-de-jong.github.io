// Example Deployment Configuration
// Copy this file to deployment-config.js and update with your settings

window.DEPLOYMENT_CONFIG = {
    // For https://github.com/michel-de-jong/roi-calculator
    // Set this to 'roi-calculator'
    GITHUB_REPO_NAME: 'roi-calculator',
    
    // Production settings
    ENVIRONMENT: {
        DEBUG_MODE: false,
        SHOW_DETAILED_ERRORS: false,
        LOG_MODULE_LOADING: false,
        SHOW_PERFORMANCE_METRICS: false
    },
    
    // Module loading - production values
    MODULE_LOADING: {
        MAX_RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
        USE_MOCK_MODULES: false,
        SHOW_LOADING_INDICATOR: true
    },
    
    // Minimal error reporting in production
    ERROR_REPORTING: {
        SHOW_UI_ERRORS: true,
        LOG_TO_CONSOLE: false,
        ERROR_DISPLAY_DURATION: 5000
    },
    
    // Disable debugging features in production
    DEBUGGING: {
        TIME_MODULE_LOADS: false,
        LOG_SUCCESS: false,
        AUTO_DIAGNOSTIC_REPORT: false
    }
};