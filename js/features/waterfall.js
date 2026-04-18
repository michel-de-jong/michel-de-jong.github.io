// Waterfall Feature Module
export class WaterfallFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.currentPeriod = 'totaal';
        this.currentAnalysis = 'components';
        this.waterfallChart = null;
        this.trendChart = null;
        this.handlersBound = false;
        this.activated = false;
    }

    async initialize() {
        try {
            this.setupStateListener();
        } catch (error) {
            console.error('Error initializing waterfall feature:', error);
        }
    }

    activate() {
        try {
            this.setupEventHandlers();
            this.populatePeriodSelector();
            this.activated = true;
            this.update();
            this.refreshActivePanel();
        } catch (error) {
            console.error('Error activating waterfall feature:', error);
        }
    }

    init() {
        return this.initialize();
    }

    setupStateListener() {
        if (this.calculator && this.calculator.stateManager) {
            this.calculator.stateManager.onChange(() => {
                this.populatePeriodSelector();
                if (this.activated) {
                    this.refreshActivePanel();
                }
            });
        }
    }

    setupEventHandlers() {
        if (this.handlersBound) {
            return;
        }

        const periodSelect = document.getElementById('waterfallPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.update();
                this.refreshActivePanel();
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

        const analysisTabsContainer = document.querySelector('.analysis-tabs');
        if (analysisTabsContainer) {
            analysisTabsContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.analysis-tab');
                if (tab && analysisTabsContainer.contains(tab)) {
                    this.switchAnalysisTab(tab);
                }
            });
        }

        this.handlersBound = true;
    }

    populatePeriodSelector() {
        const select = document.getElementById('waterfallPeriod');
        if (!select) return;

        const inputs = this.calculator.stateManager.getInputs();
        const years = Math.max(1, Math.floor(inputs.looptijd || inputs.jaren || 5));

        const previousValue = this.currentPeriod || select.value || 'totaal';
        const options = ['<option value="totaal">Totale Periode</option>'];
        for (let i = 1; i <= years; i++) {
            options.push(`<option value="jaar${i}">Jaar ${i}</option>`);
        }
        select.innerHTML = options.join('');

        const hasPrevious = Array.from(select.options).some(o => o.value === previousValue);
        const newValue = hasPrevious ? previousValue : 'totaal';
        select.value = newValue;
        this.currentPeriod = newValue;
    }

    updateWithResults() {
        this.update();
        this.refreshActivePanel();
    }

    update() {
        const waterfallData = this.getWaterfallData(this.currentPeriod);

        if (waterfallData && waterfallData.totals) {
            this.updateSummaryCards(waterfallData.totals);
            this.updateWaterfallChart(waterfallData);
            this.updateTable(waterfallData);
            this.generateInsights(waterfallData);
        }
    }

    refreshActivePanel() {
        switch (this.currentAnalysis) {
            case 'trends': {
                const trendsPanel = document.getElementById('trendsPanel');
                if (trendsPanel && trendsPanel.classList.contains('active')) {
                    this.showTrendsAnalysis(trendsPanel);
                }
                break;
            }
            case 'ratios': {
                const ratiosPanel = document.getElementById('ratiosPanel');
                if (ratiosPanel && ratiosPanel.classList.contains('active')) {
                    this.showRatiosAnalysis(ratiosPanel);
                }
                break;
            }
            case 'components':
            default:
                break;
        }
    }

    getWaterfallData(period) {
        if (this.calculator && typeof this.calculator.getWaterfallData === 'function') {
            const data = this.calculator.getWaterfallData(period);
            if (data && data.data && data.data.length > 0) {
                return {
                    data: data.data,
                    totals: data.totals,
                    finalValue: data.finalValue,
                    period: period
                };
            }
        }

        const mockData = {
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

        return mockData;
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

        // ChartManager may have pre-created a generic bar chart on this
        // canvas during app init. Our waterfall uses a custom floating-bar
        // configuration, so destroy any foreign chart instance first to
        // avoid Chart.js' "Canvas is already in use" error.
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
                                    const raw = context.raw;
                                    const diff = Array.isArray(raw) ? raw[1] - raw[0] : Number(raw) || 0;
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
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const denominatorBruto = bruttoInkomsten > 0 ? bruttoInkomsten : 1;
        const last = waterfallData.data[waterfallData.data.length - 1];
        const finalValue = (last && typeof last.value === 'number') ? last.value : 0;
        const denominatorFinal = Math.abs(finalValue) > 0 ? Math.abs(finalValue) : 1;

        let html = '';

        waterfallData.data.forEach(item => {
            if (item.type === 'start' || item.type === 'total') return;

            const absValue = Math.abs(item.value);
            const percentageOfBruto = (absValue / denominatorBruto) * 100;
            const percentageOfFinal = (absValue / denominatorFinal) * 100;

            const impactWidth = Math.min(Math.max(percentageOfBruto, 0), 100);
            const impactBar = `
                <div class="impact-bar">
                    <div class="impact-bar-fill ${item.value >= 0 ? 'positive' : 'negative'}"
                         style="width: ${impactWidth}%"></div>
                </div>
            `;

            html += `
                <tr>
                    <td>${this.escapeHtml(item.label)}</td>
                    <td class="${item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : ''}">
                        ${this.formatCurrency(item.value)}
                    </td>
                    <td>${percentageOfBruto.toFixed(1)}%</td>
                    <td>${percentageOfFinal.toFixed(1)}%</td>
                    <td>${impactBar}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html || `
            <tr>
                <td colspan="5" class="empty-state">Geen cashflow componenten voor deze periode.</td>
            </tr>
        `;
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
        if (bruttoInkomsten > 0) {
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
            if (insights.length === 0) {
                container.innerHTML = `
                    <div class="insight-card info">
                        Geen aandachtspunten voor deze periode: de cashflow ziet er gebalanceerd uit.
                    </div>
                `;
            } else {
                container.innerHTML = insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        ${this.escapeHtml(insight.text)}
                    </div>
                `).join('');
            }
        }
    }

    switchAnalysisTab(tabElement) {
        const analysisType = tabElement.dataset.analysis;
        if (!analysisType) return;

        document.querySelectorAll('.analysis-tab').forEach(tab => {
            const isActive = tab === tabElement;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Show the matching panel and hide the others. Each panel keeps its
        // own DOM so switching back to the Components view does not lose the
        // table/chart targets rendered by update().
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

    /**
     * Get the slice of monthlyData that corresponds to the current period.
     */
    getMonthlyDataForPeriod(period) {
        const monthly = (this.calculator && this.calculator.data && this.calculator.data.monthlyData) || [];
        if (monthly.length === 0) return [];

        if (!period || period === 'totaal') {
            return monthly;
        }

        const year = parseInt(period.replace('jaar', ''), 10);
        if (!Number.isFinite(year) || year < 1) return monthly;

        const startMonth = (year - 1) * 12;
        const endMonth = year * 12;
        return monthly.filter(m => m.month > startMonth && m.month <= endMonth);
    }

    showTrendsAnalysis(container) {
        if (!container) return;

        const monthlyData = this.getMonthlyDataForPeriod(this.currentPeriod);

        const buckets = this.buildTrendBuckets(monthlyData, this.currentPeriod);
        const periodName = this.getPeriodName(this.currentPeriod);
        const bucketLabel = buckets.length > 0 ? buckets[0].label.split(' ')[0] : 'Periode';
        const summaryHeader = this.currentPeriod === 'totaal'
            ? 'Jaarlijkse cashflow ontwikkeling'
            : `Kwartaal cashflow voor ${periodName}`;

        container.innerHTML = `
            <div class="trends-grid">
                <div class="trend-card">
                    <h4>📈 Rendement Trend</h4>
                    <p>${this.escapeHtml(this.currentPeriod === 'totaal'
                        ? 'Bruto en netto cashflow per jaar'
                        : 'Bruto en netto cashflow per kwartaal')}</p>
                    <div class="trend-chart-wrapper">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
                <div class="trend-card">
                    <h4>📊 ${this.escapeHtml(summaryHeader)}</h4>
                    <div class="trend-stats">
                        ${buckets.length === 0 ? `
                            <div class="empty-state">Geen data beschikbaar voor deze periode.</div>
                        ` : buckets.map(b => `
                            <div>
                                <span>${this.escapeHtml(b.label)}</span>
                                <span class="${b.netto < 0 ? 'negative' : 'positive'}">${this.formatCurrency(b.netto)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.createTrendChart(buckets);
    }

    buildTrendBuckets(monthlyData, period) {
        if (!monthlyData || monthlyData.length === 0) return [];

        if (!period || period === 'totaal') {
            const years = new Map();
            for (const m of monthlyData) {
                const year = Math.ceil(m.month / 12);
                if (!years.has(year)) {
                    years.set(year, { label: `Jaar ${year}`, bruto: 0, netto: 0 });
                }
                const entry = years.get(year);
                entry.bruto += m.bruttoOpbrengst || 0;
                entry.netto += m.netto || 0;
            }
            return Array.from(years.values());
        }

        const quarters = new Map();
        for (const m of monthlyData) {
            const monthInYear = ((m.month - 1) % 12) + 1;
            const q = Math.ceil(monthInYear / 3);
            if (!quarters.has(q)) {
                quarters.set(q, { label: `Q${q}`, bruto: 0, netto: 0 });
            }
            const entry = quarters.get(q);
            entry.bruto += m.bruttoOpbrengst || 0;
            entry.netto += m.netto || 0;
        }
        return Array.from(quarters.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, v]) => v);
    }

    showRatiosAnalysis(container) {
        if (!container) return;
        const waterfallData = this.getWaterfallData(this.currentPeriod);
        const totals = waterfallData.totals;

        if (!totals || (totals.bruttoOpbrengst || 0) === 0) {
            container.innerHTML = `
                <div class="ratios-analysis">
                    <h4>Financiële Ratio's — ${this.escapeHtml(this.getPeriodName(this.currentPeriod))}</h4>
                    <p class="empty-state">Geen ratio data beschikbaar voor deze periode.</p>
                </div>
            `;
            return;
        }

        const ratios = this.calculateRatios(totals);

        container.innerHTML = `
            <div class="ratios-analysis">
                <h4>Financiële Ratio's — ${this.escapeHtml(this.getPeriodName(this.currentPeriod))}</h4>
                <div class="ratios-grid">
                    ${ratios.map(ratio => `
                        <div class="ratio-card">
                            <div class="ratio-label">${this.escapeHtml(ratio.label)}</div>
                            <div class="ratio-value">${this.escapeHtml(ratio.value)}</div>
                            <div class="ratio-description">${this.escapeHtml(ratio.description)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateRatios(totals) {
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const denom = bruttoInkomsten > 0 ? bruttoInkomsten : 1;
        const nettoInkomsten = bruttoInkomsten - (totals.belasting || 0);
        const totaleKosten = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);

        const fmt = (value) => `${value.toFixed(1)}%`;

        return [
            {
                label: 'Cashflow Conversie',
                value: fmt(((nettoInkomsten - totaleKosten) / denom) * 100),
                description: 'Netto cashflow als % van bruto'
            },
            {
                label: 'Belastingdruk',
                value: fmt(((totals.belasting || 0) / denom) * 100),
                description: 'Belasting als % van bruto'
            },
            {
                label: 'Rentelast',
                value: fmt(((totals.rente || 0) / denom) * 100),
                description: 'Rente als % van bruto'
            },
            {
                label: 'Kostenratio',
                value: fmt(((totals.kosten || 0) / denom) * 100),
                description: 'Vaste kosten als % van bruto'
            },
            {
                label: 'Operationele Efficiëntie',
                value: fmt((nettoInkomsten / denom) * 100),
                description: 'Netto na belasting als % van bruto'
            },
            {
                label: 'Financieringsdruk',
                value: fmt((((totals.rente || 0) + (totals.aflossing || 0)) / denom) * 100),
                description: 'Totale financiering als % van bruto'
            }
        ];
    }

    createTrendChart(buckets) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const existing = typeof Chart !== 'undefined' && Chart.getChart
            ? Chart.getChart(ctx)
            : null;
        if (existing) existing.destroy();
        this.trendChart = null;

        if (!buckets || buckets.length === 0) return;

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: buckets.map(b => b.label),
                datasets: [{
                    label: 'Bruto Rendement',
                    data: buckets.map(b => b.bruto),
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Netto Cashflow',
                    data: buckets.map(b => b.netto),
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
        try {
            const inputs = this.calculator.stateManager.getInputs();
            const years = Math.max(1, Math.floor(inputs.looptijd || inputs.jaren || 5));
            const periods = ['totaal'];
            for (let i = 1; i <= years; i++) {
                periods.push(`jaar${i}`);
            }

            const comparisonData = periods.map(period => {
                const data = this.getWaterfallData(period);
                const totals = data.totals || {};
                const bruto = totals.bruttoOpbrengst || 0;
                const netto = bruto - (totals.belasting || 0) - (totals.rente || 0)
                    - (totals.aflossing || 0) - (totals.kosten || 0);
                const efficiency = bruto > 0 ? (netto / bruto) * 100 : 0;
                return {
                    period: this.getPeriodName(period),
                    totals,
                    netto,
                    efficiency
                };
            });

            this.showPeriodComparison(comparisonData);
        } catch (error) {
            console.error('Error in comparePeriods:', error);
        }
    }

    showPeriodComparison(comparisonData) {
        document.querySelectorAll('.period-comparison-modal').forEach(el => el.remove());

        const modal = document.createElement('div');
        modal.className = 'period-comparison-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'periodComparisonTitle');
        modal.innerHTML = `
            <div class="modal-content" role="document">
                <div class="modal-header">
                    <h3 id="periodComparisonTitle">📊 Periode Vergelijking</h3>
                    <button type="button" class="modal-close" aria-label="Sluiten">×</button>
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
                                    <th>Netto</th>
                                    <th>Efficiëntie</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${comparisonData.map(period => `
                                    <tr>
                                        <td><strong>${this.escapeHtml(period.period)}</strong></td>
                                        <td>${this.formatCurrency(period.totals.bruttoOpbrengst || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.belasting || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.rente || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.aflossing || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.kosten || 0)}</td>
                                        <td class="${period.netto < 0 ? 'negative' : 'positive'}">${this.formatCurrency(period.netto)}</td>
                                        <td class="${period.efficiency > 50 ? 'positive' : period.efficiency < 20 ? 'negative' : ''}">${period.efficiency.toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', onKeydown);
        };
        const onKeydown = (e) => {
            if (e.key === 'Escape') closeModal();
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', onKeydown);
    }

    getPeriodName(period) {
        if (!period || period === 'totaal') return 'Totale Periode';
        return period.replace('jaar', 'Jaar ');
    }

    formatCurrency(value) {
        const num = Number.isFinite(value) ? value : 0;
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
