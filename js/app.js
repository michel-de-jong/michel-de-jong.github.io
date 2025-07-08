// Main Application Logic for ROI Calculator - FIXED VERSION WITH TEMPLATE LOADING

class ROICalculatorApp {
    constructor() {
        this.initialized = false;
        this.currentTab = 'calculator';
        this.sharedInputs = null;
        this.eventListeners = [];
        this.tabsLoaded = new Set(); // Track which tabs have been loaded
    }
    
    // Initialize the application
    async init() {
        try {
            console.log('Initializing ROI Calculator Application...');
            
            // Wait for libraries to load
            await this.waitForLibraries();
            
            // Load defaults from config FIRST
            this.loadConfigDefaults();
            
            // Load all tab templates at startup
            await this.loadAllTemplates();
            
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
    
    // Load all templates at startup
    async loadAllTemplates() {
        const container = document.getElementById('additionalTabs');
        if (!container) return;
        
        console.log('Loading all tab templates...');
        
        // For fallback, add inline templates if fetch fails
        if (typeof tabManager === 'undefined' || !tabManager.loadTemplate) {
            console.log('Using fallback template loading');
            this.loadFallbackTemplates(container);
            return;
        }
        
        // Try to load templates via tabManager
        const tabs = ['scenarios', 'montecarlo', 'waterfall', 'portfolio', 'saved', 'export'];
        
        for (const tabName of tabs) {
            try {
                await tabManager.initializeTab(tabName, container);
                this.tabsLoaded.add(tabName);
                console.log(`Loaded template: ${tabName}`);
            } catch (error) {
                console.error(`Failed to load template ${tabName}:`, error);
                // Load fallback template
                this.loadFallbackTemplate(tabName, container);
            }
        }
    }
    
    // Fallback template loading if files not found
    loadFallbackTemplates(container) {
        // This ensures the app works even if template files are missing
        const fallbackTemplates = {
            scenarios: `<section id="scenarios" class="tab-pane" role="tabpanel">
                <h2>📊 Scenario Analyse</h2>
                <p>Template loading failed. Please check templates/scenarios.html</p>
            </section>`,
            montecarlo: `<section id="montecarlo" class="tab-pane" role="tabpanel">
                <h2>🎲 Monte Carlo Simulatie</h2>
                <p>Template loading failed. Please check templates/monte-carlo.html</p>
            </section>`,
            waterfall: `<section id="waterfall" class="tab-pane" role="tabpanel">
                <h2>💧 Cashflow Waterfall</h2>
                <p>Template loading failed. Please check templates/waterfall.html</p>
            </section>`,
            portfolio: `<section id="portfolio" class="tab-pane" role="tabpanel">
                <h2>🏦 Portfolio Builder</h2>
                <p>Template loading failed. Please check templates/portfolio.html</p>
            </section>`,
            saved: `<section id="saved" class="tab-pane" role="tabpanel">
                <h2>💾 Opgeslagen Scenario's</h2>
                <p>Template loading failed. Please check templates/saved.html</p>
            </section>`,
            export: `<section id="export" class="tab-pane" role="tabpanel">
                <h2>📤 Export Functies</h2>
                <p>Template loading failed. Please check templates/export.html</p>
            </section>`
        };
        
        Object.entries(fallbackTemplates).forEach(([tabName, html]) => {
            if (!document.getElementById(tabName)) {
                container.insertAdjacentHTML('beforeend', html);
                this.tabsLoaded.add(tabName);
            }
        });
    }
    
    // Load single fallback template
    loadFallbackTemplate(tabName, container) {
        const template = `<section id="${tabName}" class="tab-pane" role="tabpanel">
            <h2>Error Loading Tab</h2>
            <p>Unable to load template: templates/${tabName}.html</p>
            <p>Please check if the file exists and is accessible.</p>
        </section>`;
        
        if (!document.getElementById(tabName)) {
            container.insertAdjacentHTML('beforeend', template);
            this.tabsLoaded.add(tabName);
        }
    }
    
    // Load default values from config into form fields
    loadConfigDefaults() {
        const defaults = Config.defaults;
        
        // Set all default values
        Object.entries(defaults).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        // Initialize private tax options visibility
        this.updatePrivateTaxOptions();
        
        console.log('Default values loaded from config');
    }
    
    // Update visibility of private tax options
    updatePrivateTaxOptions() {
        const belastingType = document.getElementById('belastingType')?.value;
        const priveOptions = document.getElementById('priveOptions');
        const priveSubType = document.getElementById('priveSubType')?.value;
        
        if (!priveOptions) return;
        
        if (belastingType === 'prive') {
            priveOptions.style.display = 'grid';
            this.updateBoxSpecificOptions(priveSubType);
        } else {
            priveOptions.style.display = 'none';
        }
    }
    
    // Update box-specific options (Box 1 vs Box 3)
    updateBoxSpecificOptions(subType) {
        const box1Options = document.getElementById('box1Options');
        const box3Options = document.getElementById('box3Options');
        const box3TariefGroup = document.getElementById('box3TariefGroup');
        const box3VrijstellingGroup = document.getElementById('box3VrijstellingGroup');
        
        if (subType === 'box1') {
            if (box1Options) box1Options.style.display = 'block';
            if (box3Options) box3Options.style.display = 'none';
            if (box3TariefGroup) box3TariefGroup.style.display = 'none';
            if (box3VrijstellingGroup) box3VrijstellingGroup.style.display = 'none';
        } else if (subType === 'box3') {
            if (box1Options) box1Options.style.display = 'none';
            if (box3Options) box3Options.style.display = 'block';
            if (box3TariefGroup) box3TariefGroup.style.display = 'block';
            if (box3VrijstellingGroup) box3VrijstellingGroup.style.display = 'block';
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
    
    // Set up all event listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Calculator inputs
        const calculatorInputs = document.querySelectorAll('#calculator input, #calculator select');
        calculatorInputs.forEach(input => {
            input.addEventListener('change', () => {
                // Handle special cases for tax options
                if (input.id === 'belastingType') {
                    this.updatePrivateTaxOptions();
                } else if (input.id === 'priveSubType') {
                    this.updateBoxSpecificOptions(input.value);
                }
                this.calculate();
            });
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
            this.setupWaterfallListeners();
        }, 500);
        
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
    
    // Setup waterfall specific listeners
    setupWaterfallListeners() {
        // Waterfall view toggle
        const waterfallToggle = document.getElementById('waterfallViewToggle');
        if (waterfallToggle) {
            waterfallToggle.addEventListener('change', () => this.updateWaterfall());
        }
        
        // Compare periods button
        const compareBtn = document.getElementById('comparePeriodsBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.comparePeriods());
        }
        
        // Analysis tabs
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.updateWaterfallAnalysis(e.target.dataset.analysis);
            });
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
            case 'comparePeriodsBtn':
                this.comparePeriods();
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
        this.initializeTabContent(tabName);
    }
    
    // Initialize tab content - FIXED VERSION
    initializeTabContent(tabName) {
        // Check if tab template is loaded
        if (!this.tabsLoaded.has(tabName) && tabName !== 'calculator') {
            console.warn(`Tab ${tabName} template not loaded yet`);
            return;
        }
        
        setTimeout(() => {
            switch(tabName) {
                case 'scenarios':
                    if (!chartManager.charts.scenario) {
                        const canvas = document.getElementById('scenarioChart');
                        if (canvas) {
                            chartManager.initScenarioChart();
                        } else {
                            console.warn('Scenario chart canvas not found');
                        }
                    }
                    this.syncInputsToTab(tabName);
                    this.calculateScenarios();
                    break;
                    
                case 'montecarlo':
                    if (!chartManager.charts.monteCarlo) {
                        const canvas = document.getElementById('monteCarloChart');
                        if (canvas) {
                            chartManager.initMonteCarloCharts();
                        } else {
                            console.warn('Monte Carlo chart canvas not found');
                        }
                    }
                    this.syncInputsToTab(tabName);
                    break;
                    
                case 'waterfall':
                    if (!chartManager.charts.waterfall) {
                        const canvas = document.getElementById('waterfallChart');
                        if (canvas) {
                            chartManager.initWaterfallChart();
                            // Add waterfall period listener
                            const waterfallPeriod = document.getElementById('waterfallPeriod');
                            if (waterfallPeriod && !waterfallPeriod.hasAttribute('data-listener-added')) {
                                waterfallPeriod.addEventListener('change', () => this.updateWaterfall());
                                waterfallPeriod.setAttribute('data-listener-added', 'true');
                            }
                            // Setup waterfall listeners
                            this.setupWaterfallListeners();
                        } else {
                            console.warn('Waterfall chart canvas not found');
                        }
                    }
                    // Populate period selector
                    this.populateWaterfallPeriods();
                    this.updateWaterfall();
                    break;
                    
                case 'portfolio':
                    if (!chartManager.charts.portfolio) {
                        const canvas = document.getElementById('portfolioChart');
                        if (canvas) {
                            chartManager.initPortfolioChart();
                        } else {
                            console.warn('Portfolio chart canvas not found');
                        }
                    }
                    break;
                    
                case 'saved':
                    this.loadSavedScenarios();
                    break;
            }
        }, 100);
    }
    
    // Sync inputs from calculator to other tabs - IMPROVED WITH TAX SYNC
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
                const mcVolatility = document.getElementById('mcVolatility');
                if (mcVolatility && !mcVolatility.hasAttribute('data-user-modified')) {
                    mcVolatility.value = Math.max(1, Math.abs(inputs.rendement) * 0.3).toFixed(1);
                }
                break;
        }
    }
    
