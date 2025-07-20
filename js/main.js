// Main Application Entry Point
import { StateManager } from './core/state-manager.js';  // FIXED: Added hyphen
import { Calculator } from './core/calculator.js';
import { TabManager } from './ui/tabs.js';
import { ChartManager } from './ui/charts.js';
import { FormManager } from './ui/forms.js';
import { KPIDisplay } from './ui/kpi-display.js';
import { DataService } from './services/data-service.js';
import { ValidationService } from './services/validation-service.js';
import { HistoricalDataService } from './services/historical-data-service.js';
import { CurrencyService } from './services/currency-service.js';
import { FXRiskAnalysis } from './services/fx-risk-analysis.js';

// Feature Modules
import { ScenariosFeature } from './features/scenarios.js';
import { MonteCarloFeature } from './features/monte-carlo.js';
import { WaterfallFeature } from './features/waterfall.js';
import { PortfolioFeature } from './features/portfolio.js';
import { HistoricalFeature } from './features/historical.js';
import { SavedFeature } from './features/saved.js';
import { ExportFeature } from './features/export.js';
import { CurrencyPortfolioFeature } from './features/currency-portfolio.js';

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
    }
    
    async init() {
        if (this.initialized) {
            console.log('App already initialized');
            return;
        }
        
        this.initializationAttempts++;
        
        try {
            console.log(`Initializing ROI Calculator App (attempt ${this.initializationAttempts})...`);
            
            // Ensure DOM is fully loaded
            await this.ensureDOMReady();
            
            // Verify critical DOM elements exist
            if (!this.verifyDOMElements()) {
                throw new Error('Critical DOM elements missing');
            }
            
            // Initialize services
            this.initializeServices();
            
            // Initialize core components
            this.initializeCore();
            
            // Initialize UI
            this.initializeUI();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Perform initial calculation
            this.performCalculation();
            
            this.initialized = true;
            console.log('Application initialized successfully!');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleInitializationError(error);
        }
    }
    
    async ensureDOMReady() {
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }
        
        // Additional delay to ensure all elements are rendered
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    verifyDOMElements() {
        const requiredElements = [
            'startKapitaal',
            'calculator',
            'mainChart',
            'additionalTabs'
        ];
        
        const missingElements = [];
        
        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        }
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return false;
        }
        
        return true;
    }
    
    handleInitializationError(error) {
        if (this.initializationAttempts < this.maxInitAttempts) {
            console.log(`Retrying initialization in 500ms...`);
            setTimeout(() => this.init(), 500);
        } else {
            console.error('Failed to initialize after maximum attempts');
            this.showError('Applicatie kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.');
        }
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
        
        // Initialize UI components with state
        this.tabManager.initialize();
        this.chartManager.initialize();
        this.formManager.initialize(this.state);
        this.kpiDisplay.initialize();
    }
    
    async initializeFeatures() {
        console.log('Initializing features...');
        
        // Initialize feature modules
        this.features = {
            scenarios: new ScenariosFeature(this.calculator, this.chartManager),
            montecarlo: new MonteCarloFeature(this.calculator, this.chartManager),
            waterfall: new WaterfallFeature(this.calculator, this.chartManager),
            portfolio: new PortfolioFeature(this.chartManager),
            historical: new HistoricalFeature(this.calculator, this.chartManager, this.historicalDataService),
            saved: new SavedFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager)
        };
        
        // Initialize currency portfolio feature
        this.features.currencyPortfolio = new CurrencyPortfolioFeature(
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
        await this.features.currencyPortfolio.initialize();
        
        // Set data service for portfolio
        if (this.features.portfolio && this.dataService) {
            this.features.portfolio.setDataService(this.dataService);
        }
    }
    
    setupEventHandlers() {
        console.log('Setting up event handlers...');
        
        // State change handler
        this.state.onChange((state) => {
            this.performCalculation();
        });
        
        // Tab change handler
        this.tabManager.onTabChange((tabName) => {
            this.handleTabChange(tabName);
        });
        
        // Form change handler with debouncing
        let formChangeTimeout;
        this.formManager.onChange((inputs) => {
            clearTimeout(formChangeTimeout);
            formChangeTimeout = setTimeout(() => {
                console.log('Form inputs changed:', inputs);
                this.state.update({ inputs });
            }, 300);
        });
        
        // Real values toggle
        const realValuesCheckbox = document.getElementById('realValues');
        if (realValuesCheckbox) {
            realValuesCheckbox.addEventListener('change', (e) => {
                this.state.update({ ui: { showRealValues: e.target.checked } });
                this.updateUI();
            });
        }
        
        // Portfolio events integration
        document.addEventListener('portfolioLoaded', (e) => {
            console.log('Portfolio loaded event:', e.detail);
            this.handlePortfolioLoaded(e.detail);
        });
        
        document.addEventListener('portfolioSaved', (e) => {
            console.log('Portfolio saved event:', e.detail);
            this.handlePortfolioSaved(e.detail);
        });
    }
    
    performCalculation() {
        try {
            const inputs = this.state.getInputs();
            console.log('Performing calculation with inputs:', inputs);
            
            const results = this.calculator.calculate(inputs);
            
            this.state.setResults(results);
            this.updateUI();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Er is een fout opgetreden bij de berekening.');
        }
    }
    
    updateUI() {
        const results = this.state.getResults();
        const inputs = this.state.getInputs();
        const uiState = this.state.getUIState();
        
        // Update KPIs
        this.kpiDisplay.update(results, uiState.showRealValues);
        
        // Update main chart
        if (results && results.chartData) {
            this.chartManager.updateMainChart(results.chartData, uiState.showRealValues);
        }
    }
    
    handleTabChange(tabName) {
        console.log(`Tab changed to: ${tabName}`);
        
        // Activate feature if it has an activate method
        const feature = this.features[tabName];
        if (feature && feature.activate) {
            feature.activate(this.state);
        }
    }
    
    handlePortfolioLoaded(portfolio) {
        // Update state with portfolio data
        if (portfolio && portfolio.inputs) {
            this.state.update({ inputs: portfolio.inputs });
            this.performCalculation();
        }
    }
    
    handlePortfolioSaved(portfolio) {
        this.showSuccess('Portfolio succesvol opgeslagen!');
    }
    
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible">
                    ${message}
                    <button type="button" class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
                </div>
            `;
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
    }
    
    showSuccess(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible">
                    ${message}
                    <button type="button" class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
                </div>
            `;
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize app when DOM is ready
const app = new ROICalculatorApp();

// Try to initialize immediately if DOM is ready
if (document.readyState !== 'loading') {
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
} else {
    // Otherwise wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        app.init().catch(error => {
            console.error('Failed to initialize app:', error);
        });
    });
}

// Export app instance for debugging
window.roiApp = app;