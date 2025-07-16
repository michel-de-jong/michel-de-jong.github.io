// ROI Calculator Main Application Entry Point
import Config from './config.js';
import { StateManager } from './core/state-manager.js';
import { UIController } from './ui/ui-controller.js';
import { ChartManager } from './ui/charts.js';
import { TabManager } from './ui/tabs.js';
import { Calculator } from './core/calculator.js';
import { InputManager } from './core/input-manager.js';
import { ExportManager } from './features/export.js';
import { ScenarioManager } from './features/scenarios.js';
import { MonteCarloFeature } from './features/monte-carlo.js';
import { TaxCalculator } from './features/tax-calculator.js';
import { HistoricalFeature } from './features/historical.js';
import { PortfolioFeature } from './features/portfolio.js';
import { WaterfallFeature } from './features/waterfall.js';
import { SavedScenariosFeature } from './features/saved-scenarios.js';

class ROICalculatorApp {
    constructor() {
        this.version = Config.version;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log(`ROI Calculator v${this.version} initializing...`);
    }
    
    async init() {
        try {
            // Wait a bit more to ensure DOM is fully ready
            await this.waitForDOM();
            
            // Wait for required libraries to load
            await this.waitForLibraries();
            
            // Initialize core components
            this.initializeCore();
            
            // Initialize UI components
            this.initializeUI();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Set initial state
            this.setInitialState();
            
            // Mark as initialized
            this.initialized = true;
            console.log('ROI Calculator initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            
            // Retry initialization if we haven't exceeded max retries
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
                setTimeout(() => this.init(), 1000);
            } else {
                this.showError('De applicatie kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.');
            }
        }
    }
    
    async waitForDOM() {
        // Extra wait to ensure DOM is completely ready
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Additional small delay for safety
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    initializeCore() {
        console.log('Initializing core components...');
        
        // Verify essential DOM elements exist
        const essentialElements = {
            container: document.querySelector('.container'),
            tabContent: document.querySelector('.tab-content'),
            mainElement: document.querySelector('main'),
            calculator: document.getElementById('calculator'),
            tabs: document.querySelectorAll('.tab')
        };
        
        // Check each element and provide specific error messages
        for (const [name, element] of Object.entries(essentialElements)) {
            if (!element || (name === 'tabs' && element.length === 0)) {
                console.error(`Essential element missing: ${name}`);
                throw new Error(`Required DOM element not found: ${name}`);
            }
        }
        
        console.log('All essential elements found');
        
        // Initialize state manager
        this.stateManager = new StateManager();
        
        // Initialize calculator
        this.calculator = new Calculator(this.stateManager);
        
        // Initialize input manager
        this.inputManager = new InputManager(this.stateManager, this.calculator);
        
        // Tax calculator
        this.taxCalculator = new TaxCalculator();
        
        console.log('Core components initialized');
    }
    
    initializeUI() {
        console.log('Initializing UI components...');
        
        // Initialize chart manager
        this.chartManager = new ChartManager();
        
        // Initialize UI controller
        this.uiController = new UIController(this.stateManager, this.chartManager);
        
        // Initialize tab manager
        this.tabManager = new TabManager();
        
        console.log('UI components initialized');
    }
    
    async initializeFeatures() {
        console.log('Initializing features...');
        
        // Initialize feature modules
        this.features = {
            export: new ExportManager(this.stateManager),
            scenarios: new ScenarioManager(this.stateManager, this.calculator, this.chartManager),
            monteCarlo: new MonteCarloFeature(this.stateManager, this.chartManager),
            historical: new HistoricalFeature(this.chartManager),
            portfolio: new PortfolioFeature(this.chartManager),
            waterfall: new WaterfallFeature(this.chartManager),
            savedScenarios: new SavedScenariosFeature(this.stateManager)
        };
        
        // Load all tab templates
        await this.tabManager.loadAllTemplates();
        
        // Setup feature listeners
        Object.values(this.features).forEach(feature => {
            if (feature.setupListeners) {
                feature.setupListeners(this.stateManager);
            }
        });
        
        console.log('Features initialized');
    }
    
    setInitialState() {
        console.log('Setting initial state...');
        
        // Set default values from config
        const defaults = Config.defaults;
        
        // Safely set values only if elements exist
        const setValueSafe = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        };
        
        setValueSafe('startKapitaal', defaults.startKapitaal);
        setValueSafe('lening', defaults.lening);
        setValueSafe('rentePercentage', defaults.rentePercentage);
        setValueSafe('looptijd', defaults.looptijd);
        setValueSafe('rendementPercentage', defaults.rendementPercentage);
        setValueSafe('inflatiePercentage', defaults.inflatiePercentage);
        setValueSafe('vpbTarief', defaults.vpbTarief);
        setValueSafe('box3Tarief', defaults.box3Tarief);
        
        // Set tax regime
        const taxRegime = document.getElementById('taxRegime');
        if (taxRegime) {
            taxRegime.value = defaults.belastingRegime;
        }
        
        // Trigger initial calculation
        if (this.inputManager && this.inputManager.handleInputChange) {
            this.inputManager.handleInputChange();
        }
        
        console.log('Initial state set');
    }
    
    async waitForLibraries(timeout = 30000) {
        console.log('Waiting for external libraries...');
        const startTime = Date.now();
        const checkInterval = 100;
        const maxAttempts = timeout / checkInterval;
        
        const requiredLibs = {
            'Chart': window.Chart,
            'XLSX': window.XLSX,
            'jsPDF': window.jspdf || window.jsPDF
        };
        
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const allLoaded = Object.entries(requiredLibs).every(([lib, global]) => {
                const loaded = lib === 'jsPDF' ? 
                    (window.jspdf || window.jsPDF) : 
                    window[lib];
                
                if (!loaded) {
                    console.log(`Waiting for ${lib}...`);
                }
                
                return loaded;
            });
            
            if (allLoaded) {
                console.log('All required libraries loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
        }
        
        throw new Error('Required libraries failed to load');
    }
    
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible">
                    <strong>Fout:</strong> ${message}
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                </div>
            `;
            errorContainer.style.display = 'block';
            
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application...');
    
    // Create and initialize app
    window.roiCalculatorApp = new ROICalculatorApp();
    await window.roiCalculatorApp.init();
});

// Also listen for window load as a fallback
window.addEventListener('load', () => {
    console.log('Window loaded');
    
    // If app hasn't initialized yet, try again
    if (!window.roiCalculatorApp || !window.roiCalculatorApp.initialized) {
        console.log('App not initialized on window load, attempting initialization...');
        if (!window.roiCalculatorApp) {
            window.roiCalculatorApp = new ROICalculatorApp();
        }
        window.roiCalculatorApp.init();
    }
});