    // Main calculation
    calculate() {
        try {
            calculator.calculate();
            this.updateKPIs();
            this.updateCharts();
        } catch (error) {
            console.error('Calculation error:', error);
        }
    }
    
    // Update KPIs
    updateKPIs() {
        const results = calculator.results;
        const showReal = calculator.inputs.showRealValues;
        
        // Update nominal values
        document.getElementById('kpiTotaalVermogen').textContent = Utils.formatNumber(results.finalVermogen);
        document.getElementById('kpiROI').textContent = results.finalROI.toFixed(1) + '%';
        document.getElementById('kpiLeverage').textContent = results.leverageFactor.toFixed(1) + 'x';
        document.getElementById('kpiCashReserve').textContent = Utils.formatNumber(results.finalCashReserve);
        document.getElementById('kpiKoopkracht').textContent = Utils.formatNumber(results.koopkrachtVerlies);
        
        // Update real values (subtitles)
        if (showReal) {
            document.getElementById('kpiTotaalVermogenReeel').textContent = 
                `Reëel: ${Utils.formatNumber(results.finalVermogenReeel)}`;
            document.getElementById('kpiROIReeel').textContent = 
                `Reëel: ${results.finalROIReeel.toFixed(1)}%`;
            document.getElementById('kpiCashReserveReeel').textContent = 
                `Reëel: ${Utils.formatNumber(results.finalCashReserveReeel)}`;
        } else {
            document.getElementById('kpiTotaalVermogenReeel').textContent = '';
            document.getElementById('kpiROIReeel').textContent = '';
            document.getElementById('kpiCashReserveReeel').textContent = '';
        }
    }
    
