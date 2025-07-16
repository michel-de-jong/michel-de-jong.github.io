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
        this.state = new StateManager();
        this.calculator = new Calculator(this.state);
        this.dataService = new DataService();
        this.validationService = new ValidationService();
        this.historicalDataService = new HistoricalDataService();
        
        // Currency services
        this.currencyService = new CurrencyService();
        this.fxRiskAnalysis = new FXRiskAnalysis(this.currencyService);
        
        // UI Managers
        this.tabManager = new TabManager();
        this.chartManager = new ChartManager();
        this.formManager = new FormManager(this.validationService);
        this.kpiDisplay = new KPIDisplay();
        
        // Features
        this.portfolioFeature = new PortfolioFeature(this.chartManager);
        this.currencyPortfolioFeature = new CurrencyPortfolioFeature(
            this.portfolioFeature,
            this.currencyService,
            this.fxRiskAnalysis
        );
        
        this.features = {
            scenarios: new ScenariosFeature(this.calculator, this.chartManager),
            monteCarlo: new MonteCarloFeature(this.calculator, this.chartManager),
            waterfall: new WaterfallFeature(this.calculator, this.chartManager),
            portfolio: this.portfolioFeature,
            currencyPortfolio: this.currencyPortfolioFeature,
            saved: new SavedScenariosFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager),
            historical: new HistoricalFeature(this.calculator, this.chartManager, this.historicalDataService)
        };
        
        this.initialized = false;
    }
    
    async init() {
        try {
            console.log('Initializing ROI Calculator Application with Currency Support...');
            
            // Wait for libraries
            await this.waitForLibraries();
            
            // Initialize currency service
            await this.currencyService.initialize();
            
            // Initialize state with defaults
            this.state.loadDefaults(this.config.defaults);
            
            // Initialize UI components
            await this.initializeUI();
            
            // Initialize currency portfolio feature
            await this.currencyPortfolioFeature.initialize();
            
            // Set up event system
            this.setupEventSystem();
            
            // Load saved data
            this.loadSavedData();
            
            // Initial calculation
            this.calculate();
            
            this.initialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Er is een fout opgetreden bij het laden van de applicatie.');
        }
    }
    
    async initializeUI() {
        // Initialize tabs
        await this.tabManager.loadAllTemplates();
        
        // Initialize charts
        this.chartManager.initMainChart();
        
        // Initialize forms with state
        this.formManager.initialize(this.state);
        
        // Set up tab change handling
        this.tabManager.onTabChange((tabName) => {
            this.handleTabChange(tabName);
        });
    }
    
    setupEventSystem() {
        // State change listener
        this.state.onChange(() => {
            this.calculate();
        });
        
        // Form change listener
        this.formManager.onChange((changes) => {
            this.state.update({ inputs: changes });
        });
        
        // Feature event listeners
        Object.values(this.features).forEach(feature => {
            if (feature.setupListeners) {
                feature.setupListeners(this.state);
            }
        });
    }
    
    calculate() {
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
    
    async waitForLibraries() {
        const requiredLibs = ['Chart', 'XLSX', 'jspdf'];
        const checkInterval = 100;
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const allLoaded = requiredLibs.every(lib => 
                lib === 'jspdf' ? 
                    (window.jspdf || window.jsPDF) : 
                    window[lib]
            );
            
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
    
    // Check for essential elements - look for either tab-content or container class
    const mainContainer = document.querySelector('.tab-content') || 
                         document.querySelector('.container') ||
                         document.querySelector('main');
                         
    if (!mainContainer) {
        console.error('Main container not found. Looking for .tab-content, .container, or main element');
        return;
    }
    
    // Verify essential elements exist
    const calculatorSection = document.getElementById('calculator');
    const tabElements = document.querySelectorAll('.tab');
    
    if (!calculatorSection) {
        console.error('Calculator section not found');
        return;
    }
    
    if (tabElements.length === 0) {
        console.error('No tab elements found');
        return;
    }
    
    console.log('Essential elements found, creating application instance...');
    
    // Create and initialize app
    window.roiCalculatorApp = new ROICalculatorApp();
    await window.roiCalculatorApp.init();
});