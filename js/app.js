// Main Application Logic for ROI Calculator - IMPROVED VERSION

class ROICalculatorApp {
    constructor() {
        this.initialized = false;
        this.currentTab = 'calculator';
        this.sharedInputs = null;
        this.eventListeners = [];
        this.waterfallComparison = null;
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
        
        // Handle analysis tabs
        if (target.classList.contains('analysis-tab')) {
            this.switchAnalysisTab(target.dataset.analysis);
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
                this.compareWaterfallPeriods();
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
                        this.setupWaterfallListeners();
                    }
                    this.populateWaterfallPeriods();
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
    
    // Setup waterfall specific listeners
    setupWaterfallListeners() {
        const waterfallPeriod = document.getElementById('waterfallPeriod');
        if (waterfallPeriod && !waterfallPeriod.hasAttribute('data-listener-added')) {
            waterfallPeriod.addEventListener('change', () => this.updateWaterfall());
            waterfallPeriod.setAttribute('data-listener-added', 'true');
        }
        
        const viewToggle = document.getElementById('waterfallViewToggle');
        if (viewToggle && !viewToggle.hasAttribute('data-listener-added')) {
            viewToggle.addEventListener('change', () => this.updateWaterfall());
            viewToggle.setAttribute('data-listener-added', 'true');
        }
    }
    
    // Populate waterfall periods dropdown
    populateWaterfallPeriods() {
        const periodSelect = document.getElementById('waterfallPeriod');
        if (!periodSelect || periodSelect.children.length > 0) return;
        
        const looptijd = calculator.inputs.looptijd || 10;
        
        // Clear existing options
        periodSelect.innerHTML = '';
        
        // Add yearly options
        for (let jaar = 1; jaar <= looptijd; jaar++) {
            const option = document.createElement('option');
            option.value = `jaar${jaar}`;
            option.textContent = `Jaar ${jaar}`;
            periodSelect.appendChild(option);
        }
        
        // Add totaal option
        const totaalOption = document.createElement('option');
        totaalOption.value = 'totaal';
        totaalOption.textContent = 'Totaal Overzicht';
        periodSelect.appendChild(totaalOption);
        
        // Select jaar 1 by default
        periodSelect.value = 'jaar1';
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
            
            // Update waterfall if it's the current tab
            if (this.currentTab === 'waterfall') {
                this.populateWaterfallPeriods();
                this.updateWaterfall();
            }
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
        
        const resultsHTML = results.map(r => `
            <div class="stress-test-result">
                <strong>${r.name}:</strong> 
                ROI: ${r.roi.toFixed(1)}% 
                (Impact: <span class="${r.impact < 0 ? 'negative' : 'positive'}">${r.impact > 0 ? '+' : ''}${r.impact.toFixed(1)}%</span>)
            </div>
        `).join('');
        
        const resultsContainer = document.getElementById('stressTestResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = resultsHTML;
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
        
        // Get parameters
        const numSimulations = parseInt(document.getElementById('mcSimulations')?.value) || 10000;
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value) / 100 || 0.03;
        const renteVolatility = parseFloat(document.getElementById('mcRenteVolatility')?.value) / 100 || 0.01;
        const kostenVolatility = parseFloat(document.getElementById('mcKostenVolatility')?.value) / 100 || 0.1;
        
        // Run simulation with delay for UI update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = calculator.runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility);
        
        // Update results
        const medianElement = document.getElementById('mcMedianROI');
        const confidenceElement = document.getElementById('mcConfidence');
        const lossProbElement = document.getElementById('mcLossProb');
        const varElement = document.getElementById('mcVaR');
        
        if (medianElement) medianElement.textContent = stats.median.toFixed(1) + '%';
        if (confidenceElement) confidenceElement.textContent = 
            `${stats.p5.toFixed(1)}% - ${stats.p95.toFixed(1)}%`;
        if (lossProbElement) lossProbElement.textContent = stats.lossProb.toFixed(1) + '%';
        if (varElement) varElement.textContent = Utils.formatNumber(stats.vaR5);
        
        // Update charts
        chartManager.updateMonteCarloCharts(stats);
        
        // Show results
        loading.classList.remove('active');
        if (results) results.style.display = 'grid';
        if (chartContainer) chartContainer.style.display = 'block';
        if (distContainer) distContainer.style.display = 'block';
    }
    
    // Update waterfall chart - ENHANCED VERSION
    updateWaterfall() {
        const periodElement = document.getElementById('waterfallPeriod');
        if (!periodElement) return;
        
        const period = periodElement.value;
        const showPercentages = document.getElementById('waterfallViewToggle')?.checked || false;
        const waterfallData = calculator.getWaterfallData(period);
        
        if (waterfallData.totals) {
            const totals = waterfallData.totals;
            const bruttoInkomsten = totals.bruttoOpbrengst || 0;
            const belasting = totals.belasting || 0;
            const uitgaven = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
            const nettoInkomsten = bruttoInkomsten - belasting;
            const netto = nettoInkomsten - uitgaven;
            const conversie = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
            const effectiefBelastingTarief = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
            
            // Update summary cards
            const wfInkomstenElement = document.getElementById('wfTotaleInkomsten');
            const wfInkomstenDetailElement = document.getElementById('wfInkomstenDetail');
            const wfUitgavenElement = document.getElementById('wfTotaleUitgaven');
            const wfUitgavenDetailElement = document.getElementById('wfUitgavenDetail');
            const wfNettoElement = document.getElementById('wfNettoCashflow');
            const wfCashflowDetailElement = document.getElementById('wfCashflowDetail');
            const wfBelastingTariefElement = document.getElementById('wfBelastingTarief');
            const wfBelastingDetailElement = document.getElementById('wfBelastingDetail');
            
            if (wfInkomstenElement) wfInkomstenElement.textContent = Utils.formatNumber(nettoInkomsten);
            if (wfInkomstenDetailElement) wfInkomstenDetailElement.textContent = 
                `Bruto: ${Utils.formatNumber(bruttoInkomsten)} | Belasting: ${Utils.formatNumber(belasting)}`;
            
            if (wfUitgavenElement) wfUitgavenElement.textContent = Utils.formatNumber(uitgaven);
            if (wfUitgavenDetailElement) wfUitgavenDetailElement.textContent = 
                `Rente: ${Utils.formatNumber(totals.rente || 0)} | Aflossing: ${Utils.formatNumber(totals.aflossing || 0)} | Kosten: ${Utils.formatNumber(totals.kosten || 0)}`;
            
            if (wfNettoElement) wfNettoElement.textContent = Utils.formatNumber(netto);
            if (wfCashflowDetailElement) wfCashflowDetailElement.textContent = 
                `${conversie.toFixed(1)}% van bruto inkomsten`;
            
            if (wfBelastingTariefElement) wfBelastingTariefElement.textContent = 
                `${effectiefBelastingTarief.toFixed(1)}%`;
            if (wfBelastingDetailElement) wfBelastingDetailElement.textContent = 
                `${calculator.inputs.belastingType || 'VPB'} tarief`;
        }
        
        // Update chart
        if (showPercentages) {
            // Convert data to percentages
            const percentageData = this.convertWaterfallToPercentages(waterfallData);
            chartManager.updateWaterfallChart(percentageData);
        } else {
            chartManager.updateWaterfallChart(waterfallData);
        }
        
        // Update table based on active analysis tab
        const activeTab = document.querySelector('.analysis-tab.active')?.dataset.analysis || 'components';
        this.updateWaterfallAnalysis(waterfallData, activeTab);
        
        // Generate insights
        this.generateWaterfallInsights(waterfallData);
    }
    
    // Convert waterfall data to percentages
    convertWaterfallToPercentages(waterfallData) {
        const data = waterfallData.data;
        const total = Math.abs(data.find(d => d.label === 'Bruto Rendement')?.value || 1);
        
        return {
            ...waterfallData,
            data: data.map(item => ({
                ...item,
                value: total > 0 ? (item.value / total) * 100 : 0
            }))
        };
    }
    
    // Update waterfall analysis based on selected tab
    updateWaterfallAnalysis(waterfallData, analysisType) {
        const tbody = document.getElementById('waterfallTableBody');
        const content = document.getElementById('analysisContent');
        if (!tbody || !content) return;
        
        switch(analysisType) {
            case 'components':
                this.updateWaterfallComponentsTable(waterfallData);
                break;
            case 'trends':
                this.showWaterfallTrends();
                break;
            case 'ratios':
                this.showWaterfallRatios();
                break;
        }
    }
    
    // Update waterfall components table - ENHANCED VERSION
    updateWaterfallComponentsTable(waterfallData) {
        const tbody = document.getElementById('waterfallTableBody');
        if (!tbody || !waterfallData.data.length) return;
        
        let html = '';
        const bruttoValue = waterfallData.data.find(d => d.label === 'Bruto Rendement')?.value || 0;
        const nettoValue = waterfallData.data.find(d => d.label === 'Eind Saldo' || d.label === 'Eindwaarde')?.value || 0;
        
        waterfallData.data.forEach((item, index) => {
            if (item.type === 'start' || item.type === 'total') return;
            
            const percentageOfBruto = bruttoValue !== 0 ? Math.abs(item.value / bruttoValue * 100) : 0;
            const percentageOfNetto = nettoValue !== 0 ? Math.abs(item.value / nettoValue * 100) : 0;
            const impactPercentage = Math.min(100, percentageOfBruto);
            
            html += `
                <tr>
                    <td>${item.label}</td>
                    <td class="${item.value < 0 ? 'negative' : 'positive'}">${Utils.formatNumber(item.value)}</td>
                    <td>${percentageOfBruto.toFixed(1)}%</td>
                    <td>${percentageOfNetto.toFixed(1)}%</td>
                    <td>
                        <div class="impact-bar">
                            <div class="impact-fill ${item.value < 0 ? 'negative' : 'positive'}" 
                                 style="width: ${impactPercentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // Show waterfall trends analysis
    showWaterfallTrends() {
        const content = document.getElementById('analysisContent');
        if (!content) return;
        
        // Get trends data
        const trendsHTML = `
            <div class="trends-analysis">
                <div class="trends-grid">
                    <div class="trend-card">
                        <h4>📈 Rendement Trend</h4>
                        <p>Analyseer hoe het rendement zich ontwikkelt over de jaren</p>
                        <canvas id="trendChart" height="200"></canvas>
                    </div>
                    <div class="trend-card">
                        <h4>💸 Kosten Ontwikkeling</h4>
                        <p>Bekijk hoe de kostenstructuur verandert</p>
                        <div class="trend-stats">
                            <div>Jaar 1: ${this.getTrendData('jaar1')}</div>
                            <div>Jaar 5: ${this.getTrendData('jaar5')}</div>
                            <div>Jaar 10: ${this.getTrendData('jaar10')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = trendsHTML;
        
        // Create mini trend chart
        setTimeout(() => this.createTrendChart(), 100);
    }
    
    // Show waterfall ratios analysis
    showWaterfallRatios() {
        const content = document.getElementById('analysisContent');
        if (!content) return;
        
        const ratiosHTML = `
            <div class="ratios-analysis">
                <h4>📊 Belangrijke Ratio's</h4>
                <div class="ratios-grid">
                    <div class="ratio-card">
                        <div class="ratio-label">DSCR (Debt Service Coverage)</div>
                        <div class="ratio-value">${this.calculateDSCR()}</div>
                        <div class="ratio-description">Netto inkomsten / Schuldendienst</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Operationele Marge</div>
                        <div class="ratio-value">${this.calculateOperationalMargin()}%</div>
                        <div class="ratio-description">Netto / Bruto rendement</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Belastingdruk</div>
                        <div class="ratio-value">${this.calculateTaxBurden()}%</div>
                        <div class="ratio-description">Belasting / Bruto rendement</div>
                    </div>
                    <div class="ratio-card">
                        <div class="ratio-label">Kostenratio</div>
                        <div class="ratio-value">${this.calculateCostRatio()}%</div>
                        <div class="ratio-description">Totale kosten / Bruto rendement</div>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = ratiosHTML;
    }
    
    // Switch analysis tabs
    switchAnalysisTab(analysisType) {
        // Update tab UI
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.analysis === analysisType);
        });
        
        // Get current waterfall data
        const periodElement = document.getElementById('waterfallPeriod');
        if (!periodElement) return;
        
        const waterfallData = calculator.getWaterfallData(periodElement.value);
        this.updateWaterfallAnalysis(waterfallData, analysisType);
    }
    
    // Generate waterfall insights
    generateWaterfallInsights(waterfallData) {
        const container = document.getElementById('waterfallInsights');
        if (!container) return;
        
        const insights = [];
        const totals = waterfallData.totals || {};
        
        // Belasting insight
        const belastingPercentage = totals.bruttoOpbrengst > 0 ? 
            (totals.belasting / totals.bruttoOpbrengst * 100) : 0;
        
        if (belastingPercentage > 30) {
            insights.push({
                type: 'warning',
                text: `⚠️ Hoge belastingdruk: ${belastingPercentage.toFixed(1)}% van bruto rendement gaat naar belasting`
            });
        }
        
        // Rente insight
        const rentePercentage = totals.bruttoOpbrengst > 0 ? 
            (totals.rente / totals.bruttoOpbrengst * 100) : 0;
        
        if (rentePercentage > 40) {
            insights.push({
                type: 'danger',
                text: `💸 Rente kosten zijn ${rentePercentage.toFixed(1)}% van bruto rendement - overweeg herfinanciering`
            });
        }
        
        // Cashflow efficiency
        const nettoMarge = totals.bruttoOpbrengst > 0 ? 
            ((totals.bruttoOpbrengst - totals.belasting - totals.rente - totals.kosten) / totals.bruttoOpbrengst * 100) : 0;
        
        if (nettoMarge > 50) {
            insights.push({
                type: 'success',
                text: `✅ Uitstekende cashflow efficiëntie: ${nettoMarge.toFixed(1)}% netto marge`
            });
        } else if (nettoMarge < 20) {
            insights.push({
                type: 'warning',
                text: `📉 Lage netto marge van ${nettoMarge.toFixed(1)}% - optimalisatie mogelijk`
            });
        }
        
        // Leverage insight
        if (calculator.inputs.lening > calculator.inputs.startKapitaal * 2) {
            insights.push({
                type: 'info',
                text: `📊 Hoge leverage ratio (${calculator.results.leverageFactor.toFixed(1)}x) - verhoogd risico maar ook potentieel`
            });
        }
        
        // Generate HTML
        const insightsHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                ${insight.text}
            </div>
        `).join('');
        
        container.innerHTML = insightsHTML || '<div class="insight-card">Geen bijzondere inzichten voor deze periode</div>';
    }
    
    // Compare waterfall periods
    compareWaterfallPeriods() {
        alert('Periode vergelijking komt in een toekomstige update!');
        // TODO: Implement period comparison functionality
    }
    
    // Helper calculation functions
    getTrendData(period) {
        const data = calculator.getWaterfallData(period);
        return Utils.formatNumber(data.totals?.kosten || 0);
    }
    
    calculateDSCR() {
        const period = document.getElementById('waterfallPeriod')?.value;
        const data = calculator.getWaterfallData(period);
        const totals = data.totals || {};
        
        const nettoInkomsten = (totals.bruttoOpbrengst || 0) - (totals.belasting || 0);
        const schuldendienst = (totals.rente || 0) + (totals.aflossing || 0);
        
        return schuldendienst > 0 ? (nettoInkomsten / schuldendienst).toFixed(2) : 'N/A';
    }
    
    calculateOperationalMargin() {
        const period = document.getElementById('waterfallPeriod')?.value;
        const data = calculator.getWaterfallData(period);
        const totals = data.totals || {};
        
        const netto = (totals.bruttoOpbrengst || 0) - (totals.belasting || 0) - 
                     (totals.rente || 0) - (totals.aflossing || 0) - (totals.kosten || 0);
        
        return totals.bruttoOpbrengst > 0 ? 
            (netto / totals.bruttoOpbrengst * 100).toFixed(1) : '0.0';
    }
    
    calculateTaxBurden() {
        const period = document.getElementById('waterfallPeriod')?.value;
        const data = calculator.getWaterfallData(period);
        const totals = data.totals || {};
        
        return totals.bruttoOpbrengst > 0 ? 
            ((totals.belasting || 0) / totals.bruttoOpbrengst * 100).toFixed(1) : '0.0';
    }
    
    calculateCostRatio() {
        const period = document.getElementById('waterfallPeriod')?.value;
        const data = calculator.getWaterfallData(period);
        const totals = data.totals || {};
        
        const totalCosts = (totals.belasting || 0) + (totals.rente || 0) + 
                          (totals.aflossing || 0) + (totals.kosten || 0);
        
        return totals.bruttoOpbrengst > 0 ? 
            (totalCosts / totals.bruttoOpbrengst * 100).toFixed(1) : '0.0';
    }
    
    createTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple trend visualization
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jaar 1', 'Jaar 3', 'Jaar 5', 'Jaar 7', 'Jaar 10'],
                datasets: [{
                    label: 'Netto Cashflow',
                    data: [10, 25, 40, 55, 75], // Example data
                    borderColor: '#1e3c72',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Add asset to portfolio
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) return;
        
        const newAsset = document.createElement('div');
        newAsset.className = 'asset-row';
        newAsset.innerHTML = `
            <input type="text" placeholder="Asset naam" class="asset-name">
            <input type="number" placeholder="Bedrag (€)" class="asset-amount" min="0" step="1000">
            <input type="number" placeholder="Rendement %" class="asset-return" step="0.1">
            <input type="number" placeholder="Risico %" class="asset-risk" min="0" max="100" step="1">
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
    
    // Export to Excel - ENHANCED WITH WATERFALL DATA
    exportToExcel() {
        const wb = XLSX.utils.book_new();
        
        // Main data sheet
        const mainData = [
            ['ROI Calculator Export', Utils.getCurrentDateString()],
            [],
            ['Invoergegevens'],
            ['Startkapitaal', calculator.inputs.startKapitaal],
            ['Lening', calculator.inputs.lening],
            ['Rente', calculator.inputs.renteLening + '%'],
            ['Looptijd', calculator.inputs.looptijd + ' jaar'],
            ['Rendement', calculator.inputs.rendement + '%'],
            ['Belasting Type', calculator.inputs.belastingType || 'VPB'],
            [],
            ['Resultaten'],
            ['Totaal Vermogen', calculator.results.finalVermogen],
            ['ROI', calculator.results.finalROI + '%'],
            ['Cash Reserve', calculator.results.finalCashReserve]
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
        
        // Waterfall analysis sheet
        const waterfallData = [
            ['Waterfall Analyse'],
            [],
            ['Component', 'Bedrag', '% van Bruto', '% van Netto']
        ];
        
        const wfData = calculator.getWaterfallData('totaal');
        wfData.data.forEach(item => {
            if (item.type !== 'start' && item.type !== 'total') {
                waterfallData.push([
                    item.label,
                    item.value,
                    `${(item.value / wfData.totals.bruttoOpbrengst * 100).toFixed(1)}%`,
                    `${(item.value / wfData.finalValue * 100).toFixed(1)}%`
                ]);
            }
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(waterfallData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Waterfall');
        
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
        const inputs = [
            `Startkapitaal: ${Utils.formatNumber(calculator.inputs.startKapitaal)}`,
            `Lening: ${Utils.formatNumber(calculator.inputs.lening)}`,
            `Rente: ${calculator.inputs.renteLening}%`,
            `Looptijd: ${calculator.inputs.looptijd} jaar`,
            `Rendement: ${calculator.inputs.rendement}%`,
            `Belasting: ${calculator.inputs.belastingType || 'VPB'}`
        ];
        
        inputs.forEach(input => {
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