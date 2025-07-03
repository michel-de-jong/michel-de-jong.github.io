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
        
        // Button click handler
        document.addEventListener('click', (e) => this.handleButtonClick(e));
        
        // Scenario inputs
        this.setupScenarioListeners();
        
        // Window resize handler for charts
        window.addEventListener('resize', Utils.throttle(() => {
            Object.values(chartManager.charts).forEach(chart => {
                if (chart) chart.resize();
            });
        }, Config.performance.throttleDelay));
    }
    
    // Setup scenario specific listeners
    setupScenarioListeners() {
        // Wait for scenario inputs to be loaded
        setTimeout(() => {
            const scenarioInputs = document.querySelectorAll('[id*="Case"]');
            scenarioInputs.forEach(input => {
                input.addEventListener('change', () => this.calculateScenarios());
                input.addEventListener('input', Utils.debounce(() => this.calculateScenarios(), Config.performance.debounceDelay));
            });
        }, 100);
    }
    
    // Handle button clicks
    handleButtonClick(e) {
        const target = e.target;
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
                    if (waterfallPeriod) {
                        waterfallPeriod.addEventListener('change', () => this.updateWaterfall());
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
                const mcVolatility = document.getElementById('mcVolatility');
                if (mcVolatility && !mcVolatility.hasAttribute('data-user-modified')) {
                    mcVolatility.value = Math.min(20, Math.max(1, Math.abs(inputs.rendement) * 0.3)).toFixed(1);
                }
                break;
        }
    }
    
    // Main calculation
    calculate() {
        try {
            // Perform calculation
            const data = calculator.calculate();
            
            // Update KPIs
            this.updateKPIs();
            
            // Update charts
            this.updateCharts();
            
            // Store shared inputs for other tabs
            this.sharedInputs = calculator.getInputValues();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Er is een fout opgetreden bij de berekening.');
        }
    }
    
    // Update KPI displays
    updateKPIs() {
        const results = calculator.results;
        const showRealValues = calculator.inputs.showRealValues;
        
        // Update main KPIs
        document.getElementById('kpiTotaalVermogen').textContent = Utils.formatNumber(results.finalVermogen);
        document.getElementById('kpiROI').textContent = Utils.formatPercentage(results.finalROI);
        document.getElementById('kpiLeverage').textContent = results.leverageFactor.toFixed(1) + 'x';
        document.getElementById('kpiCashReserve').textContent = Utils.formatNumber(results.finalCashReserve);
        document.getElementById('kpiKoopkracht').textContent = Utils.formatNumber(results.koopkrachtVerlies);
        
        // Update real value subtitles
        if (showRealValues) {
            document.getElementById('kpiTotaalVermogenReeel').textContent = `Reëel: ${Utils.formatNumber(results.finalVermogenReeel)}`;
            document.getElementById('kpiROIReeel').textContent = `Reëel: ${Utils.formatPercentage(results.finalROIReeel)}`;
            document.getElementById('kpiCashReserveReeel').textContent = `Reëel: ${Utils.formatNumber(results.finalCashReserveReeel)}`;
        } else {
            document.getElementById('kpiTotaalVermogenReeel').textContent = '';
            document.getElementById('kpiROIReeel').textContent = '';
            document.getElementById('kpiCashReserveReeel').textContent = '';
        }
    }
    
    // Update all charts
    updateCharts() {
        const showRealValues = document.getElementById('inflatieToggle').checked;
        chartManager.updateMainChart(calculator.data, showRealValues);
    }
    
    // Calculate scenarios
    calculateScenarios() {
        const scenarios = ['bestCase', 'baseCase', 'worstCase'];
        const results = [];
        
        scenarios.forEach(scenario => {
            const rendement = parseFloat(document.getElementById(scenario + 'Rendement')?.value) || 0;
            const kosten = parseFloat(document.getElementById(scenario + 'Kosten')?.value) || 0;
            
            const roi = calculator.calculateScenario({
                rendement: rendement,
                vasteKosten: kosten
            });
            
            // Update display
            const roiElement = document.getElementById(scenario + 'ROI');
            if (roiElement) {
                roiElement.textContent = `ROI: ${Utils.formatPercentage(roi)}`;
            }
            
            results.push(roi);
        });
        
        // Update chart
        if (chartManager.charts.scenario) {
            chartManager.charts.scenario.data.datasets[0].data = results;
            chartManager.charts.scenario.update('none');
        }
    }
    
    // Run stress test
    runStressTest() {
        const results = calculator.runStressTest();
        const resultsDiv = document.getElementById('stressTestResults');
        
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = '<h4>Stress Test Resultaten</h4>';
        
        results.forEach(result => {
            const impactClass = result.impact < -10 ? 'negative' : result.impact > 10 ? 'positive' : '';
            resultsDiv.innerHTML += `
                <p>
                    <strong>${result.name}:</strong> 
                    ROI = ${Utils.formatPercentage(result.roi)} 
                    <span class="${impactClass}">(${result.impact > 0 ? '+' : ''}${result.impact.toFixed(1)}%)</span>
                </p>
            `;
        });
    }
    
    // Run Monte Carlo simulation
    async runMonteCarlo() {
        const numSimulations = parseInt(document.getElementById('mcSimulations')?.value) || 10000;
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value) / 100 || 0.03;
        const renteVolatility = parseFloat(document.getElementById('mcRenteVolatility')?.value) / 100 || 0.01;
        const kostenVolatility = parseFloat(document.getElementById('mcKostenVolatility')?.value) / 100 || 0.1;
        
        // Show loading
        const loading = document.getElementById('mcLoading');
        const results = document.getElementById('mcResults');
        const chartContainer = document.getElementById('mcChartContainer');
        const distContainer = document.getElementById('mcDistContainer');
        
        if (loading) loading.classList.add('active');
        if (results) results.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        if (distContainer) distContainer.style.display = 'none';
        
        // Run simulation with delay for UI update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = calculator.runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility);
        
        // Update results
        if (document.getElementById('mcMedianROI')) {
            document.getElementById('mcMedianROI').textContent = Utils.formatPercentage(stats.median);
        }
        if (document.getElementById('mcConfidence')) {
            document.getElementById('mcConfidence').textContent = `${Utils.formatPercentage(stats.p5)} - ${Utils.formatPercentage(stats.p95)}`;
        }
        if (document.getElementById('mcLossProb')) {
            document.getElementById('mcLossProb').textContent = Utils.formatPercentage(stats.lossProb);
        }
        if (document.getElementById('mcVaR')) {
            document.getElementById('mcVaR').textContent = Utils.formatNumber(stats.vaR5);
        }
        
        // Update charts
        chartManager.updateMonteCarloCharts(stats);
        
        // Show results
        if (loading) loading.classList.remove('active');
        if (results) results.style.display = 'grid';
        if (chartContainer) chartContainer.style.display = 'block';
        if (distContainer) distContainer.style.display = 'block';
    }
    
    // Update waterfall chart
    updateWaterfall() {
        const period = document.getElementById('waterfallPeriod')?.value || 'totaal';
        const waterfallData = calculator.getWaterfallData(period);
        
        // Update chart
        chartManager.updateWaterfallChart(waterfallData);
        
        // Calculate KPIs
        const totalInkomsten = waterfallData.data
            .filter(d => d.type === 'positive')
            .reduce((sum, d) => sum + d.value, 0);
        const totalUitgaven = Math.abs(waterfallData.data
            .filter(d => d.type === 'negative')
            .reduce((sum, d) => sum + d.value, 0));
        const nettoFlow = totalInkomsten - totalUitgaven;
        const conversieRatio = totalInkomsten > 0 ? (nettoFlow / totalInkomsten) * 100 : 0;
        
        // Update KPI displays
        if (document.getElementById('wfInkomsten')) {
            document.getElementById('wfInkomsten').textContent = Utils.formatNumber(totalInkomsten);
        }
        if (document.getElementById('wfUitgaven')) {
            document.getElementById('wfUitgaven').textContent = Utils.formatNumber(totalUitgaven);
        }
        if (document.getElementById('wfNetto')) {
            document.getElementById('wfNetto').textContent = Utils.formatNumber(nettoFlow);
        }
        if (document.getElementById('wfConversie')) {
            document.getElementById('wfConversie').textContent = Utils.formatPercentage(conversieRatio);
        }
        
        // Update table
        this.updateWaterfallTable(waterfallData.data, totalInkomsten + totalUitgaven);
    }
    
    // Update waterfall table
    updateWaterfallTable(data, total) {
        const tbody = document.getElementById('waterfallTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        let cumulative = 0;
        
        data.forEach((item) => {
            if (item.type !== 'total' && item.type !== 'start') {
                cumulative += item.value;
                const row = tbody.insertRow();
                row.insertCell(0).textContent = item.label;
                row.insertCell(1).innerHTML = `<span class="${item.value > 0 ? 'positive' : 'negative'}">${Utils.formatNumber(Math.abs(item.value))}</span>`;
                row.insertCell(2).textContent = Utils.formatPercentage(Math.abs(item.value) / total * 100);
                row.insertCell(3).textContent = Utils.formatNumber(cumulative);
            }
        });
    }
    
    // Portfolio management
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
    
    removeAsset(button) {
        button.closest('.asset-row').remove();
    }
    
    calculatePortfolio() {
        const assets = [];
        let totalValue = 0;
        let weightedReturn = 0;
        let portfolioRisk = 0;
        
        document.querySelectorAll('.asset-row').forEach(row => {
            const name = row.querySelector('.asset-name')?.value || '';
            const amount = parseFloat(row.querySelector('.asset-amount')?.value) || 0;
            const returnRate = parseFloat(row.querySelector('.asset-return')?.value) || 0;
            const risk = parseFloat(row.querySelector('.asset-risk')?.value) || 0;
            
            if (name && amount > 0) {
                assets.push({ name, amount, returnRate, risk });
                totalValue += amount;
            }
        });
        
        // Calculate weighted metrics
        assets.forEach(asset => {
            const weight = asset.amount / totalValue;
            weightedReturn += asset.returnRate * weight;
            portfolioRisk += asset.risk * weight;
        });
        
        // Update displays
        if (document.getElementById('portfolioWaarde')) {
            document.getElementById('portfolioWaarde').textContent = Utils.formatNumber(totalValue);
        }
        if (document.getElementById('portfolioRendement')) {
            document.getElementById('portfolioRendement').textContent = Utils.formatPercentage(weightedReturn);
        }
        if (document.getElementById('portfolioRisico')) {
            document.getElementById('portfolioRisico').textContent = Utils.formatPercentage(portfolioRisk);
        }
        
        // Update chart
        if (chartManager.charts.portfolio) {
            chartManager.charts.portfolio.data.labels = assets.map(a => a.name);
            chartManager.charts.portfolio.data.datasets[0].data = assets.map(a => a.amount);
            chartManager.charts.portfolio.update('none');
        }
    }
    
    // Scenario management
    saveCurrentScenario() {
        const name = prompt('Scenario naam:');
        if (!name) return;
        
        const scenario = {
            id: Utils.generateId(),
            name: name,
            date: Utils.getCurrentDateString(),
            inputs: calculator.getInputValues(),
            results: calculator.results,
            timestamp: new Date().toISOString()
        };
        
        // Get existing scenarios
        let scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        
        // Check max scenarios limit
        if (scenarios.length >= Config.storage.maxScenarios) {
            if (!confirm(`Maximum aantal scenario's bereikt (${Config.storage.maxScenarios}). Oudste scenario verwijderen?`)) {
                return;
            }
            scenarios.shift(); // Remove oldest
        }
        
        scenarios.push(scenario);
        Utils.storage.set(Config.storage.scenariosKey, scenarios);
        
        alert('Scenario opgeslagen!');
        this.loadSavedScenarios();
    }
    
    loadSavedScenarios() {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        const container = document.getElementById('savedScenariosList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (scenarios.length === 0) {
            container.innerHTML = '<p class="text-center">Geen opgeslagen scenario\'s</p>';
            return;
        }
        
        scenarios.forEach((scenario, index) => {
            const scenarioDiv = document.createElement('div');
            scenarioDiv.className = 'saved-scenario';
            scenarioDiv.innerHTML = `
                <div class="scenario-info">
                    <strong>${scenario.name}</strong> - ${scenario.date}<br>
                    ROI: ${Utils.formatPercentage(scenario.results.finalROI)} | 
                    Vermogen: ${Utils.formatNumber(scenario.results.finalVermogen)}
                </div>
                <div class="scenario-actions">
                    <button class="btn btn-primary btn-sm" data-load-scenario="${index}">Laden</button>
                    <button class="btn btn-danger btn-sm" data-delete-scenario="${index}">Verwijderen</button>
                </div>
            `;
            container.appendChild(scenarioDiv);
        });
    }
    
    loadScenario(index) {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        const scenario = scenarios[index];
        
        if (!scenario || !scenario.inputs) return;
        
        // Load inputs
        Object.keys(scenario.inputs).forEach(key => {
            const element = document.getElementById(key);
            if (element && element.type !== 'checkbox') {
                element.value = scenario.inputs[key];
            } else if (element && element.type === 'checkbox') {
                element.checked = scenario.inputs[key];
            }
        });
        
        // Switch to calculator tab
        this.switchTab('calculator');
        
        // Recalculate
        this.calculate();
        
        alert(`Scenario "${scenario.name}" geladen`);
    }
    
    deleteScenario(index) {
        const scenarios = Utils.storage.get(Config.storage.scenariosKey) || [];
        const scenario = scenarios[index];
        
        if (confirm(`Weet u zeker dat u scenario "${scenario.name}" wilt verwijderen?`)) {
            scenarios.splice(index, 1);
            Utils.storage.set(Config.storage.scenariosKey, scenarios);
            this.loadSavedScenarios();
        }
    }
    
    // Export functions
    exportToExcel() {
        try {
            const wb = XLSX.utils.book_new();
            const inputs = calculator.getInputValues();
            const results = calculator.results;
            
            // Create summary sheet
            const summaryData = [
                ['ROI Rekentool Export', '', '', Utils.getCurrentDateString()],
                [],
                ['Input Parameters'],
                ['Startkapitaal', inputs.startKapitaal],
                ['Lening', inputs.lening],
                ['Rente Lening %', inputs.renteLening],
                ['Looptijd Investering (jaren)', inputs.looptijd],
                ['Looptijd Lening (jaren)', inputs.leningLooptijd],
                ['Rendement %', inputs.rendement],
                ['Rendement Type', inputs.rendementType],
                ['Aflossingstype', inputs.aflossingsType],
                ['Herinvestering %', inputs.herinvestering],
                ['Vaste Kosten', inputs.vasteKosten],
                ['Inflatie %', inputs.inflatie],
                [],
                ['Resultaten'],
                ['Totaal Vermogen', results.finalVermogen],
                ['ROI %', results.finalROI],
                ['Leverage Factor', results.leverageFactor],
                ['Cash Reserve', results.finalCashReserve],
                ['Koopkrachtverlies', results.koopkrachtVerlies]
            ];
            
            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, ws1, 'Samenvatting');
            
            // Create yearly data sheet
            const yearlyData = [
                ['Jaar', 'Portfolio', 'Cash Reserve', 'Lening', 'Totaal Vermogen', 'ROI %']
            ];
            
            for (let i = 0; i < calculator.data.jaren.length; i++) {
                yearlyData.push([
                    calculator.data.jaren[i],
                    calculator.data.portfolio[i],
                    calculator.data.cashReserve[i],
                    calculator.data.lening[i],
                    calculator.data.totaalVermogen[i],
                    calculator.data.roi[i]
                ]);
            }
            
            const ws2 = XLSX.utils.aoa_to_sheet(yearlyData);
            XLSX.utils.book_append_sheet(wb, ws2, 'Jaarlijkse Data');
            
            // Download file
            const filename = `${Config.export.excelFilename}_${Utils.getISODateString()}.xlsx`;
            XLSX.writeFile(wb, filename);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Er is een fout opgetreden bij het exporteren naar Excel.');
        }
    }
    
    exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const inputs = calculator.getInputValues();
            const results = calculator.results;
            
            // Title
            doc.setFontSize(20);
            doc.text('ROI Rekentool Rapport', 20, 20);
            
            // Date
            doc.setFontSize(12);
            doc.text(`Datum: ${Utils.getCurrentDateString()}`, 20, 30);
            
            // Input parameters
            doc.setFontSize(16);
            doc.text('Input Parameters', 20, 45);
            doc.setFontSize(12);
            
            let y = 55;
            const inputItems = [
                ['Startkapitaal', Utils.formatNumber(inputs.startKapitaal)],
                ['Lening', Utils.formatNumber(inputs.lening)],
                ['Rente Lening', inputs.renteLening + '%'],
                ['Looptijd Investering', inputs.looptijd + ' jaar'],
                ['Looptijd Lening', inputs.leningLooptijd + ' jaar'],
                ['Rendement', inputs.rendement + '% ' + inputs.rendementType],
                ['Aflossingstype', inputs.aflossingsType]
            ];
            
            inputItems.forEach(([label, value]) => {
                doc.text(`${label}: ${value}`, 20, y);
                y += 8;
            });
            
            // Results
            doc.setFontSize(16);
            doc.text('Resultaten', 20, y + 10);
            doc.setFontSize(12);
            y += 20;
            
            const resultItems = [
                ['Totaal Vermogen', Utils.formatNumber(results.finalVermogen)],
                ['ROI', Utils.formatPercentage(results.finalROI)],
                ['Leverage Factor', results.leverageFactor + 'x'],
                ['Cash Reserve', Utils.formatNumber(results.finalCashReserve)]
            ];
            
            resultItems.forEach(([label, value]) => {
                doc.text(`${label}: ${value}`, 20, y);
                y += 8;
            });
            
            // Save PDF
            const filename = `${Config.export.pdfFilename}_${Utils.getISODateString()}.pdf`;
            doc.save(filename);
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Er is een fout opgetreden bij het genereren van de PDF.');
        }
    }
    
    exportCharts() {
        const charts = [
            { chart: chartManager.charts.main, name: 'vermogensontwikkeling' },
            { chart: chartManager.charts.scenario, name: 'scenario_vergelijking' },
            { chart: chartManager.charts.monteCarlo, name: 'monte_carlo' },
            { chart: chartManager.charts.waterfall, name: 'cashflow_waterfall' },
            { chart: chartManager.charts.portfolio, name: 'portfolio_verdeling' }
        ];
        
        charts.forEach(({ chart, name }) => {
            if (chart) {
                chartManager.exportChart(name);
            }
        });
    }
    
    // Settings management
    loadSettings() {
        const settings = Utils.storage.get(Config.storage.settingsKey);
        if (!settings) return;
        
        // Apply saved settings
        if (settings.defaultValues) {
            Object.keys(settings.defaultValues).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = settings.defaultValues[key];
                }
            });
        }
    }
    
    saveSettings() {
        const settings = {
            defaultValues: calculator.getInputValues(),
            timestamp: new Date().toISOString()
        };
        
        Utils.storage.set(Config.storage.settingsKey, settings);
    }
    
    // Error handling
    showError(message) {
        alert(message);
        // In production, you might want to use a more sophisticated notification system
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