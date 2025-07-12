// Main entry point for ROI Calculator
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
import { SavedScenariosFeature } from './features/saved.js';
import { ExportFeature } from './features/export.js';
import { DataService } from './services/data-service.js';
import { ValidationService } from './services/validation-service.js';

class ROICalculatorApp {
    constructor() {
        this.config = Config;
        this.state = new StateManager();
        this.calculator = new Calculator(this.state);
        this.dataService = new DataService();
        this.validationService = new ValidationService();
        
        // UI Managers
        this.tabManager = new TabManager();
        this.chartManager = new ChartManager();
        this.formManager = new FormManager(this.validationService);
        this.kpiDisplay = new KPIDisplay();
        
        // Features
        this.features = {
            scenarios: new ScenariosFeature(this.calculator, this.chartManager),
            monteCarlo: new MonteCarloFeature(this.calculator, this.chartManager),
            waterfall: new WaterfallFeature(this.calculator, this.chartManager),
            portfolio: new PortfolioFeature(this.chartManager),
            saved: new SavedScenariosFeature(this.calculator, this.dataService),
            export: new ExportFeature(this.calculator, this.chartManager)
        };
        
        this.initialized = false;
    }
    
    async init() {
        try {
            console.log('Initializing ROI Calculator Application...');
            
            // Wait for libraries
            await this.waitForLibraries();
            
            // Initialize state with defaults
            this.state.loadDefaults(this.config.defaults);
            
            // Initialize UI components
            await this.initializeUI();
            
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
                lib === 'jspdf' ? window.jspdf : window[lib]
            );
            
            if (allLoaded) return;
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
        }
        
        throw new Error('Required libraries failed to load');
    }
    
    showError(message) {
        // Could be replaced with a better UI component
        alert(message);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    window.app = new ROICalculatorApp();
    window.app.init();
}

// Export for use in other modules if needed
export { ROICalculatorApp };