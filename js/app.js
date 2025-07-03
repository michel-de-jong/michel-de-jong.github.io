// Main Application Logic for ROI Calculator

class ROICalculatorApp {
    constructor() {
        this.initialized = false;
        this.currentTab = 'calculator';
        this.sharedInputs = null;
        this.eventListeners = [];
    }
    
    // Initialize the application
    async init() {
        try {
            console.log('Initializing ROI Calculator Application...');
            
            // Wait for libraries to load
            await this.waitForLibraries();
            
            // Load additional tabs
            this.loadAdditionalTabs();
            
            // Initialize charts
            chartManager.initMainChart();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load saved settings
            this.loadSettings();
            
            // Initial calculation
            this.calculate();
            
            // Load saved scenarios
            this.loadSavedScenarios();
            
            this.initialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Er is een fout opgetreden bij het laden van de applicatie. Ververs de pagina.');
        }
    }
    
    // Wait for external libraries to load
    waitForLibraries() {
        return new Promise((resolve) => {
            const checkLibraries = () => {
                if (typeof Chart !== 'undefined' && 
                    typeof XLSX !== 'undefined' && 
                    typeof window.jspdf !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            checkLibraries();
        });
    }
    
    // Load additional tab content
    loadAdditionalTabs() {
        const container = document.getElementById('additionalTabs');
        if (!container) return;
        
        // Add all tab templates
        Object.keys(TabTemplates).forEach(tabName => {
            container.insertAdjacentHTML('beforeend', TabTemplates[tabName]);
        });
    }
    
    // Set up all event listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Calculator inputs
        const calculatorInputs = document.querySelectorAll('#calculator input, #calculator select');
        calculatorInputs.forEach(input => {
            input.addEventListener('change', () => this.calculate());
            input.addEventListener('input', Utils.debounce(() => this.calculate(), Config.performance.debounceDelay));
        });
        
        // Inflation toggle
        document.getElementById('inflatieToggle').addEventListener('change', () => this.updateCharts());
        
        // Button click handler with event delegation
        document.addEventListener('click', (e) => {
            // Check if target or parent is a button with action
            const button = e.target.closest('button');
            if (button) {
                this.handleButtonClick(e);
            }
        });
        
        // Scenario inputs - wait for DOM to be ready
        setTimeout(() => {
            this.setupScenarioListeners();
        }, 100);
        
        // Window resize handler for charts
        window.addEventListener('resize', Utils.throttle(() => {
            Object.values(chartManager.charts).forEach(chart => {
                if (chart) chart.resize();
            });
        }, Config.performance.throttleDelay));
    }
    
    // Setup scenario specific listeners
    setupScenarioListeners() {
        // Scenario inputs
        const scenarioInputs = document.querySelectorAll('[id*="Case"]');
        scenarioInputs.forEach(input => {
            input.addEventListener('change', () => this.calculateScenarios());
            input.addEventListener('input', Utils.debounce(() => this.calculateScenarios(), Config.performance.debounceDelay));
        });
        
        // Monte Carlo inputs
        const mcInputs = document.querySelectorAll('[id^="mc"]');
        mcInputs.forEach(input => {
            if (input.id !== 'mcResults' && input.id !== 'mcLoading' && 
                input.id !== 'mcChartContainer' && input.id !== 'mcDistContainer') {
                input.addEventListener('change', () => {
                    input.setAttribute('data-user-modified', 'true');
                });
            }
        });
    }
    
    // Handle button clicks
    handleButtonClick(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const id = target.id;
        
        // Handle remove buttons
        if (target.classList.contains('btn-remove') || target.dataset.action === 'remove') {
            this.removeAsset(target);
            return;
        }
        
        // Handle specific button actions
        switch(id) {
            case 'runStressTestBtn':
                this.runStressTest();
                break;
            case 'runMonteCarloBtn':
                this.runMonteCarlo();
                break;
            case 'addAssetBtn':
                this.addAsset();
                break;
            case 'calculatePortfolioBtn':
                this.calculatePortfolio();
                break;
            case 'saveScenarioBtn':
                this.saveCurrentScenario();
                break;
            case 'exportExcelBtn':
                this.exportToExcel();
                break;
            case 'exportPDFBtn':
                this.exportToPDF();
                break;
            case 'exportChartsBtn':
                this.exportCharts();
                break;
        }
        
        // Handle load/delete scenario buttons
        if (target.hasAttribute('data-load-scenario')) {
            this.loadScenario(parseInt(target.getAttribute('data-load-scenario')));
        }
        if (target.hasAttribute('data-delete-scenario')) {
            this.deleteScenario(parseInt(target.getAttribute('data-delete-scenario')));
        }
    }
    
    // Switch between tabs
    switchTab(tabName) {
        if (!tabName) return;
        
        // Update UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
            tab.setAttribute('aria-selected', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabName);
        });
        
        this.currentTab = tabName;
        
        // Initialize tab-specific content
        setTimeout(() => {
            switch(tabName) {
                case 'scenarios':
                    if (!chartManager.charts.scenario) {
                        chartManager.initScenarioChart();
                    }
                    this.syncInputsToTab(tabName);
                    this.calculateScenarios();
                    break;
                case 'montecarlo':
                    if (!chartManager.charts.monteCarlo) {
                        chartManager.initMonteCarloCharts();
                    }
                    this.syncInputsToTab(tabName);
                    break;
                case 'waterfall':
                    if (!chartManager.charts.waterfall) {
                        chartManager.initWaterfallChart();
                        // Add waterfall period listener
                        const waterfallPeriod = document.getElementById('waterfallPeriod');
                        if (waterfallPeriod && !waterfallPeriod.hasAttribute('data-listener-added')) {
                            waterfallPeriod.addEventListener('change', () => this.updateWaterfall());
                            waterfallPeriod.setAttribute('data-listener-added', 'true');
                        }
                    }
                    this.updateWaterfall();
                    break;
                case 'portfolio':
                    if (!chartManager.charts.portfolio) {
                        chartManager.initPortfolioChart();
                    }
                    break;
                case 'saved':
                    this.loadSavedScenarios();
                    break;
            }
        }, 50);
    }
    
    // Sync inputs from calculator to other tabs
    syncInputsToTab(tabName) {
        const inputs = calculator.getInputValues();
        
        switch(tabName) {
            case 'scenarios':
                // Set base case to current values
                const baseCaseRendement = document.getElementById('baseCaseRendement');
                const baseCaseKosten = document.getElementById('baseCaseKosten');
                if (baseCaseRendement) baseCaseRendement.value = inputs.rendement;
                if (baseCaseKosten) baseCaseKosten.value = inputs.vasteKosten;
                
                // Set best case (20% better)
                const bestCaseRendement = document.getElementById('bestCaseRendement');
                const bestCaseKosten = document.getElementById('bestCaseKosten');
                if (bestCaseRendement) bestCaseRendement.value = (inputs.rendement * 1.2).toFixed(2);
                if (bestCaseKosten) bestCaseKosten.value = (inputs.vasteKosten * 0.8).toFixed(0);
                
                // Set worst case (40% worse)
                const worstCaseRendement = document.getElementById('worstCaseRendement');
                const worstCaseKosten = document.getElementById('worstCaseKosten');
                if (worstCaseRendement) worstCaseRendement.value = (inputs.rendement * 0.6).toFixed(2);
                if (worstCaseKosten) worstCaseKosten.value = (inputs.vasteKosten * 1.2).toFixed(0);
                break;
                
            case 'montecarlo':
                // Set volatility based on current rendement
                const mcVolatility = document.getElementByI