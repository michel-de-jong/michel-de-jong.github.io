// Waterfall Feature Module
export class WaterfallFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.currentPeriod = 'totaal';
        this.currentAnalysis = 'components';
        this.waterfallChart = null;
        this.trendChart = null;
        this._handlersAttached = false;
    }
    
    async initialize() {
        console.log('Initializing waterfall feature...');
        try {
            this.setupStateListener();
            console.log('Waterfall feature initialized successfully');
        } catch (error) {
            console.error('Error initializing waterfall feature:', error);
        }
    }

    activate() {
        console.log('Activating waterfall feature for tab access...');
        try {
            this.setupEventHandlers();
            this.populatePeriodSelector();
            this.update();
            console.log('Waterfall feature activated successfully');
        } catch (error) {
            console.error('Error activating waterfall feature:', error);
        }
    }

    init() {
        return this.initialize();
    }

    setupStateListener() {
        console.log('Setting up state listener...');
        if (this.calculator && this.calculator.stateManager) {
            this.calculator.stateManager.onChange(() => {
                console.log('State changed, updating period selector...');
                this.populatePeriodSelector();
            });
            console.log('State listener setup successfully');
        } else {
            console.error('Cannot setup state listener - calculator or stateManager not available');
        }
    }

    setupEventHandlers() {
        // Guard against attaching listeners multiple times across repeated activate() calls.
        // The waterfall template is inserted into the DOM once and never re-created, so we
        // only need to bind handlers on the very first activation.
        if (this._handlersAttached) {
            return;
        }

        const periodSelect = document.getElementById('waterfallPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.update();
            });
        }
        
        const compareBtn = document.getElementById('comparePeriodsBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                try {
                    this.comparePeriods();
                } catch (error) {
                    console.error('Error in comparePeriods:', error);
                }
            });
        }
        
        // Use event delegation on the container so clicks on any child element
        // (e.g. a <span> inside a button) are still correctly handled.
        const analysisTabs = document.querySelector('.analysis-tabs');
        if (analysisTabs) {
            analysisTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.analysis-tab');
                if (tab) {
                    this.switchAnalysisTab(tab);
                }
            });
        }

        this._handlersAttached = true;
    }
    
    populatePeriodSelector() {
        const select = document.getElementById('waterfallPeriod');
        if (!select) {
            return;
        }
        
        // The calculator uses "looptijd" (duration in years) as the authoritative key.
        const inputs = this.calculator.stateManager.getInputs();
        const years = inputs.looptijd || inputs.jaren || 5;
        
        select.innerHTML = '<option value="totaal">Totale Periode</option>';
        
        for (let i = 1; i <= years; i++) {
            const opt = document.createElement('option');
            opt.value = `jaar${i}`;
            opt.textContent = `Jaar ${i}`;
            select.appendChild(opt);
        }

        // Restore previously selected value when it still exists in the new list.
        if (this.currentPeriod && select.querySelector(`option[value="${this.currentPeriod}"]`)) {
            select.value = this.currentPeriod;
        } else {
            this.currentPeriod = 'totaal';
            select.value = 'totaal';
        }
    }
    
    updateWithResults(results) {
        this.update();
    }
    
    update() {
        const waterfallData = this.getWaterfallData(this.currentPeriod);
        
        if (waterfallData && waterfallData.totals) {
            this.updateSummaryCards(waterfallData.totals);
            this.updateWaterfallChart(waterfallData);
            this.updateTable(waterfallData);
            this.generateInsights(waterfallData);

            // Keep the currently active analysis panel in sync when data changes.
            if (this.currentAnalysis === 'trends') {
                this.showTrendsAnalysis(document.getElementById('trendsPanel'));
            } else if (this.currentAnalysis === 'ratios') {
                this.showRatiosAnalysis(document.getElementById('ratiosPanel'));
            }
        }
    }
    
    getWaterfallData(period) {
        if (this.calculator && typeof this.calculator.getWaterfallData === 'function') {
            const data = this.calculator.getWaterfallData(period);
            if (data && data.data && data.data.length > 0) {
                return {
                    data: data.data,
                    totals: data.totals,
                    period: period
                };
            }
        }
        
        // Fallback mock data used before a calculation has been run.
        return {
            data: [
                { label: 'Start Kapitaal', value: 100000, type: 'start' },
                { label: 'Lening', value: 50000, type: 'positive' },
                { label: 'Bruto Rendement', value: 15000, type: 'positive' },
                { label: 'Belasting', value: -3750, type: 'negative' },
                { label: 'Rente Kosten', value: -2500, type: 'negative' },
                { label: 'Aflossingen', value: -10000, type: 'negative' },
                { label: 'Vaste Kosten', value: -1200, type: 'negative' },
                { label: 'Eindwaarde', value: 147550, type: 'total' }
            ],
            totals: {
                bruttoOpbrengst: 15000,
                belasting: 3750,
                rente: 2500,
                aflossing: 10000,
                kosten: 1200
            },
            period: period
        };
    }
    
    updateSummaryCards(totals) {
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const uitgaven = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
        const nettoInkomsten = bruttoInkomsten - belasting;
        const netto = nettoInkomsten - uitgaven;
        const cashflowRatio = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
        const belastingTarief = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
        
        this.updateElement('wfTotaleInkomsten', this.formatCurrency(nettoInkomsten));
        this.updateElement('wfInkomstenDetail', `Bruto: ${this.formatCurrency(bruttoInkomsten)} | Belasting: ${this.formatCurrency(belasting)}`);
        
        this.updateElement('wfTotaleUitgaven', this.formatCurrency(uitgaven));
        this.updateElement('wfUitgavenDetail', `Rente: ${this.formatCurrency(totals.rente || 0)} | Aflossing: ${this.formatCurrency(totals.aflossing || 0)} | Kosten: ${this.formatCurrency(totals.kosten || 0)}`);
        
        this.updateElement('wfNettoCashflow', this.formatCurrency(netto));
        this.updateElement('wfCashflowDetail', `${cashflowRatio.toFixed(1)}% van bruto inkomsten`);
        
        this.updateElement('wfBelastingTarief', `${belastingTarief.toFixed(1)}%`);
        this.updateElement('wfBelastingDetail', 'Op bruto rendement');
    }
    
    updateWaterfallChart(waterfallData) {
        const ctx = document.getElementById('waterfallChart');
        if (!ctx) return;
        
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        let cumulative = 0;
        
        waterfallData.data.forEach((item) => {
            labels.push(item.label);
            
            if (item.type === 'start') {
                data.push([0, item.value]);
                cumulative = item.value;
                backgroundColors.push('rgba(30, 60, 114, 0.8)');
                borderColors.push('#1e3c72');
            } else if (item.type === 'total') {
                data.push([0, cumulative]);
                backgroundColors.push('rgba(30, 60, 114, 1)');
                borderColors.push('#1e3c72');
            } else if (item.value >= 0) {
                data.push([cumulative, cumulative + item.value]);
                cumulative += item.value;
                backgroundColors.push('rgba(40, 167, 69, 0.8)');
                borderColors.push('#28a745');
            } else {
                data.push([cumulative + item.value, cumulative]);
                cumulative += item.value;
                backgroundColors.push('rgba(220, 53, 69, 0.8)');
                borderColors.push('#dc3545');
            }
        });
        
        // Destroy any chart instance on this canvas that was created by a
        // different owner (e.g. ChartManager during init).
        const existingChart = typeof Chart !== 'undefined' && Chart.getChart
            ? Chart.getChart(ctx)
            : null;
        if (existingChart && existingChart !== this.waterfallChart) {
            existingChart.destroy();
        }
        
        if (this.waterfallChart) {
            this.waterfallChart.data.labels = labels;
            this.waterfallChart.data.datasets[0].data = data;
            this.waterfallChart.data.datasets[0].backgroundColor = backgroundColors;
            this.waterfallChart.data.datasets[0].borderColor = borderColors;
            this.waterfallChart.options.plugins.title.text =
                `Cashflow Waterfall - ${this.getPeriodName(waterfallData.period)}`;
            this.waterfallChart.update();
        } else {
            this.waterfallChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        barPercentage: 0.8,
                        categoryPercentage: 0.9
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Cashflow Waterfall - ${this.getPeriodName(waterfallData.period)}`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const barData = context.raw;
                                    const diff = Array.isArray(barData)
                                        ? barData[1] - barData[0]
                                        : barData;
                                    return `${this.formatCurrency(Math.abs(diff))}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => this.formatCurrency(value)
                            }
                        }
                    }
                }
            });
        }
    }
    
    updateTable(waterfallData) {
        const tbody = document.getElementById('waterfallTableBody');
        if (!tbody) return;
        
        const totals = waterfallData.totals;
        const bruttoInkomsten = Math.max(totals.bruttoOpbrengst || 1, 1);
        const lastItem = waterfallData.data[waterfallData.data.length - 1];
        const finalValue = lastItem ? Math.max(Math.abs(lastItem.value), 1) : 1;
        
        let html = '';
        
        waterfallData.data.forEach(item => {
            if (item.type === 'start' || item.type === 'total') return;
            
            const absValue = Math.abs(item.value);
            const percentageOfBruto = (absValue / bruttoInkomsten) * 100;
            const percentageOfFinal = (absValue / finalValue) * 100;
            
            const impactWidth = Math.min(percentageOfBruto, 100);
            const impactBar = `
                <div class="impact-bar">
                    <div class="impact-bar-fill ${item.value >= 0 ? 'positive' : 'negative'}" 
                         style="width: ${impactWidth}%"></div>
                </div>
            `;
            
            html += `
                <tr>
                    <td>${item.label}</td>
                    <td class="${item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : ''}">
                        ${this.formatCurrency(item.value)}
                    </td>
                    <td>${percentageOfBruto.toFixed(1)}%</td>
                    <td>${percentageOfFinal.toFixed(1)}%</td>
                    <td>${impactBar}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;color:#6c757d;">Geen data beschikbaar</td></tr>';
    }
    
    generateInsights(waterfallData) {
        const insights = [];
        const totals = waterfallData.totals;
        
        if (!totals) return;
        
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const aflossing = totals.aflossing || 0;
        const kosten = totals.kosten || 0;
        const netto = bruttoInkomsten - belasting - rente - aflossing - kosten;
        
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
        
        const taxRate = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
        if (taxRate > 30) {
            insights.push({
                type: 'warning',
                text: `Hoge belastingdruk: ${taxRate.toFixed(1)}% van bruto rendement. Onderzoek mogelijke fiscale optimalisatie.`
            });
        }
        
        if (rente > 0 && bruttoInkomsten > 0) {
            const interestRatio = (rente / bruttoInkomsten) * 100;
            if (interestRatio > 40) {
                insights.push({
                    type: 'danger',
                    text: `Rentekosten zijn ${interestRatio.toFixed(1)}% van bruto rendement. Leverage werkt mogelijk tegen u.`
                });
            }
        }
        
        if (kosten > 0 && bruttoInkomsten > 0) {
            const kostenRatio = (kosten / bruttoInkomsten) * 100;
            if (kostenRatio > 25) {
                insights.push({
                    type: 'info',
                    text: `Vaste kosten zijn ${kostenRatio.toFixed(1)}% van bruto rendement. Analyse van kostenstructuur aanbevolen.`
                });
            }
        }
        
        const container = document.getElementById('waterfallInsights');
        if (container) {
            container.innerHTML = insights.length
                ? insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        ${insight.text}
                    </div>
                `).join('')
                : '<div class="insight-card info">Geen bijzondere aandachtspunten voor de geselecteerde periode.</div>';
        }
    }
    
    switchAnalysisTab(tabElement) {
        const analysisType = tabElement.dataset.analysis;
        if (!analysisType) return;
        
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.classList.toggle('active', tab === tabElement);
        });
        
        document.querySelectorAll('.analysis-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.analysisPanel === analysisType);
        });
        
        this.currentAnalysis = analysisType;
        
        switch (analysisType) {
            case 'trends':
                this.showTrendsAnalysis(document.getElementById('trendsPanel'));
                break;
            case 'ratios':
                this.showRatiosAnalysis(document.getElementById('ratiosPanel'));
                break;
            case 'components':
            default:
                this.update();
                break;
        }
    }
    
    showTrendsAnalysis(container) {
        if (!container) return;

        // Destroy the previous trend chart instance before rewriting the container's
        // innerHTML, otherwise the canvas element is removed from the DOM while
        // Chart.js still holds a reference to it.
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }

        const yearlyData = this._buildYearlyTrendData();

        if (yearlyData.length === 0) {
            container.innerHTML = '<p class="text-muted" style="padding:20px;text-align:center;">Geen trenddata beschikbaar. Voer eerst een berekening uit.</p>';
            return;
        }

        // Build quarterly stats for the cashflow development table.
        // We show per-year totals split into four quarters for the full looptijd.
        const quarterRows = this._buildQuarterlyRows();

        container.innerHTML = `
            <div class="trends-grid">
                <div class="trend-card">
                    <h4>📈 Rendement per Jaar</h4>
                    <p>Jaarlijks bruto en netto rendement</p>
                    <canvas id="trendChart" height="200"></canvas>
                </div>
                <div class="trend-card">
                    <h4>📊 Cashflow per Kwartaal</h4>
                    <div class="trend-stats">
                        ${quarterRows.map(row => `
                            <div>
                                <span>${row.label}</span>
                                <span>${this.formatCurrency(row.netto)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.createTrendChart(yearlyData);
    }

    _buildYearlyTrendData() {
        if (!this.calculator || !this.calculator.data || !this.calculator.data.monthlyData) {
            return [];
        }

        const monthlyData = this.calculator.data.monthlyData;
        if (monthlyData.length === 0) return [];

        const inputs = this.calculator.stateManager.getInputs();
        const years = inputs.looptijd || inputs.jaren || 5;
        const result = [];

        for (let y = 1; y <= years; y++) {
            const startIdx = (y - 1) * 12;
            const endIdx = Math.min(y * 12, monthlyData.length);
            if (startIdx >= monthlyData.length) break;

            const slice = monthlyData.slice(startIdx, endIdx);
            const bruto = slice.reduce((s, m) => s + (m.bruttoOpbrengst || 0), 0);
            const netto = slice.reduce((s, m) => s + (m.netto || 0), 0);
            result.push({ year: y, bruto, netto });
        }

        return result;
    }

    _buildQuarterlyRows() {
        if (!this.calculator || !this.calculator.data || !this.calculator.data.monthlyData) {
            return [];
        }

        const monthlyData = this.calculator.data.monthlyData;
        if (monthlyData.length === 0) return [];

        const rows = [];
        const totalMonths = monthlyData.length;

        for (let i = 0; i < totalMonths; i += 3) {
            const slice = monthlyData.slice(i, Math.min(i + 3, totalMonths));
            const netto = slice.reduce((s, m) => s + (m.netto || 0), 0);
            const year = Math.floor(i / 12) + 1;
            const quarter = Math.floor((i % 12) / 3) + 1;
            rows.push({ label: `Jaar ${year} Q${quarter}`, netto });
        }

        return rows;
    }
    
    showRatiosAnalysis(container) {
        if (!container) return;
        const waterfallData = this.getWaterfallData('totaal');
        const totals = waterfallData.totals;
        
        if (!totals) {
            container.innerHTML = '<p class="text-muted" style="padding:20px;text-align:center;">Geen ratio data beschikbaar.</p>';
            return;
        }
        
        const ratios = this.calculateRatios(totals);
        
        container.innerHTML = `
            <div class="ratios-analysis">
                <h4>Financiële Ratio's</h4>
                <div class="ratios-grid">
                    ${ratios.map(ratio => `
                        <div class="ratio-card">
                            <div class="ratio-label">${ratio.label}</div>
                            <div class="ratio-value ratio-value--${ratio.status}">${ratio.value}</div>
                            <div class="ratio-description">${ratio.description}</div>
                            <div class="ratio-indicator ratio-indicator--${ratio.status}">${ratio.statusLabel}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    calculateRatios(totals) {
        const bruttoInkomsten = Math.max(totals.bruttoOpbrengst || 1, 1);
        const nettoInkomsten = bruttoInkomsten - (totals.belasting || 0);
        const totaleKosten = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
        const cashflowConversie = ((nettoInkomsten - totaleKosten) / bruttoInkomsten) * 100;
        const belastingdruk = ((totals.belasting || 0) / bruttoInkomsten) * 100;
        const rentelast = ((totals.rente || 0) / bruttoInkomsten) * 100;
        const kostenratio = ((totals.kosten || 0) / bruttoInkomsten) * 100;
        const operationeleEff = (nettoInkomsten / bruttoInkomsten) * 100;
        const financieringsdruk = (((totals.rente || 0) + (totals.aflossing || 0)) / bruttoInkomsten) * 100;

        const getStatus = (value, goodAbove, warnAbove) => {
            if (value >= goodAbove) return { status: 'good', label: '✓ Goed' };
            if (value >= warnAbove) return { status: 'warn', label: '⚠ Matig' };
            return { status: 'bad', label: '✗ Aandacht' };
        };

        const getLowBetterStatus = (value, goodBelow, warnBelow) => {
            if (value <= goodBelow) return { status: 'good', label: '✓ Goed' };
            if (value <= warnBelow) return { status: 'warn', label: '⚠ Matig' };
            return { status: 'bad', label: '✗ Aandacht' };
        };

        return [
            {
                label: 'Cashflow Conversie',
                value: `${cashflowConversie.toFixed(1)}%`,
                description: 'Netto cashflow als % van bruto',
                ...getStatus(cashflowConversie, 40, 20)
            },
            {
                label: 'Belastingdruk',
                value: `${belastingdruk.toFixed(1)}%`,
                description: 'Belasting als % van bruto',
                ...getLowBetterStatus(belastingdruk, 25, 35)
            },
            {
                label: 'Rentelast',
                value: `${rentelast.toFixed(1)}%`,
                description: 'Rente als % van bruto',
                ...getLowBetterStatus(rentelast, 20, 35)
            },
            {
                label: 'Kostenratio',
                value: `${kostenratio.toFixed(1)}%`,
                description: 'Vaste kosten als % van bruto',
                ...getLowBetterStatus(kostenratio, 15, 25)
            },
            {
                label: 'Operationele Efficiëntie',
                value: `${operationeleEff.toFixed(1)}%`,
                description: 'Netto na belasting als % van bruto',
                ...getStatus(operationeleEff, 65, 50)
            },
            {
                label: 'Financieringsdruk',
                value: `${financieringsdruk.toFixed(1)}%`,
                description: 'Totale financiering als % van bruto',
                ...getLowBetterStatus(financieringsdruk, 30, 50)
            }
        ];
    }
    
    createTrendChart(yearlyData) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        // trendChart was already destroyed in showTrendsAnalysis before innerHTML
        // was replaced, so we can safely create a fresh instance here.
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearlyData.map(d => `Jaar ${d.year}`),
                datasets: [{
                    label: 'Bruto Rendement',
                    data: yearlyData.map(d => d.bruto),
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Netto Cashflow',
                    data: yearlyData.map(d => d.netto),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
    
    comparePeriods() {
        const periods = ['totaal'];
        const inputs = this.calculator.stateManager.getInputs();
        const years = inputs.looptijd || inputs.jaren || 5;
        
        for (let i = 1; i <= years; i++) {
            periods.push(`jaar${i}`);
        }
        
        const comparisonData = periods.map(period => {
            const data = this.getWaterfallData(period);
            const t = data.totals || {};
            const bruto = t.bruttoOpbrengst || 0;
            const efficiency = bruto > 0
                ? ((bruto - (t.belasting || 0) - (t.rente || 0) - (t.aflossing || 0) - (t.kosten || 0)) / bruto) * 100
                : 0;
            return {
                period: this.getPeriodName(period),
                totals: t,
                efficiency
            };
        });
        
        this.showPeriodComparison(comparisonData);
    }
    
    showPeriodComparison(comparisonData) {
        const modal = document.createElement('div');
        modal.className = 'period-comparison-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Periode Vergelijking</h3>
                    <button class="modal-close" aria-label="Sluiten">×</button>
                </div>
                <div class="modal-body">
                    <div class="comparison-table-wrapper">
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Periode</th>
                                    <th>Bruto Rendement</th>
                                    <th>Belasting</th>
                                    <th>Rente</th>
                                    <th>Aflossing</th>
                                    <th>Kosten</th>
                                    <th>Efficiëntie</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${comparisonData.map(period => `
                                    <tr>
                                        <td><strong>${period.period}</strong></td>
                                        <td>${this.formatCurrency(period.totals.bruttoOpbrengst || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.belasting || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.rente || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.aflossing || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.kosten || 0)}</td>
                                        <td class="${period.efficiency > 50 ? 'positive' : period.efficiency < 20 ? 'negative' : ''}">${period.efficiency.toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        `;
        
        const closeButton = modal.querySelector('.modal-close');
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.addEventListener('click', () => modal.remove());
        
        const table = modal.querySelector('.comparison-table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        `;
        
        modal.querySelectorAll('.comparison-table th').forEach(th => {
            th.style.cssText = `
                background: #f8f9fa;
                padding: 12px 8px;
                text-align: left;
                border: 1px solid #dee2e6;
                font-weight: 600;
            `;
        });
        
        modal.querySelectorAll('.comparison-table td').forEach(td => {
            td.style.cssText = `padding: 10px 8px; border: 1px solid #dee2e6;`;
            if (td.classList.contains('negative')) td.style.color = '#dc3545';
            else if (td.classList.contains('positive')) td.style.color = '#28a745';
        });
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    getPeriodName(period) {
        if (period === 'totaal') return 'Totale Periode';
        return period.replace('jaar', 'Jaar ');
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    exportWaterfallData() {
        const data = this.getWaterfallData(this.currentPeriod);
        
        return {
            period: this.currentPeriod,
            totals: data.totals,
            components: data.data,
            insights: this.generateInsightsForExport(data)
        };
    }
    
    generateInsightsForExport(waterfallData) {
        const totals = waterfallData.totals;
        if (!totals) return {};
        
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const aflossing = totals.aflossing || 0;
        const kosten = totals.kosten || 0;
        const netto = bruttoInkomsten - belasting - rente - aflossing - kosten;
        
        return {
            efficiency: bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0,
            taxRate: bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0,
            interestRatio: bruttoInkomsten > 0 ? (rente / bruttoInkomsten) * 100 : 0,
            costsRatio: bruttoInkomsten > 0 ? (kosten / bruttoInkomsten) * 100 : 0
        };
    }
}
