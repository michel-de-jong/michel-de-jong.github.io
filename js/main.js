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
        
        // Performance: Track initialization time
        this.initStartTime = performance.now();
        
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
            
            // Performance: Lazy load saved data
            this.scheduleSavedDataLoad();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Initial calculation
            this.performCalculation();
            
            // Mark as initialized
            this.initialized = true;
            
            // Performance: Log initialization time
            const initTime = performance.now() - this.initStartTime;
            console.log(`ROI Calculator initialized successfully in ${initTime.toFixed(2)}ms`);
            
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
        
        // Initialize currency features if currency service is available
        if (this.currencyService && this.currencyPortfolioFeature && this.currencyPortfolioFeature.initialize) {
            try {
                await this.currencyService.initialize();
                await this.currencyPortfolioFeature.initialize();
                console.log('Currency features initialized');
            } catch (error) {
                console.warn('Currency features initialization failed:', error);
                // Continue without currency features - non-critical error
            }
        }
        
        // Portfolio Feature Integration: Set up data service in portfolio feature
        if (this.portfolioFeature && this.portfolioFeature.setDataService) {
            this.portfolioFeature.setDataService(this.dataService);
        }
    }
    
    setupEventHandlers() {
        console.log('Setting up event handlers...');
        
        // State change handler
        this.state.onChange((state) => {
            this.performCalculation();
        });
        
        // Tab change handler - Fixed: using onTabChange instead of onChange
        this.tabManager.onTabChange((tabName) => {
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
        
        // Special handling for specific tabs
        switch(tabName) {
            case 'portfolio':
                if (this.features.portfolio) {
                    this.features.portfolio.refresh();
                }
                break;
                
            case 'historical':
                if (this.features.historical) {
                    this.features.historical.loadHistoricalData();
                }
                break;
        }
    }
    
    async waitForLibraries() {
        const requiredLibs = ['Chart', 'XLSX', 'jsPDF'];
        const maxAttempts = 50;
        const checkInterval = 100;
        
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const allLoaded = requiredLibs.every(lib => {
                const loaded = window[lib] || 
                    (lib === 'jsPDF' && window.jspdf) || 
                    (lib === 'jsPDF' && window.jsPDF);
                
                // Store jsPDF reference consistently
                if (lib === 'jsPDF' && loaded && !window.jsPDF) {
                    window.jsPDF = (window.jspdf && window.jspdf.jsPDF) || 
                                   (window.jspdf || window.jsPDF);
                }
                
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
    
    // Performance: Lazy load saved data after initial render
    scheduleSavedDataLoad() {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadSavedData(), { timeout: 2000 });
        } else {
            setTimeout(() => this.loadSavedData(), 500);
        }
    }
    
    loadSavedData() {
        try {
            console.log('Loading saved data...');
            
            // Performance: Check storage quota before loading
            this.checkStorageQuota();
            
            // Load saved scenarios with limit check
            const savedScenarios = this.dataService.loadScenarios();
            if (savedScenarios && savedScenarios.length > 0) {
                console.log(`Loaded ${savedScenarios.length} saved scenarios`);
                
                // Pass scenarios to saved feature if available
                if (this.features && this.features.saved) {
                    this.features.saved.loadSavedScenarios(savedScenarios);
                }
                
                // Performance: Warn if approaching limit
                if (savedScenarios.length > this.config.performance.storage.maxScenarios * 0.8) {
                    console.warn(`Approaching scenario limit (${savedScenarios.length}/${this.config.performance.storage.maxScenarios})`);
                }
            }
            
            // Portfolio Feature Integration: Coordinate portfolio loading
            this.loadPortfolioData();
            
            // Load user settings/preferences
            const settings = this.dataService.loadSettings();
            if (settings) {
                this.state.update({ settings });
                console.log('Loaded user settings');
            }
            
            // Load preferences
            const preferences = this.dataService.loadPreferences();
            if (preferences) {
                this.state.update({ preferences });
                console.log('Loaded user preferences');
            }
            
        } catch (error) {
            console.warn('Failed to load saved data:', error);
            
            // Performance: Handle quota exceeded errors
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded();
            }
        }
    }
    
    // Portfolio Feature Integration: Unified portfolio loading
    loadPortfolioData() {
        try {
            const savedPortfolios = this.dataService.loadPortfolios();
            
            if (savedPortfolios && savedPortfolios.length > 0) {
                console.log(`Loaded ${savedPortfolios.length} saved portfolios from DataService`);
                
                // Check if PortfolioFeature has its own loading mechanism
                if (this.features && this.features.portfolio) {
                    if (this.features.portfolio.loadSavedPortfolios) {
                        // Use PortfolioFeature's own loading method
                        this.features.portfolio.loadSavedPortfolios(savedPortfolios);
                    } else if (this.features.portfolio.setPortfolios) {
                        // Set portfolios directly
                        this.features.portfolio.setPortfolios(savedPortfolios);
                    }
                }
                
                // Performance: Warn if approaching limit
                if (savedPortfolios.length > this.config.performance.storage.maxPortfolios * 0.8) {
                    console.warn(`Approaching portfolio limit (${savedPortfolios.length}/${this.config.performance.storage.maxPortfolios})`);
                }
            }
        } catch (error) {
            console.error('Error loading portfolio data:', error);
        }
    }
    
    // Portfolio event handlers
    handlePortfolioLoaded(detail) {
        if (detail && detail.assets) {
            // Update state with loaded portfolio
            this.state.update({ 
                currentPortfolio: detail.assets,
                portfolioLastModified: new Date().toISOString()
            });
        }
    }
    
    handlePortfolioSaved(detail) {
        if (detail && detail.portfolio) {
            // Save portfolio through DataService
            const success = this.dataService.savePortfolio(detail.portfolio);
            if (success) {
                this.showSuccess('Portfolio succesvol opgeslagen');
            } else {
                this.showError('Fout bij het opslaan van portfolio');
            }
        }
    }
    
    // Performance: Check storage quota
    checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                const percentUsed = (estimate.usage / estimate.quota) * 100;
                console.log(`Storage used: ${percentUsed.toFixed(2)}%`);
                
                if (percentUsed > 90) {
                    console.warn('Storage quota nearly exceeded');
                    this.showWarning('Opslagruimte bijna vol. Overweeg oude gegevens te verwijderen.');
                }
            });
        }
    }
    
    // Performance: Handle storage quota exceeded
    handleStorageQuotaExceeded() {
        console.error('Storage quota exceeded');
        
        // Get storage info
        const storageInfo = this.dataService.getStorageInfo();
        
        this.showError(
            `Opslaglimiet bereikt. U heeft ${storageInfo.scenarioCount} scenario's ` +
            `en ${storageInfo.portfolioCount} portfolio's opgeslagen. ` +
            `Verwijder oude gegevens om ruimte vrij te maken.`
        );
        
        // Offer to clean up old data
        if (confirm('Wilt u oude scenario\'s automatisch opruimen?')) {
            this.cleanupOldData();
        }
    }
    
    // Performance: Clean up old data
    cleanupOldData() {
        try {
            // Get all scenarios and sort by date
            const scenarios = this.dataService.loadScenarios();
            const maxScenarios = Math.floor(this.config.performance.storage.maxScenarios * 0.7); // Keep 70%
            
            if (scenarios.length > maxScenarios) {
                // Sort by timestamp and keep only the most recent
                scenarios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const toKeep = scenarios.slice(0, maxScenarios);
                
                // Clear and re-save
                this.dataService.clearScenarios();
                toKeep.forEach(scenario => this.dataService.saveScenario(scenario));
                
                this.showSuccess(`${scenarios.length - maxScenarios} oude scenario's verwijderd`);
            }
            
            // Do the same for portfolios
            const portfolios = this.dataService.loadPortfolios();
            const maxPortfolios = Math.floor(this.config.performance.storage.maxPortfolios * 0.7);
            
            if (portfolios.length > maxPortfolios) {
                portfolios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const toKeep = portfolios.slice(0, maxPortfolios);
                
                this.dataService.clearPortfolios();
                toKeep.forEach(portfolio => this.dataService.savePortfolio(portfolio));
                
                this.showSuccess(`${portfolios.length - maxPortfolios} oude portfolio's verwijderd`);
            }
        } catch (error) {
            console.error('Error cleaning up data:', error);
            this.showError('Fout bij het opruimen van gegevens');
        }
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
    
    showSuccess(message) {
        const successContainer = document.getElementById('successContainer') || document.getElementById('errorContainer');
        if (successContainer) {
            successContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible">
                    <strong>Succes:</strong> ${message}
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                </div>
            `;
            successContainer.style.display = 'block';
            
            setTimeout(() => {
                successContainer.style.display = 'none';
            }, 3000);
        }
    }
    
    showWarning(message) {
        const warningContainer = document.getElementById('warningContainer') || document.getElementById('errorContainer');
        if (warningContainer) {
            warningContainer.innerHTML = `
                <div class="alert alert-warning alert-dismissible">
                    <strong>Waarschuwing:</strong> ${message}
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                </div>
            `;
            warningContainer.style.display = 'block';
            
            setTimeout(() => {
                warningContainer.style.display = 'none';
            }, 4000);
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