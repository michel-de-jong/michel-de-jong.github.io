// Main entry point for ROI Calculator with Currency Support
import { Config } from './config/config.js';
import { StateManager } from './core/state-manager.js';
import { Calculator } from './core/calculator.js';
import { TabManager } from './ui/tabs.js';
import { ChartManager } from './ui/charts.js';
import { FormManager } from './ui/forms.js';
import { KPIDisplay } from './ui/kpi-display.js';
import { ScenariosFeature } from './features/scenarios.js';
import { MonteCarloFeature } from './features/monte-carlo.js';
import { WaterfallFeature } from './features/waterfall.js';
import { PortfolioFeature } from './features/portfolio.js';
import { CurrencyPortfolioFeature } from './features/currency-portfolio.js';
import { SavedScenariosFeature } from './features/saved.js';
import { ExportFeature } from './features/export.js';
import { HistoricalFeature } from './features/historical.js';
import { DataService } from './services/data-service.js';
import { ValidationService } from './services/validation-service.js';
import { HistoricalDataService } from './services/historical-data-service.js';
import { CurrencyService } from './services/currency-service.js';
import { FXRiskAnalysis } from './services/fx-risk-analysis.js';

class ROICalculatorApp {
    constructor() {
        this.config = Config;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log(`ROI Calculator v${this.config.app.version} initializing...`);
    }
    
    async init() {
        try {
            // Wait for DOM to be fully ready
            await this.waitForDOM();
            
            // Wait for required libraries to load
            await this.waitForLibraries();
            
            // Initialize services
            this.initializeServices();
            
            // Initialize core components
            this.initializeCore();
            
            // Initialize UI components
            this.initializeUI();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Load saved data
            this.loadSavedData();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Initial calculation
            this.performCalculation();
            
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
    
    initializeServices() {
        console.log('Initializing services...');
        
        this.dataService = new DataService();
        this.validationService = new ValidationService();
        this.historicalDataService = new HistoricalDataService();
        
        // Currency services
        this.currencyService = new CurrencyService();
        this.fxRiskAnalysis = new FXRiskAnalysis(this.currencyService);
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
        
        // Initialize state and calculator
        this.state = new StateManager();
        this.calculator = new Calculator(this.state);
        
        // Load default values
        this.state.loadDefaults(this.config.defaults);
    }
    
    initializeUI() {
        console.log('Initializing UI components...');
        
        // UI Managers
        this.tabManager = new TabManager();
        this.chartManager = new ChartManager();
        this.formManager = new FormManager(this.validationService);
        this.kpiDisplay = new KPIDisplay();
        
        // Initialize form manager with state
        this.formManager.initialize(this.state);
        
        // Initialize main chart
        this.chartManager.initMainChart();
    }
    
    async initializeFeatures() {
        console.log('Initializing features...');
        
        // Initialize base portfolio feature
        this.portfolioFeature = new PortfolioFeature(this.chartManager);
        
        // Initialize currency portfolio feature
        this.currencyPortfolioFeature = new CurrencyPortfolioFeature(
            this.portfolioFeature,
            this.currencyService,
            this.fxRiskAnalysis
        );
        
        // Initialize all features
        this.features = {
            scenarios: new ScenariosFeature(this.calculator, this.chartManager),
            monteCarlo: new MonteCarloFeature(this.calculator, this.chartManager),
            waterfall: new WaterfallFeature(this.calculator, this.chartManager),
            portfolio: this.portfolioFeature,
            currencyPortfolio: this.currencyPortfolioFeature,
            saved: new SavedScenariosFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager),
            historical: new HistoricalFeature(this.chartManager)
        };
        
        // Load all tab templates
        await this.tabManager.loadAllTemplates();
        
        // Setup feature listeners
        Object.values(this.features).forEach(feature => {
            if (feature.setupListeners) {
                feature.setupListeners(this.state);
            }
        });
        
        // Initialize currency features
        if (this.config.app.features.currency) {
            await this.currencyService.initialize();
            this.currencyPortfolioFeature.initialize();
        }
    }
    
    setupEventHandlers() {
        console.log('Setting up event handlers...');
        
        // State change handler
        this.state.onChange((state) => {
            this.performCalculation();
        });
        
        // Tab change handler
        this.tabManager.onChange((tabName) => {
            this.handleTabChange(tabName);
        });
        
        // Form change handler
        this.formManager.onChange((inputs) => {
            this.state.update({ inputs });
        });
        
        // Real values toggle
        const realValuesCheckbox = document.getElementById('realValues');
        if (realValuesCheckbox) {
            realValuesCheckbox.addEventListener('change', (e) => {
                this.state.update({ ui: { showRealValues: e.target.checked } });
                this.updateUI();
            });
        }
    }
    
    performCalculation() {
        try {
            const inputs = this.state.getInputs();
            const results = this.calculator.calculate(inputs);
            
            this.state.setResults(results);
            this.updateUI();
            
        } catch (error) {
            console.error('Calculation error:', error);
        }
    }
    
    updateUI() {
        const results = this.state.getResults();
        const inputs = this.state.getInputs();
        const uiState = this.state.getUIState();
        
        // Update KPIs
        this.kpiDisplay.update(results, uiState.showRealValues);
        
        // Update charts
        this.chartManager.updateMainChart(
            this.calculator.getChartData(uiState.showRealValues),
            uiState.showRealValues
        );
    }
    
    handleTabChange(tabName) {
        // Handle special case for portfolio tab
        if (tabName === 'portfolio') {
            // Activate both portfolio and currency features
            if (this.features.portfolio && this.features.portfolio.activate) {
                this.features.portfolio.activate(this.state);
            }
            // Currency portfolio feature is already initialized
            return;
        }
        
        const feature = this.features[tabName];
        if (feature && feature.activate) {
            feature.activate(this.state);
        }
    }
    
    loadSavedData() {
        const savedScenarios = this.dataService.loadScenarios();
        const savedSettings = this.dataService.loadSettings();
        
        if (savedSettings && savedSettings.inputs) {
            this.state.update(savedSettings);
        }
        
        // Make scenarios available to features
        if (this.features.saved) {
            this.features.saved.loadSavedScenarios(savedScenarios);
        }
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