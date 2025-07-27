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
            return;
        }
        
        this.initializationAttempts++;
        
        try {
            
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
            
        } catch (error) {
            console.error('Initialization error:', error);
            
            if (this.initializationAttempts < this.maxInitAttempts) {
                setTimeout(() => this.init(), 1000);
            } else {
                this.showFatalError('Kon de applicatie niet initialiseren. Ververs de pagina om het opnieuw te proberen.');
            }
        }
    }
    
    initializeServices() {
        
        this.dataService = new DataService();
        this.validationService = new ValidationService();
        this.historicalDataService = new HistoricalDataService();
        
        // Currency services
        this.currencyService = new CurrencyService();
        this.fxRiskAnalysis = new FXRiskAnalysis(this.currencyService);
    }
    
    initializeCore() {
        
        // Initialize state and calculator
        this.state = new StateManager();
        this.calculator = new Calculator(this.state);
        
        // Load default values from Config
        this.state.loadDefaults(this.config.defaults);
    }
    
    initializeUI() {
        
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
    // Create portfolio feature first as a variable for reference
    const portfolioFeature = new PortfolioFeature(this.chartManager, this.state, this.dataService);
    
    // Create all features with consistent naming
    this.features = {
        scenarios: new ScenariosFeature(this.calculator, this.chartManager),
        montecarlo: new MonteCarloFeature(this.calculator, this.chartManager),
        waterfall: new WaterfallFeature(this.calculator, this.chartManager),
        portfolio: portfolioFeature,  // Using consistent name 'portfolio'
        currencyPortfolio: new CurrencyPortfolioFeature(portfolioFeature, this.currencyService, this.fxRiskAnalysis),
        historical: new HistoricalFeature(this.calculator, this.chartManager, this.historicalDataService),
        saved: new SavedScenariosFeature(this.calculator, this.dataService),
        export: new ExportFeature(this.calculator, this.chartManager)
    };
    
    // Initialize each feature
    for (const [name, feature] of Object.entries(this.features)) {
        try {
            if (feature && typeof feature.initialize === 'function') {
                await feature.initialize();
                console.log(`Feature ${name} initialized successfully`);
            }
        } catch (error) {
            console.error(`Error initializing feature ${name}:`, error);
            // Continue with other features even if one fails
        }
    }
}
    
    setupEventHandlers() {
        
        // State change handler
        this.state.onChange((state) => {
        this.performCalculation();
        });
        
        // // Tab change handler
        // this.tabManager.onTabChange((tabName) => {
        //     this.handleTabChange(tabName);
        // });

        // Tab change handler
        this.tabManager.onTabChange((tabName) => {
            if (tabName === 'portfolio') {
                // Ensure portfolio is properly initialized when tab is activated
                if (this.features.portfolio && !this.features.portfolio.initialized) {
                    this.features.portfolio.initializePortfolio();
                    this.features.portfolio.initialized = true;
                }
                
                // Also ensure currency portfolio is initialized
                if (this.features.currencyPortfolio && !this.features.currencyPortfolio.initialized) {
                    this.features.currencyPortfolio.updateCurrencySelectors();
                    this.features.currencyPortfolio.initialized = true;
                }
            }
            
            // Handle other tabs if needed
            this.handleTabChange(tabName);
        });
        
        // Form change handler with debouncing
        let formChangeTimeout;
        this.formManager.onChange((inputs) => {
            clearTimeout(formChangeTimeout);
            formChangeTimeout = setTimeout(() => {
                this.state.update({ inputs });
            }, 300);
        });
        
        // Setup feature listeners
        for (const [name, feature] of Object.entries(this.features)) {
            if (feature.setupListeners) {
                feature.setupListeners(this.state);
            }
        }
    }
    
    performCalculation() {
        try {
            // Clear previous errors
            this.clearValidationErrors();
            
            // Get current inputs
            const inputs = this.state.getInputs();
            
            // Validate inputs
            const errors = this.validationService.validateInputs(inputs);
            
            // Display all errors
            if (errors.length > 0) {
                this.displayValidationErrors(errors);
                
                // Only stop calculation if there are critical errors
                const criticalErrors = errors.filter(error => error.critical);
                if (criticalErrors.length > 0) {
                    return;
                }
            }
            
            // Perform calculation
            const results = this.calculator.calculate();
            
            // Store results in state
            this.state.setResults(results);
            
            // Update displays
            this.updateDisplays(results);
            
            // Update features
            this.updateFeatures(results);
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Er is een fout opgetreden tijdens de berekening. Controleer uw invoer.');
        }
    }
    
    updateDisplays(results) {
        // Update KPI displays
        this.kpiDisplay.update(results);
        
        // Update main chart - gebruik calculator.getChartData() voor de juiste data structuur
        const chartData = this.calculator.getChartData();
        this.chartManager.updateMainChart(chartData);
        
        // Update active tab specific displays
        const activeTab = this.tabManager.getCurrentTab();
        this.updateTabDisplay(activeTab, results);
    }
    
    updateFeatures(results) {
        // Update scenarios if visible and method exists
        if (this.tabManager.getCurrentTab() === 'scenarios' && 
            this.features.scenarios && 
            typeof this.features.scenarios.updateWithResults === 'function') {
            this.features.scenarios.updateWithResults(results);
        }
        
        // Update waterfall if visible and method exists
        if (this.tabManager.getCurrentTab() === 'waterfall' && 
            this.features.waterfall && 
            typeof this.features.waterfall.updateWithResults === 'function') {
            this.features.waterfall.updateWithResults(results);
        }
        
        // Store latest results for other features
        this.latestResults = results;
    }
    
    handleTabChange(tabName) {
        
        // Load tab-specific content if needed
        if (this.latestResults) {
            this.updateTabDisplay(tabName, this.latestResults);
        }
        
        // Initialize tab-specific features if first time
        this.initializeTabFeatures(tabName);
    }
    
    updateTabDisplay(tabName, results) {
        // Check if feature exists and has updateWithResults method before calling
        switch (tabName) {
            case 'overzicht':
                // Gebruik calculator.getChartData() in plaats van results
                const chartData = this.calculator.getChartData();
                this.chartManager.updateMainChart(chartData);
                break;
            case 'scenarios':
                if (this.features.scenarios && typeof this.features.scenarios.updateWithResults === 'function') {
                    this.features.scenarios.updateWithResults(results);
                }
                break;
            case 'montecarlo':
                if (this.features.montecarlo && typeof this.features.montecarlo.updateWithResults === 'function') {
                    this.features.montecarlo.updateWithResults(results);
                }
                break;
            case 'waterfall':
                if (this.features.waterfall && typeof this.features.waterfall.updateWithResults === 'function') {
                    this.features.waterfall.updateWithResults(results);
                }
                break;
            case 'portfolio':
                if (this.features.portfolio && typeof this.features.portfolio.updateWithResults === 'function') {
                    this.features.portfolio.updateWithResults(results);
                }
                break;
            case 'historical':
                if (this.features.historical && typeof this.features.historical.updateWithResults === 'function') {
                    this.features.historical.updateWithResults(results);
                }
                break;
            case 'saved':
                if (this.features.saved && typeof this.features.saved.updateWithResults === 'function') {
                    this.features.saved.updateWithResults(results);
                }
                break;
        }
    }
    
    initializeTabFeatures(tabName) {
        // Initialize feature specific functionality when tab is first accessed
        if (this.features[tabName] && this.features[tabName].activate) {
            this.features[tabName].activate(this.state);
        }
    }
    
    performInitialCalculation() {
        
        try {
            // Get initial inputs from state
            const initialInputs = this.state.getInputs();
            
            // Perform calculation
            const results = this.calculator.calculate();
            
            // Update displays
            this.updateDisplays(results);
            
            // Store results for features
            this.latestResults = results;
            
        } catch (error) {
            console.error('Initial calculation error:', error);
            // Don't show error on initial load, just log it
        }
    }
    
    displayValidationErrors(errors) {
        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Display errors in the UI
        errors.forEach(error => {
            const inputElement = document.getElementById(error.field);
            if (inputElement) {
                // Add red border to invalid field
                inputElement.classList.add('invalid-input');
                
                // Add error message below the field
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = error.message;
                errorMessage.style.color = 'red';
                errorMessage.style.fontSize = '12px';
                errorMessage.style.marginTop = '5px';
                
                // Insert after the input wrapper
                const inputWrapper = inputElement.closest('.input-wrapper');
                if (inputWrapper) {
                    inputWrapper.after(errorMessage);
                }
            }
        });
    }
    
    clearValidationErrors() {
        // Remove error styling
        document.querySelectorAll('.invalid-input').forEach(el => {
            el.classList.remove('invalid-input');
        });
        
        // Remove error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.remove();
        });
    }
    
    showError(message) {
        console.error('Application error:', message);
        // Could show a user-friendly error message
        alert(message);
    }
    
    showFatalError(message) {
        console.error('Fatal error:', message);
        
        // Show error in UI
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <h2>Er is een fout opgetreden</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Pagina verversen
                    </button>
                </div>
            `;
        }
    }
    // Additional method to verify feature initialization
    verifyFeatureInitialization() {
        console.log('=== Feature Initialization Status ===');
        
        for (const [name, feature] of Object.entries(this.features)) {
            const status = feature && feature.initialized ? '✓ Initialized' : '✗ Not initialized';
            console.log(`${name}: ${status}`);
            
            // Log any specific feature dependencies
            if (name === 'currencyPortfolio' && feature) {
                console.log(`  - Portfolio reference: ${feature.portfolioFeature ? '✓' : '✗'}`);
                console.log(`  - Currency service: ${feature.currencyService ? '✓' : '✗'}`);
                console.log(`  - FX Risk Analysis: ${feature.fxRiskAnalysis ? '✓' : '✗'}`);
            }
        }
        
        console.log('=====================================');
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new ROICalculatorApp();
        window.app.init();
    });
} else {
    window.app = new ROICalculatorApp();
    window.app.init();
}

// Export for debugging
export { ROICalculatorApp };
