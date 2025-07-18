// Main Application Entry Point with Enhanced Error Handling
// This version includes path resolution for GitHub Pages deployment

// Check if deployment config is available, otherwise use defaults
const DEPLOYMENT_CONFIG = window.DEPLOYMENT_CONFIG || {
    ENVIRONMENT: { DEBUG_MODE: true, SHOW_DETAILED_ERRORS: true },
    MODULE_LOADING: { MAX_RETRY_ATTEMPTS: 3, RETRY_DELAY: 2000, USE_MOCK_MODULES: true },
    DEBUGGING: { TIME_MODULE_LOADS: true, LOG_SUCCESS: true }
};

// Use deployment config base path function if available
const getBasePath = () => {
    if (window.getDeploymentBasePath) {
        return window.getDeploymentBasePath();
    }
    
    // Fallback to inline detection
    const path = window.location.pathname;
    if (window.location.hostname.includes('github.io')) {
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length > 0 && !pathParts[0].includes('.html')) {
            return `/${pathParts[0]}`;
        }
    }
    return '';
};

const BASE_PATH = getBasePath();

// Use deployment logger if available
const log = window.deploymentLog || ((category, ...args) => {
    if (DEPLOYMENT_CONFIG.ENVIRONMENT.DEBUG_MODE) {
        console.log(`[${category}]`, ...args);
    }
});

// Use deployment timer if available
const timer = window.deploymentTimer || {
    start: () => {},
    end: () => {}
};

// Enhanced module loader with error handling
const loadModule = async (modulePath, moduleName) => {
    const fullPath = `${BASE_PATH}${modulePath}`;
    try {
        timer.start(`load-${moduleName}`);
        log('Module Loading', `Loading ${moduleName} from ${fullPath}`);
        
        const module = await import(fullPath);
        
        timer.end(`load-${moduleName}`);
        if (DEPLOYMENT_CONFIG.DEBUGGING.LOG_SUCCESS) {
            log('Module Success', `Successfully loaded ${moduleName}`);
        }
        return module;
    } catch (error) {
        timer.end(`load-${moduleName}`);
        console.error(`Failed to load module ${moduleName} from ${fullPath}:`, error);
        
        // Show user-friendly error message
        showError(`Failed to load ${moduleName}. Please check if the file exists at: ${fullPath}`);
        
        // Return a mock module to prevent further errors
        if (DEPLOYMENT_CONFIG.MODULE_LOADING.USE_MOCK_MODULES) {
            return createMockModule(moduleName);
        }
        throw error;
    }
};

// Create mock modules for failed imports
const createMockModule = (moduleName) => {
    console.warn(`Creating mock module for: ${moduleName}`);
    const mockModules = {
        StateManager: class StateManager {
            constructor() { console.warn('Using mock StateManager'); }
            init() { return Promise.resolve(); }
            onChange() {}
            getInputs() { return {}; }
            saveInputs() {}
        },
        Calculator: class Calculator {
            constructor() { console.warn('Using mock Calculator'); }
            calculate() { return { success: false }; }
        },
        TabManager: class TabManager {
            constructor() { console.warn('Using mock TabManager'); }
            init() { return Promise.resolve(); }
            onTabChange() {}
        },
        ChartManager: class ChartManager {
            constructor() { console.warn('Using mock ChartManager'); }
            init() {}
            updateChart() {}
        },
        FormManager: class FormManager {
            constructor() { console.warn('Using mock FormManager'); }
            init() {}
            onChange() {}
        },
        KPIDisplay: class KPIDisplay {
            constructor() { console.warn('Using mock KPIDisplay'); }
            update() {}
        },
        DataService: class DataService {
            constructor() { console.warn('Using mock DataService'); }
        },
        ValidationService: class ValidationService {
            constructor() { console.warn('Using mock ValidationService'); }
            validate() { return { isValid: true }; }
        },
        HistoricalDataService: class HistoricalDataService {
            constructor() { console.warn('Using mock HistoricalDataService'); }
        },
        CurrencyService: class CurrencyService {
            constructor() { console.warn('Using mock CurrencyService'); }
        },
        FXRiskAnalysis: class FXRiskAnalysis {
            constructor() { console.warn('Using mock FXRiskAnalysis'); }
        }
    };
    
    // Return object with expected export
    const className = moduleName.split('/').pop().split('.')[0]
        .split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    
    return { [className]: mockModules[className] || class {} };
};

