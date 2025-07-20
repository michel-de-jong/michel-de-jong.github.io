// Main Application Entry Point
import { Config } from './config/config.js';  // Import Config from config.js
import { StateManager } from './core/state-manager.js';
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
import { SavedScenariosFeature } from './features/saved.js';
import { ExportFeature } from './features/export.js';
import { CurrencyPortfolioFeature } from './features/currency-portfolio.js';

// Main Application Class
class ROICalculatorApp {
    constructor() {
        this.config = Config;  // Use Config from config.js
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
            console.log('Starting ROI Calculator initialization...');
            
            // Initialize services
            this.initializeServices();
            
            // Initialize core components
            this.initializeCore();
            
            // Initialize UI
            this.initializeUI();
            
            // Initialize feature modules
            await this.initializeFeatures();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Perform initial calculation
            this.performInitialCalculation();
            
            this.initialized = true;
            console.log('ROI Calculator initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            
            if (this.initializationAttempts < this.maxInitAttempts) {
                console.log(`Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxInitAttempts})...`);
                setTimeout(() => this.init(), 1000);
            } else {
                this.showFatalError('Kon de applicatie niet initialiseren. Ververs de pagina om het opnieuw te proberen.');
            }
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
        
        // Load default values from Config
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
            portfolio: new PortfolioFeature(this.dataService),
            historical: new HistoricalFeature(this.calculator, this.chartManager, this.historicalDataService),
            saved: new SavedScenariosFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager),
            currencyPortfolio: new CurrencyPortfolioFeature(this.currencyService, this.fxRiskAnalysis, this.calculator)
        };
        
        // Initialize each feature
        for (const [name, feature] of Object.entries(this.features)) {
            try {
                console.log(`Initializing feature: ${name}`);
                if (feature.initialize) {
                    await feature.initialize();
                }
            } catch (error) {
                console.error(`Error initializing feature ${name}:`, error);
            }
        }
    }
    
    setupEventHandlers() {
        console.log('Setting up event handlers...');
        
        // State change handler
        this.state.onChange((state) => {
            console.log('State changed:', state);
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
            
            // Add chartData to results
            const uiState = this.state.getUIState();
            results.chartData = this.calculator.getChartData(uiState.showRealValues);
            
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
    
    performInitialCalculation() {
        console.log('Performing initial calculation...');
        this.performCalculation();
    }
    
    showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.content-section') || document.body;
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    showSuccess(message) {
        console.log(message);
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = message;
        
        const container = document.querySelector('.content-section') || document.body;
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => successDiv.remove(), 5000);
    }
    
    showFatalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>Er is een fout opgetreden</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Pagina herladen</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Create and initialize app
    window.app = new ROICalculatorApp();
    window.app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = '<div class="error">Kon de applicatie niet laden. Ververs de pagina.</div>';
    });
});

// Export for debugging
export { ROICalculatorApp };