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
        
        // Initialize feature modules - Create portfolio feature first
        const portfolioFeature = new PortfolioFeature(this.dataService);
        
        this.features = {
            scenarios: new ScenariosFeature(this.calculator, this.chartManager),
            montecarlo: new MonteCarloFeature(this.calculator, this.chartManager),
            waterfall: new WaterfallFeature(this.calculator, this.chartManager),
            portfolio: portfolioFeature,
            historical: new HistoricalFeature(this.calculator, this.chartManager, this.historicalDataService),
            saved: new SavedScenariosFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager),
            currencyPortfolio: new CurrencyPortfolioFeature(portfolioFeature, this.currencyService, this.fxRiskAnalysis)
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
                try {
                    console.log('Form inputs changed:', inputs);
                    if (this.state && typeof this.state.updateFromInputs === 'function') {
                        this.state.updateFromInputs(inputs);
                    } else {
                        console.error('State manager or updateFromInputs not properly initialized');
                    }
                } catch (error) {
                    console.error('Error updating form inputs:', error);
                }
            }, 300);
        });
        
        // Window resize handler for charts
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.chartManager.resize();
            }, 250);
        });
        
        // Print button handler
        const printBtn = document.getElementById('printReportBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Export handlers
        const exportHandlers = {
            'exportPDFBtn': () => this.features.export.exportPDF(),
            'exportExcelBtn': () => this.features.export.exportExcel(),
            'exportCSVBtn': () => this.features.export.exportCSV()
        };
        
        Object.entries(exportHandlers).forEach(([btnId, handler]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
        
        // Inflatie toggle handler
        const inflatieToggle = document.getElementById('inflatieToggle');
        if (inflatieToggle) {
            inflatieToggle.addEventListener('change', (e) => {
                const useRealValues = e.target.checked;
                
                // Update chart met real/nominaal values
                const chartData = this.calculator.getChartData(useRealValues);
                this.chartManager.updateMainChart(chartData, useRealValues);
                
                // Update KPIs met real/nominaal values
                if (this.latestResults) {
                    this.kpiDisplay.update(this.latestResults, useRealValues);
                }
            });
        }
    }
    
    performCalculation() {
        console.log('Performing calculation...');
        
        try {
            // Validate inputs
            const validation = this.validationService.validateCalculatorInputs(this.state.getAll());
            if (!validation.isValid) {
                console.warn('Validation failed:', validation.errors);
                this.displayValidationErrors(validation.errors);
                return;
            }
            
            // Clear any previous errors
            this.clearValidationErrors();
            
            // Calculate
            const results = this.calculator.calculate();
            console.log('Calculation results:', results);
            
            // Update displays
            this.updateDisplays(results);
            
            // Update features that depend on results
            this.updateFeatures(results);
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Er is een fout opgetreden bij de berekening. Controleer uw invoer.');
        }
    }
    
    updateDisplays(results) {
        // Update KPI displays
        this.kpiDisplay.update(results);
        
        // Update main chart - gebruik calculator.getChartData() voor de juiste data structuur
        const chartData = this.calculator.getChartData();
        this.chartManager.updateMainChart(chartData);
        
        // Update active tab specific displays
        const activeTab = this.tabManager.getActiveTab();
        this.updateTabDisplay(activeTab, results);
    }
    
    updateFeatures(results) {
        // Update scenarios if visible
        if (this.tabManager.getActiveTab() === 'scenarios') {
            this.features.scenarios.updateWithResults(results);
        }
        
        // Update waterfall if visible
        if (this.tabManager.getActiveTab() === 'waterfall') {
            this.features.waterfall.updateWithResults(results);
        }
        
        // Store latest results for other features
        this.latestResults = results;
    }
    
    handleTabChange(tabName) {
        console.log(`Tab changed to: ${tabName}`);
        
        // Load tab-specific content if needed
        if (this.latestResults) {
            this.updateTabDisplay(tabName, this.latestResults);
        }
        
        // Initialize tab-specific features if first time
        this.initializeTabFeatures(tabName);
    }
    
    updateTabDisplay(tabName, results) {
        switch (tabName) {
            case 'overzicht':
                // Gebruik calculator.getChartData() in plaats van results
                const chartData = this.calculator.getChartData();
                this.chartManager.updateMainChart(chartData);
                break;
            case 'scenarios':
                this.features.scenarios.updateWithResults(results);
                break;
            case 'montecarlo':
                this.features.montecarlo.updateWithResults(results);
                break;
            case 'waterfall':
                this.features.waterfall.updateWithResults(results);
                break;
            case 'portfolio':
                this.features.portfolio.updateWithResults(results);
                break;
            case 'historical':
                this.features.historical.updateWithResults(results);
                break;
            case 'saved':
                this.features.saved.updateWithResults(results);
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
        console.log('Performing initial calculation...');
        
        try {
            // Get initial inputs from state
            const initialInputs = this.state.getInputs();
            console.log('Initial inputs:', initialInputs);
            
            // Perform calculation
            const results = this.calculator.calculate();
            console.log('Initial calculation results:', results);
            
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
        console.warn('Validation errors:', errors);
        // Could implement UI feedback here
    }
    
    clearValidationErrors() {
        // Clear any displayed validation errors
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