    // Update charts
    updateCharts() {
        const showReal = document.getElementById('inflatieToggle').checked;
        chartManager.updateMainChart(calculator.data, showReal);
    }
    
    // Calculate scenarios - IMPROVED
    calculateScenarios() {
        const scenarios = ['best', 'base', 'worst'];
        const results = [];
        
        scenarios.forEach(scenario => {
            const rendementInput = document.getElementById(`${scenario}CaseRendement`);
            const kostenInput = document.getElementById(`${scenario}CaseKosten`);
            
            if (!rendementInput || !kostenInput) return;
            
            const rendement = parseFloat(rendementInput.value) || 0;
            const kosten = parseFloat(kostenInput.value) || 0;
            
            const roi = calculator.calculateScenario({
                rendement: rendement,
                vasteKosten: kosten
            });
            
            results.push(roi);
            
            const roiElement = document.getElementById(`${scenario}CaseROI`);
            if (roiElement) {
                roiElement.textContent = `ROI: ${roi.toFixed(1)}%`;
                // Add color based on ROI
                roiElement.className = 'kpi-value scenario-roi ' + 
                    (roi > 20 ? 'excellent' : roi > 10 ? 'good' : roi > 0 ? 'moderate' : 'poor');
            }
        });
        
        // Update scenario chart
        if (chartManager.charts.scenario && results.length === 3) {
            chartManager.charts.scenario.data.datasets[0].data = results;
            chartManager.charts.scenario.update();
        }
    }
    
    // Run stress test
    runStressTest() {
        const results = calculator.runStressTest();
        
        const resultsHTML = results.map(r => {
            const impactClass = r.impact < -10 ? 'severe' : r.impact < -5 ? 'moderate' : r.impact < 0 ? 'mild' : 'positive';
            const icon = r.impact < -10 ? '⚠️' : r.impact < 0 ? '📉' : '📈';
            
            return `
                <div class="stress-test-result ${impactClass}">
                    <div class="stress-test-header">
                        <span class="stress-test-icon">${icon}</span>
                        <strong>${r.name}</strong>
                    </div>
                    <div class="stress-test-metrics">
                        <div class="metric">
                            <span class="label">ROI:</span>
                            <span class="value">${r.roi.toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="label">Impact:</span>
                            <span class="value ${r.impact < 0 ? 'negative' : 'positive'}">${r.impact > 0 ? '+' : ''}${r.impact.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="impact-bar">
                        <div class="impact-fill ${r.impact < 0 ? 'negative' : 'positive'}" 
                             style="width: ${Math.min(Math.abs(r.impact) * 2, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        const resultsContainer = document.getElementById('stressTestResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="stress-test-summary">
                    <p>Impact analyse van negatieve scenario's op uw ROI:</p>
                </div>
                ${resultsHTML}
            `;
        }
    }
    
    // Run Monte Carlo simulation
    async runMonteCarlo() {
        const loading = document.getElementById('mcLoading');
        const results = document.getElementById('mcResults');
        const chartContainer = document.getElementById('mcChartContainer');
        const distContainer = document.getElementById('mcDistContainer');
        
        if (!loading) return;
        
        loading.classList.add('active');
        if (results) results.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        if (distContainer) distContainer.style.display = 'none';
        
        // Update loading text with progress
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.innerHTML = 'Simulatie wordt uitgevoerd... <span class="progress">0%</span>';
        }
        
        // Get parameters
        const numSimulations = parseInt(document.getElementById('mcSimulations')?.value) || 10000;
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value) / 100 || 0.03;
        const renteVolatility = parseFloat(document.getElementById('mcRenteVolatility')?.value) / 100 || 0.01;
        const kostenVolatility = parseFloat(document.getElementById('mcKostenVolatility')?.value) / 100 || 0.1;
        