// Error display function
const showError = (message) => {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${message}
            <button onclick="this.parentElement.remove()" style="
                float: right;
                background: none;
                border: none;
                color: #721c24;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
                margin-left: 10px;
            ">&times;</button>
        `;
        errorContainer.style.display = 'block';
        errorContainer.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => errorDiv.remove(), 10000);
    } else {
        console.error('Error:', message);
    }
};

// Load all modules with error handling
const loadModules = async () => {
    const modules = {};
    
    // Core modules
    const coreModules = [
        { path: '/js/core/state.js', name: 'StateManager', key: 'state' },
        { path: '/js/core/calculator.js', name: 'Calculator', key: 'calculator' },
        { path: '/js/ui/tabs.js', name: 'TabManager', key: 'tabs' },
        { path: '/js/ui/charts.js', name: 'ChartManager', key: 'charts' },
        { path: '/js/ui/forms.js', name: 'FormManager', key: 'forms' },
        { path: '/js/ui/kpi.js', name: 'KPIDisplay', key: 'kpi' },
        { path: '/js/services/data-service.js', name: 'DataService', key: 'dataService' },
        { path: '/js/services/validation-service.js', name: 'ValidationService', key: 'validation' },
        { path: '/js/services/historical-data.js', name: 'HistoricalDataService', key: 'historicalData' },
        { path: '/js/services/currency-service.js', name: 'CurrencyService', key: 'currency' },
        { path: '/js/services/fx-risk-analysis.js', name: 'FXRiskAnalysis', key: 'fxRisk' }
    ];
    
    // Feature modules
    const featureModules = [
        { path: '/js/features/scenarios.js', name: 'ScenariosFeature', key: 'scenarios' },
        { path: '/js/features/montecarlo.js', name: 'MonteCarloFeature', key: 'montecarlo' },
        { path: '/js/features/waterfall.js', name: 'WaterfallFeature', key: 'waterfall' },
        { path: '/js/features/portfolio.js', name: 'PortfolioFeature', key: 'portfolio' },
        { path: '/js/features/historical.js', name: 'HistoricalFeature', key: 'historical' },
        { path: '/js/features/saved.js', name: 'SavedFeature', key: 'saved' },
        { path: '/js/features/export.js', name: 'ExportFeature', key: 'export' },
        { path: '/js/features/currency-portfolio.js', name: 'CurrencyPortfolioFeature', key: 'currencyPortfolio' }
    ];
    
    // Load core modules
    for (const moduleInfo of coreModules) {
        const module = await loadModule(moduleInfo.path, moduleInfo.name);
        modules[moduleInfo.key] = module[moduleInfo.name];
    }
    
    // Load feature modules
    modules.features = {};
    for (const moduleInfo of featureModules) {
        const module = await loadModule(moduleInfo.path, moduleInfo.name);
        modules.features[moduleInfo.key] = module[moduleInfo.name];
    }
    
    return modules;
};

// Application Configuration
const APP_CONFIG = {
    defaults: {
        startKapitaal: 100000,
        lening: 0,
        renteLening: 0,
        looptijd: 10,
        leningLooptijd: 10,
        rendementType: 'vast',
        rendement: 8,
        aflossingsType: 'lineair',
        herinvestering: 0,
        herinvesteringDrempel: 0,
        vasteKosten: 5000,
        belastingType: 'bv',
        inflatie: 2,
        inflatieToggle: false,
        priveSubType: 'normaal',
        box1Tarief: 49.5,
        box3Rendement: 6.17,
        box3Tarief: 36,
        box3Vrijstelling: 57000
    },
    chartDefaults: {
        responsive: true,
        maintainAspectRatio: false
    }
};

// Main Application Class
class ROICalculatorApp {
    constructor() {
        this.config = APP_CONFIG;
        this.initialized = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.modules = null;
    }
    
    async init() {
        if (this.initialized) {
            log('App', 'Already initialized');
            return;
        }
        
        try {
            this.initializationAttempts++;
            log('App', `Initializing ROI Calculator App (Attempt ${this.initializationAttempts})`);
            log('App', `Base path: ${BASE_PATH}`);
            log('App', `Debug mode: ${DEPLOYMENT_CONFIG.ENVIRONMENT.DEBUG_MODE}`);
            
            // Show loading indicator
            if (DEPLOYMENT_CONFIG.MODULE_LOADING.SHOW_LOADING_INDICATOR) {
                this.showLoadingIndicator(true);
            }
            
            // Load all modules
            timer.start('total-load-time');
            this.modules = await loadModules();
            timer.end('total-load-time');
            
            // Initialize core services
            await this.initializeCore();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Perform initial calculation
            this.performCalculation();
            
            this.initialized = true;
            log('App', 'Initialization complete');
            
            // Hide loading indicator
            this.showLoadingIndicator(false);
            
            // Show success message
            this.showSuccess('Application loaded successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            
            if (this.initializationAttempts < DEPLOYMENT_CONFIG.MODULE_LOADING.MAX_RETRY_ATTEMPTS) {
                log('App', `Retrying initialization in ${DEPLOYMENT_CONFIG.MODULE_LOADING.RETRY_DELAY}ms...`);
                setTimeout(() => this.init(), DEPLOYMENT_CONFIG.MODULE_LOADING.RETRY_DELAY);
            } else {
                this.showLoadingIndicator(false);
                showError(`Failed to initialize application after ${DEPLOYMENT_CONFIG.MODULE_LOADING.MAX_RETRY_ATTEMPTS} attempts. Please refresh the page.`);
            }
        }
    }
    
    showLoadingIndicator(show) {
        const existingLoader = document.getElementById('app-loader');
        
        if (show && !existingLoader) {
            const loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            loader.innerHTML = `
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #1e3c72;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="margin-top: 20px; color: #666;">Loading application...</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loader);
        } else if (!show && existingLoader) {
            existingLoader.remove();
        }
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 20px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            animation: slideIn 0.3s ease-out;
            z-index: 1000;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => successDiv.remove(), 3000);
    }
    
    async initializeCore() {
        log('Core', 'Initializing core services...');
        
        // Initialize state manager
        this.state = new this.modules.state(this.config.defaults);
        await this.state.init();
        
        // Initialize services
        this.validationService = new this.modules.validation();
        this.dataService = new this.modules.dataService();
        this.historicalDataService = new this.modules.historicalData();
        this.currencyService = new this.modules.currency();
        this.fxRiskAnalysis = new this.modules.fxRisk();
        
        // Initialize calculator
        this.calculator = new this.modules.calculator();
    }
    
    async initializeUI() {
        log('UI', 'Initializing UI components...');
        
        // Initialize UI managers
        this.tabManager = new this.modules.tabs();
        this.chartManager = new this.modules.charts(this.config.chartDefaults);
        this.formManager = new this.modules.forms(this.validationService);
        this.kpiDisplay = new this.modules.kpi();
        
        // Initialize tabs
        await this.tabManager.init();
        await this.tabManager.loadAllTemplates();
        
        // Initialize forms
        this.formManager.init(this.state);
        
        // Initialize charts
        this.chartManager.init();
    }
    
    async initializeFeatures() {
        log('Features', 'Initializing features...');
        
        // Initialize feature instances
        this.features = {
            scenarios: new this.modules.features.scenarios(this.calculator),
            montecarlo: new this.modules.features.montecarlo(this.calculator, this.chartManager),
            waterfall: new this.modules.features.waterfall(this.calculator, this.chartManager),
            portfolio: new this.modules.features.portfolio(this.dataService),
            historical: new this.modules.features.historical(this.calculator, this.chartManager, this.historicalDataService),
            saved: new this.modules.features.saved(this.state, this.dataService),
            export: new this.modules.features.export(this.state, this.chartManager)
        };
        
        // Initialize currency portfolio feature
        this.features.currencyPortfolio = new this.modules.features.currencyPortfolio(
            this.features.portfolio,
            this.currencyService,
            this.fxRiskAnalysis
        );
        
        // Setup feature listeners
        Object.values(this.features).forEach(feature => {
            if (feature.setupListeners) {
                feature.setupListeners(this.state);
            }
        });
        
        // Initialize currency portfolio
        if (this.features.currencyPortfolio.initialize) {
            await this.features.currencyPortfolio.initialize();
        }
        
        // Set data service for portfolio
        if (this.features.portfolio && this.dataService) {
            this.features.portfolio.setDataService(this.dataService);
        }
    }
    
    setupEventHandlers() {
        log('Events', 'Setting up event handlers...');
        
        // State change handler
        this.state.onChange((state) => {
            this.performCalculation();
        });
        
        // Tab change handler
        this.tabManager.onTabChange((tabName) => {
            this.handleTabChange(tabName);
        });
        
        // Form change handler with debouncing
        let debounceTimer;
        this.formManager.onChange((inputs) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.state.saveInputs(inputs);
            }, 300);
        });
    }
    
    performCalculation() {
        try {
            const inputs = this.state.getInputs();
            const result = this.calculator.calculate(inputs);
            
            if (result.success) {
                this.updateDisplay(result.data);
            }
        } catch (error) {
            console.error('Calculation error:', error);
            showError('Error performing calculation: ' + error.message);
        }
    }
    
    updateDisplay(data) {
        // Update KPIs
        this.kpiDisplay.update(data);
        
        // Update main chart
        this.chartManager.updateChart('mainChart', data);
        
        // Update active feature
        const activeTab = this.tabManager.getActiveTab();
        if (this.features[activeTab] && this.features[activeTab].update) {
            this.features[activeTab].update(data);
        }
    }
    
    handleTabChange(tabName) {
        log('Tab', `Switching to tab: ${tabName}`);
        
        // Update feature if needed
        if (this.features[tabName]) {
            const data = this.calculator.data;
            if (data && this.features[tabName].update) {
                this.features[tabName].update(data);
            }
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new ROICalculatorApp();
        window.app.init();
    });
} else {
    window.app = new ROICalculatorApp();
    window.app.init();
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);