        // Run simulation with delay for UI update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = calculator.runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility);
        
        // Update results with enhanced display
        const medianElement = document.getElementById('mcMedianROI');
        const confidenceElement = document.getElementById('mcConfidence');
        const lossProbElement = document.getElementById('mcLossProb');
        const varElement = document.getElementById('mcVaR');
        
        if (medianElement) {
            medianElement.textContent = stats.median.toFixed(1) + '%';
            medianElement.className = 'result-value ' + 
                (stats.median > 20 ? 'excellent' : stats.median > 10 ? 'good' : stats.median > 0 ? 'moderate' : 'poor');
        }
        if (confidenceElement) confidenceElement.textContent = 
            `${stats.p5.toFixed(1)}% - ${stats.p95.toFixed(1)}%`;
        if (lossProbElement) {
            lossProbElement.textContent = stats.lossProb.toFixed(1) + '%';
            lossProbElement.className = 'result-value ' + 
                (stats.lossProb < 5 ? 'excellent' : stats.lossProb < 10 ? 'good' : stats.lossProb < 20 ? 'moderate' : 'poor');
        }
        if (varElement) varElement.textContent = Utils.formatNumber(stats.vaR5);
        
        // Update charts
        chartManager.updateMonteCarloCharts(stats);
        
        // Show results
        loading.classList.remove('active');
        if (results) results.style.display = 'grid';
        if (chartContainer) chartContainer.style.display = 'block';
        if (distContainer) distContainer.style.display = 'block';
    }
    
    // Populate waterfall periods
    populateWaterfallPeriods() {
        const periodSelect = document.getElementById('waterfallPeriod');
        if (!periodSelect || periodSelect.options.length > 0) return;
        
        const looptijd = calculator.inputs.looptijd || 10;
        let html = '<option value="totaal">Totale Periode</option>';
        
        for (let i = 1; i <= looptijd; i++) {
            html += `<option value="jaar${i}">Jaar ${i}</option>`;
        }
        
        periodSelect.innerHTML = html;
    }
    
    // Update waterfall chart - FIXED
    updateWaterfall() {
        const periodElement = document.getElementById('waterfallPeriod');
        if (!periodElement) return;
        
        const period = periodElement.value || 'totaal';
        const showPercentages = document.getElementById('waterfallViewToggle')?.checked || false;
        const waterfallData = calculator.getWaterfallData(period);
        
        if (waterfallData.totals) {
            const totals = waterfallData.totals;
            const bruttoInkomsten = totals.bruttoOpbrengst || 0;
            const belasting = totals.belasting || 0;
            const uitgaven = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
            const nettoInkomsten = bruttoInkomsten - belasting;
            const netto = nettoInkomsten - uitgaven;
            const cashflowRatio = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
            const belastingTarief = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
            
            // Update summary cards
            const elements = {
                wfTotaleInkomsten: Utils.formatNumber(bruttoInkomsten),
                wfInkomstenDetail: `Bruto: ${Utils.formatNumber(bruttoInkomsten)} | Belasting: ${Utils.formatNumber(belasting)}`,
                wfTotaleUitgaven: Utils.formatNumber(uitgaven),
                wfUitgavenDetail: `Rente: ${Utils.formatNumber(totals.rente || 0)} | Aflossing: ${Utils.formatNumber(totals.aflossing || 0)} | Kosten: ${Utils.formatNumber(totals.kosten || 0)}`,
                wfNettoCashflow: Utils.formatNumber(netto),
                wfCashflowDetail: `${cashflowRatio.toFixed(1)}% van bruto inkomsten`,
                wfBelastingTarief: `${belastingTarief.toFixed(1)}%`,
                wfBelastingDetail: 'Op bruto rendement'
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
            // Generate insights
            this.generateWaterfallInsights(waterfallData, period);
        }
        
        chartManager.updateWaterfallChart(waterfallData);
        this.updateWaterfallTable(waterfallData, showPercentages);
    }
    
    // Update waterfall table - IMPROVED
    updateWaterfallTable(waterfallData, showPercentages = false) {
        const tbody = document.getElementById('waterfallTableBody');
        if (!tbody || !waterfallData.data.length) return;
        
        let html = '';
        let cumulative = 0;
        const totalBruto = waterfallData.totals?.bruttoOpbrengst || 0;
        const finalValue = waterfallData.finalValue || waterfallData.data[waterfallData.data.length - 1].value;
        
        waterfallData.data.forEach((item) => {
            if (item.type === 'start') {
                cumulative = item.value;
            } else if (item.type !== 'total') {
                cumulative += item.value;
            }
            
            // Calculate percentages
            const percentageOfBruto = totalBruto !== 0 ? Math.abs(item.value / totalBruto * 100) : 0;
            const percentageOfFinal = finalValue !== 0 ? Math.abs(item.value / finalValue * 100) : 0;
            
            // Create impact bar
            const impactBar = item.type !== 'start' && item.type !== 'total' ? 
                `<div class="impact-bar">
                    <div class="impact-fill ${item.value < 0 ? 'negative' : 'positive'}" 
                         style="width: ${Math.min(percentageOfBruto, 100)}%"></div>
                </div>` : '-';
            
            html += `
                <tr>
                    <td>${item.label}</td>
                    <td class="${item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : ''}">${Utils.formatNumber(item.value)}</td>
                    <td>${item.type !== 'start' && item.type !== 'total' ? percentageOfBruto.toFixed(1) + '%' : '-'}</td>
                    <td>${item.type !== 'start' && item.type !== 'total' ? percentageOfFinal.toFixed(1) + '%' : '-'}</td>
                    <td>${impactBar}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // Generate waterfall insights
    generateWaterfallInsights(waterfallData, period) {
        const insights = [];
        const totals = waterfallData.totals;
        
        if (!totals) return;
        
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const aflossing = totals.aflossing || 0;
        const kosten = totals.kosten || 0;
        const netto = bruttoInkomsten - belasting - rente - aflossing - kosten;
        
        // Cashflow efficiency
        const efficiency = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
        if (efficiency > 50) {
            insights.push({
                type: 'success',
                text: `Uitstekende cashflow efficiëntie: ${efficiency.toFixed(1)}% van bruto rendement blijft over als netto cashflow.`
            });
        } else if (efficiency < 20) {
            insights.push({
                type: 'warning',
                text: `Lage cashflow efficiëntie: slechts ${efficiency.toFixed(1)}% van bruto rendement blijft over. Overweeg kostenoptimalisatie.`
            });
        }
        
        // Tax burden
        const taxRate = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
        if (taxRate > 30) {
            insights.push({
                type: 'warning',
                text: `Hoge belastingdruk: ${taxRate.toFixed(1)}% van bruto rendement. Onderzoek mogelijke fiscale optimalisatie.`
            });
        }
        
        // Interest vs returns
        if (rente > 0 && bruttoInkomsten > 0) {
            const interestRatio = (rente / bruttoInkomsten) * 100;
            if (interestRatio > 40) {
                insights.push({
                    type: 'danger',
                    text: `Rentekosten zijn ${interestRatio.toFixed(1)}% van bruto rendement. Leverage werkt mogelijk tegen u.`
                });
            }
        }
        
        // Display insights
        const container = document.getElementById('waterfallInsights');
        if (container) {
            container.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    ${insight.text}
                </div>
            `).join('');
        }
    }
    
    // Update waterfall analysis based on selected tab
    updateWaterfallAnalysis(analysisType) {
        const container = document.getElementById('analysisContent');
        if (!container) return;
        
        switch(analysisType) {
            case 'trends':
                this.showWaterfallTrends(container);
                break;
            case 'ratios':
                this.showWaterfallRatios(container);
                break;
            default:
                // Components view is already shown by default
                break;
        }
    }
    
    // Show waterfall trends analysis
    showWaterfallTrends(container) {
        const monthlyData = calculator.data.monthlyData;
        if (!monthlyData || monthlyData.length === 0) {
            container.innerHTML = '<p>Geen trend data beschikbaar.</p>';
            return;
        }
        
        // Calculate trends
        const quarters = [];
        for (let i = 0; i < monthlyData.length; i += 3) {
            const quarterData = monthlyData.slice(i, Math.min(i + 3, monthlyData.length));
            const avgBruto = quarterData.reduce((sum, m) => sum + m.bruttoOpbrengst, 0) / quarterData.length;
            const avgNetto = quarterData.reduce((sum, m) => sum + m.netto, 0) / quarterData.length;
            quarters.push({
                quarter: Math.floor(i / 3) + 1,
                bruto: avgBruto,
                netto: avgNetto
            });
        }
        
        container.innerHTML = `
            <div class="trends-grid">
                <div class="trend-card">
                    <h4>📈 Rendement Trend</h4>
                    <p>Kwartaal gemiddelden van bruto rendement</p>
                    <canvas id="trendChart" height="200"></canvas>
                </div>
                <div class="trend-card">
                    <h4>📊 Cashflow Ontwikkeling</h4>
                    <div class="trend-stats">
                        ${quarters.map(q => `
                            <div>Q${q.quarter}: ${Utils.formatNumber(q.netto)}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Create trend chart
        const ctx = document.getElementById('trendChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: quarters.map(q => `Q${q.quarter}`),
                    datasets: [{
                        label: 'Bruto Rendement',
                        data: quarters.map(q => q.bruto),
                        borderColor: Config.charts.colors.primary,
                        tension: 0.4
                    }, {
                        label: 'Netto Cashflow',
                        data: quarters.map(q => q.netto),
                        borderColor: Config.charts.colors.secondary,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
    
    // Show waterfall ratios analysis
    showWaterfallRatios(container) {
        const waterfallData = calculator.getWaterfallData('totaal');
        const totals = waterfallData.totals;
        
        if (!totals) {
            container.innerHTML = '<p>Geen ratio data beschikbaar.</p>';
            return;
        }
        
        const bruttoInkomsten = totals.bruttoOpbrengst || 1; // Prevent division by zero
        const nettoInkomsten = bruttoInkomsten - (totals.belasting || 0);
        const totaleKosten = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
        
        const ratios = {
            cashflowRatio: ((nettoInkomsten - totaleKosten) / bruttoInkomsten * 100).toFixed(1),
            belastingRatio: ((totals.belasting || 0) / bruttoInkomsten * 100).toFixed(1),
            renteRatio: ((totals.rente || 0) / bruttoInkomsten * 100).toFixed(1),
            kostenRatio: ((totals.kosten || 0) / bruttoInkomsten * 100).toFixed(1),
            operationalEfficiency: (nettoInkomsten / bruttoInkomsten * 100).toFixed(1)
        };
        
        container.innerHTML = `
            <div class="ratios-analysis">
                <h4>Financiële Ratio's</h4>
                <div class="ratios-grid">
                    <div class="ratio-card">
                        <div class="ratio-label">Cashflow Conversie</div>
                        <div class="ratio-value">${ratios.cashflowRatio}%</div>
                        <div class="ratio-description">Netto cashflow als % van bruto</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Belastingdruk</div>
                        <div class="ratio-value">${ratios.belastingRatio}%</div>
                        <div class="ratio-description">Belasting als % van bruto</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Rentelast</div>
                        <div class="ratio-value">${ratios.renteRatio}%</div>
                        <div class="ratio-description">Rente als % van bruto</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Kostenratio</div>
                        <div class="ratio-value">${ratios.kostenRatio}%</div>
                        <div class="ratio-description">Vaste kosten als % van bruto</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Compare periods
    comparePeriods() {
        const periods = ['jaar1', 'jaar2', 'jaar3'];
        const data = periods.map(period => calculator.getWaterfallData(period));
        
        // Create comparison view
        alert('Periode vergelijking komt binnenkort beschikbaar!');
    }
    
    // Add asset to portfolio
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) return;
        
        const newAsset = document.createElement('div');
        newAsset.className = 'asset-row';
        newAsset.innerHTML = `
            <div class="asset-field">
                <label>Asset Naam</label>
                <input type="text" placeholder="Asset naam" class="asset-name">
            </div>
            <div class="asset-field">
                <label>Bedrag (€)</label>
                <input type="number" placeholder="Bedrag (€)" class="asset-amount" min="0" step="1000">
            </div>
            <div class="asset-field">
                <label>Rendement %</label>
                <input type="number" placeholder="Rendement %" class="asset-return" step="0.1">
            </div>
            <div class="asset-field">
                <label>Risico %</label>
                <input type="number" placeholder="Risico %" class="asset-risk" min="0" max="100" step="1">
            </div>
            <button class="btn-remove" data-action="remove">×</button>
        `;
        assetList.appendChild(newAsset);
    }
    
    // Remove asset from portfolio
    removeAsset(button) {
        const row = button.closest('.asset-row');
        if (row && document.querySelectorAll('.asset-row').length > 1) {
            row.remove();
        }
    }
    
    // Calculate portfolio
    calculatePortfolio() {
        const assets = [];
        let totalValue = 0;
        
        document.querySelectorAll('.asset-row').forEach(row => {
            const name = row.querySelector('.asset-name')?.value || 'Asset';
            const amount = parseFloat(row.querySelector('.asset-amount')?.value) || 0;
            const returnRate = parseFloat(row.querySelector('.asset-return')?.value) || 0;
            const risk = parseFloat(row.querySelector('.asset-risk')?.value) || 0;
            
            if (amount > 0) {
                assets.push({ name, amount, returnRate, risk });
                totalValue += amount;
            }
        });
        
        if (assets.length === 0 || totalValue === 0) return;
        
        // Calculate weighted returns and risk
        let weightedReturn = 0;
        let weightedRisk = 0;
        
        assets.forEach(asset => {
            const weight = asset.amount / totalValue;
            weightedReturn += asset.returnRate * weight;
            weightedRisk += asset.risk * weight;
        });
        
        // Update KPIs
        const portfolioWaardeElement = document.getElementById('portfolioWaarde');
        const portfolioRendementElement = document.getElementById('portfolioRendement');
        const portfolioRisicoElement = document.getElementById('portfolioRisico');
        
        if (portfolioWaardeElement) portfolioWaardeElement.textContent = Utils.formatNumber(totalValue);
        if (portfolioRendementElement) portfolioRendementElement.textContent = weightedReturn.toFixed(1) + '%';
        if (portfolioRisicoElement) portfolioRisicoElement.textContent = weightedRisk.toFixed(1) + '%';
        
        // Update chart
        if (chartManager.charts.portfolio) {
            chartManager.charts.portfolio.data.labels = assets.map(a => a.name);
            chartManager.charts.portfolio.data.datasets[0].data = assets.map(a => a.amount);
            chartManager.charts.portfolio.update();
        }
    }
    
    // Save current scenario
    saveCurrentScenario() {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        
        const scenario = {
            id: Utils.generateId(),
            name: `Scenario ${scenarios.length + 1}`,
            date: new Date().toISOString(),
            inputs: calculator.getInputValues(),
            results: calculator.results
        };
        
        scenarios.push(scenario);
        
        // Limit number of scenarios
        if (scenarios.length > Config.storage.maxScenarios) {
            scenarios.shift();
        }
        
        Utils.storage.set(Config.storage.scenariosKey, scenarios);
        this.loadSavedScenarios();
        
        alert('Scenario opgeslagen!');
    }
    
    // Load saved scenarios
    loadSavedScenarios() {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        const container = document.getElementById('savedScenariosList');
        
        if (!container) return;
        
        if (scenarios.length === 0) {
            container.innerHTML = '<p>Geen opgeslagen scenario\'s gevonden.</p>';
            return;
        }
        
        const html = scenarios.map((scenario, index) => `
            <div class="saved-scenario">
                <div class="scenario-info">
                    <strong>${scenario.name}</strong>
                    <span>${new Date(scenario.date).toLocaleDateString('nl-NL')}</span>
                    <span>ROI: ${scenario.results.finalROI.toFixed(1)}%</span>
                </div>
                <div class="scenario-actions">
                    <button class="btn btn-sm btn-primary" data-load-scenario="${index}">Laden</button>
                    <button class="btn btn-sm btn-danger" data-delete-scenario="${index}">Verwijderen</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // Load specific scenario
    loadScenario(index) {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        const scenario = scenarios[index];
        
        if (!scenario) return;
        
        // Set input values
        Object.entries(scenario.inputs).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        // Update private tax options visibility
        this.updatePrivateTaxOptions();
        
        // Switch to calculator tab and recalculate
        this.switchTab('calculator');
        this.calculate();
    }
    
    // Delete scenario
    deleteScenario(index) {
        if (!confirm('Weet u zeker dat u dit scenario wilt verwijderen?')) return;
        
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        scenarios.splice(index, 1);
        Utils.storage.set(Config.storage.scenariosKey, scenarios);
        this.loadSavedScenarios();
    }
    
    // Export to Excel - ENHANCED WITH TAX INFO
    exportToExcel() {
        const wb = XLSX.utils.book_new();
        
        // Main data sheet
        const inputs = calculator.inputs;
        const belastingInfo = inputs.belastingType === 'prive' 
            ? `${inputs.belastingType} (${inputs.priveSubType})`
            : inputs.belastingType;
            
        const mainData = [
            ['ROI Calculator Export', Utils.getCurrentDateString()],
            [],
            ['Invoergegevens'],
            ['Startkapitaal', inputs.startKapitaal],
            ['Lening', inputs.lening],
            ['Rente', inputs.renteLening + '%'],
            ['Looptijd', inputs.looptijd + ' jaar'],
            ['Rendement', inputs.rendement + '%'],
            ['Belasting Type', belastingInfo],
            ['Herinvestering', inputs.herinvestering + '%'],
            ['Vaste Kosten', inputs.vasteKosten],
            [],
            ['Resultaten'],
            ['Totaal Vermogen', calculator.results.finalVermogen],
            ['ROI', calculator.results.finalROI + '%'],
            ['Cash Reserve', calculator.results.finalCashReserve],
            ['Leverage Factor', calculator.results.leverageFactor + 'x']
        ];
        
        const ws1 = XLSX.utils.aoa_to_sheet(mainData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Overzicht');
        
        // Yearly data sheet
        const yearlyData = [
            ['Jaar', 'Portfolio', 'Cash Reserve', 'Lening', 'Totaal Vermogen', 'ROI %']
        ];
        
        calculator.data.jaren.forEach((jaar, i) => {
            yearlyData.push([
                jaar,
                calculator.data.portfolio[i],
                calculator.data.cashReserve[i],
                calculator.data.lening[i],
                calculator.data.totaalVermogen[i],
                calculator.data.roi[i]
            ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(yearlyData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Jaarlijkse Data');
        
        // Save file
        XLSX.writeFile(wb, `${Config.export.excelFilename}_${Utils.getISODateString()}.xlsx`);
    }
    
    // Export to PDF
    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Title
        pdf.setFontSize(20);
        pdf.text('ROI Calculator Rapport', 20, 20);
        
        // Date
        pdf.setFontSize(12);
        pdf.text(Utils.getCurrentDateString(), 20, 30);
        
        // Input summary
        pdf.setFontSize(14);
        pdf.text('Invoergegevens:', 20, 50);
        
        pdf.setFontSize(11);
        let y = 60;
        const inputs = calculator.inputs;
        const belastingInfo = inputs.belastingType === 'prive' 
            ? `${inputs.belastingType} (${inputs.priveSubType})`
            : inputs.belastingType;
            
        const inputList = [
            `Startkapitaal: ${Utils.formatNumber(inputs.startKapitaal)}`,
            `Lening: ${Utils.formatNumber(inputs.lening)}`,
            `Rente: ${inputs.renteLening}%`,
            `Looptijd: ${inputs.looptijd} jaar`,
            `Rendement: ${inputs.rendement}%`,
            `Belasting: ${belastingInfo}`,
            `Herinvestering: ${inputs.herinvestering}%`
        ];
        
        inputList.forEach(input => {
            pdf.text(input, 20, y);
            y += 8;
        });
        
        // Results
        pdf.setFontSize(14);
        pdf.text('Resultaten:', 20, y + 10);
        
        pdf.setFontSize(11);
        y += 20;
        const results = [
            `Totaal Vermogen: ${Utils.formatNumber(calculator.results.finalVermogen)}`,
            `ROI: ${calculator.results.finalROI.toFixed(1)}%`,
            `Leverage Factor: ${calculator.results.leverageFactor.toFixed(1)}x`,
            `Cash Reserve: ${Utils.formatNumber(calculator.results.finalCashReserve)}`
        ];
        
        results.forEach(result => {
            pdf.text(result, 20, y);
            y += 8;
        });
        
        // Add chart as image
        if (chartManager.charts.main) {
            const chartImage = chartManager.charts.main.toBase64Image();
            pdf.addPage();
            pdf.text('Vermogensontwikkeling', 20, 20);
            pdf.addImage(chartImage, 'PNG', 20, 30, 170, 100);
        }
        
        // Save
        pdf.save(`${Config.export.pdfFilename}_${Utils.getISODateString()}.pdf`);
    }
    
    // Export charts
    exportCharts() {
        Object.entries(chartManager.charts).forEach(([name, chart]) => {
            if (chart) {
                chartManager.exportChart(name);
            }
        });
    }
    
    // Load user settings
    loadSettings() {
        const settings = Utils.storage.get(Config.storage.settingsKey);
        if (!settings) return;
        
        // Apply saved settings if needed
        // This is a placeholder for future settings implementation
    }
    
    // Save user settings
    saveSettings() {
        const settings = {
            // Add settings to save
        };
        
        Utils.storage.set(Config.storage.settingsKey, settings);
    }
    
    // Show error message
    showError(message) {
        // Simple alert for now, can be replaced with better UI
        alert(message);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ROICalculatorApp();
    app.init();
});