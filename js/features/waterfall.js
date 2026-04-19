// Waterfall Feature Module
export class WaterfallFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.currentPeriod = 'totaal';
        this.currentAnalysis = 'components';
        this.waterfallChart = null;
        this.trendChart = null;
        this.handlersAttached = false;
        this.activeModal = null;
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
            this.update();
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
                // Keep the period selector aligned with the latest looptijd
                // regardless of whether the waterfall tab is currently visible.
                this.populatePeriodSelector();

                // When visible, also refresh the active analysis panel so
                // trends/ratios reflect the latest calculation results.
                if (this.isWaterfallVisible()) {
                    this.refreshCurrentAnalysis();
                }
            });
        } else {
            console.error('Cannot setup state listener - calculator or stateManager not available');
        }
    }

    isWaterfallVisible() {
        const pane = document.getElementById('waterfall');
        return !!pane && pane.classList.contains('active');
    }

    /**
     * Attach DOM handlers exactly once. activate() may fire multiple times as
     * the user navigates between tabs; re-adding listeners would cause each
     * click to run N times (period change, compare, analysis tab switches).
     */
    setupEventHandlers() {
        if (this.handlersAttached) return;

        const periodSelect = document.getElementById('waterfallPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.update();
                // Keep the non-default analysis panels in sync too.
                if (this.currentAnalysis !== 'components') {
                    this.refreshCurrentAnalysis();
                }
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

        // Use delegation on the static `.analysis-tabs` container so we
        // keep working even if the tab buttons are re-rendered. We also
        // call .closest('.analysis-tab') so taps on a child element of
        // the button (whitespace, icon, text node) still resolve to the
        // right tab.
        const analysisTabs = document.querySelector('.waterfall-analysis .analysis-tabs');
        if (analysisTabs) {
            analysisTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.analysis-tab');
                if (!tab || !analysisTabs.contains(tab)) return;
                this.switchAnalysisTab(tab);
            });
        }

        this.handlersAttached = true;
    }

    populatePeriodSelector() {
        const select = document.getElementById('waterfallPeriod');
        if (!select) return;

        // Prefer looptijd (actual investment duration) and fall back to jaren
        // to stay compatible with older state snapshots.
        const inputs = this.calculator.stateManager.getInputs();
        const years = Number(inputs.looptijd) || Number(inputs.jaren) || 5;

        // Preserve the current selection if it still fits the new range.
        const previous = this.currentPeriod;
        const options = ['<option value="totaal">Totale Periode</option>'];
        for (let i = 1; i <= years; i++) {
            options.push(`<option value="jaar${i}">Jaar ${i}</option>`);
        }
        select.innerHTML = options.join('');

        const yearIndex = previous && previous.startsWith('jaar')
            ? parseInt(previous.replace('jaar', ''), 10)
            : null;
        const stillValid = previous === 'totaal' || (yearIndex && yearIndex <= years);
        select.value = stillValid ? previous : 'totaal';
        this.currentPeriod = select.value;
    }

    updateWithResults(results) {
        this.update();
        // Keep trends/ratios in sync with the latest results too.
        if (this.currentAnalysis !== 'components') {
            this.refreshCurrentAnalysis();
        }
    }

    update() {
        const waterfallData = this.getWaterfallData(this.currentPeriod);

        if (waterfallData && waterfallData.totals) {
            this.updateSummaryCards(waterfallData.totals);
            this.updateWaterfallChart(waterfallData);
            this.updateLoanContext(waterfallData);
            this.updateTable(waterfallData);
            this.generateInsights(waterfallData);
        }
    }

    refreshCurrentAnalysis() {
        switch (this.currentAnalysis) {
            case 'trends':
                this.showTrendsAnalysis(document.querySelector('[data-analysis-panel="trends"]'));
                break;
            case 'ratios':
                this.showRatiosAnalysis(document.querySelector('[data-analysis-panel="ratios"]'));
                break;
            case 'components':
            default:
                // Components is refreshed as part of update()
                break;
        }
    }

    getWaterfallData(period) {
        // Get real data from calculator if available
        if (this.calculator && typeof this.calculator.getWaterfallData === 'function') {
            const data = this.calculator.getWaterfallData(period);
            if (data && data.data && data.data.length > 0) {
                return {
                    data: data.data,
                    totals: data.totals,
                    startValue: data.startValue,
                    finalValue: data.finalValue,
                    loanInfo: data.loanInfo,
                    period: period
                };
            }
        }

        const mockData = {
            data: [
                { label: 'Eigen Vermogen (start)', value: 100000, type: 'start' },
                { label: 'Bruto Rendement', value: 15000, type: 'positive' },
                { label: 'Belasting', value: -3750, type: 'negative' },
                { label: 'Rentelasten', value: -2500, type: 'negative' },
                { label: 'Vaste Kosten', value: -1200, type: 'negative' },
                { label: 'Eigen Vermogen (eind)', value: 107550, type: 'total' }
            ],
            totals: {
                bruttoOpbrengst: 15000,
                belasting: 3750,
                rente: 2500,
                aflossing: 10000,
                kosten: 1200
            },
            startValue: 100000,
            finalValue: 107550,
            loanInfo: {
                leningStart: 50000,
                leningEnd: 40000,
                aflossingTotaal: 10000,
                renteTotaal: 2500
            },
            period: period
        };

        return mockData;
    }

    /**
     * Summary metrics are derived directly from the equity-waterfall identity:
     *   ΔEigen Vermogen = Bruto Rendement − Belasting − Rente − Vaste Kosten
     * Aflossingen (principal repayments) are deliberately excluded - they
     * shift value between cash and debt but do not change equity, so mixing
     * them into "uitgaven" makes the cards inconsistent with the chart.
     */
    updateSummaryCards(totals) {
        const bruto = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const kosten = totals.kosten || 0;

        const kostenTotaal = rente + kosten;
        const nettoResultaat = bruto - belasting - kostenTotaal;
        const efficientie = bruto > 0 ? (nettoResultaat / bruto) * 100 : 0;
        const belastingTarief = bruto > 0 ? (belasting / bruto) * 100 : 0;

        this.updateElement('wfBrutoRendement', this.formatCurrency(bruto));
        this.updateElement('wfBrutoRendementDetail', 'Vóór belasting, rente en kosten');

        this.updateElement('wfKostenTotaal', this.formatCurrency(kostenTotaal));
        this.updateElement('wfKostenDetail', `Rente: ${this.formatCurrency(rente)} | Vaste kosten: ${this.formatCurrency(kosten)}`);

        this.updateElement('wfNettoResultaat', this.formatCurrency(nettoResultaat));
        this.updateElement('wfNettoResultaatDetail', `${efficientie.toFixed(1)}% van bruto rendement`);

        this.updateElement('wfBelastingTarief', `${belastingTarief.toFixed(1)}%`);
        this.updateElement('wfBelastingDetail', `Op bruto rendement`);
    }

    updateWaterfallChart(waterfallData) {
        const ctx = document.getElementById('waterfallChart');
        if (!ctx) return;

        // Keep the latest waterfall data available to the tooltip callbacks,
        // which are bound once at chart creation and otherwise would hold on
        // to a stale closure when only the dataset is updated.
        this.currentWaterfallData = waterfallData;

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
        // configuration, so we must destroy any foreign chart instance first
        // to avoid Chart.js' "Canvas is already in use" error.
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
                                title: (items) => (items && items.length ? items[0].label || '' : ''),
                                label: (context) => {
                                    const current = this.currentWaterfallData;
                                    const item = current && current.data
                                        ? current.data[context.dataIndex]
                                        : null;
                                    if (!item) return this.formatCurrency(0);

                                    if (item.type === 'start' || item.type === 'total') {
                                        return this.formatCurrency(item.value);
                                    }

                                    const sign = item.value >= 0 ? '+' : '−';
                                    return `${sign} ${this.formatCurrency(Math.abs(item.value))}`;
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

        const totals = waterfallData.totals || {};
        const bruto = Math.max(totals.bruttoOpbrengst || 0, 0);
        const referenceValue = bruto > 0 ? bruto : 1;

        // data-label values double as the column name in the mobile
        // stacked-card layout (see waterfall.css).
        const colLabels = { bedrag: 'Bedrag', shareBruto: '% van Bruto', impact: 'Impact' };

        let html = '';

        waterfallData.data.forEach(item => {
            if (item.type === 'start' || item.type === 'total') return;

            const absValue = Math.abs(item.value);
            const percentageOfBruto = bruto > 0 ? (absValue / referenceValue) * 100 : 0;
            const impactWidth = Math.min(percentageOfBruto, 100);

            const impactBar = `
                <div class="impact-bar" role="progressbar" aria-valuenow="${impactWidth.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
                    <div class="impact-bar-fill ${item.value >= 0 ? 'positive' : 'negative'}"
                         style="width: ${impactWidth}%"></div>
                </div>
            `;

            const valueClass = item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : '';
            const shareText = bruto > 0 ? percentageOfBruto.toFixed(1) + '%' : '—';

            html += `
                <tr>
                    <td><div class="component-label">${item.label}</div></td>
                    <td class="${valueClass}" data-label="${colLabels.bedrag}">${this.formatCurrency(item.value)}</td>
                    <td data-label="${colLabels.shareBruto}">${shareText}</td>
                    <td data-label="${colLabels.impact}">${impactBar}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    /**
     * Render a small panel that explains how the loan moves through the
     * period. The waterfall chart intentionally leaves lening and aflossing
     * out of the flow (they do not change equity), so users need a separate
     * context view to see why the lening is not a bar on the chart.
     */
    updateLoanContext(waterfallData) {
        const container = document.getElementById('waterfallLoanContext');
        if (!container) return;

        const info = waterfallData.loanInfo || {};
        const leningStart = Number(info.leningStart || 0);
        const leningEnd = Number(info.leningEnd || 0);
        const aflossing = Number(info.aflossingTotaal || 0);
        const rente = Number(info.renteTotaal || 0);

        // When the scenario has no leverage at all, hide the panel instead
        // of showing four zero rows which adds clutter without information.
        if (leningStart <= 0 && leningEnd <= 0 && aflossing <= 0 && rente <= 0) {
            container.hidden = true;
            container.innerHTML = '';
            return;
        }

        container.hidden = false;
        container.innerHTML = `
            <h4 class="loan-context-title">🏦 Lening</h4>
            <div class="loan-context-grid">
                <div class="loan-context-item">
                    <div class="loan-context-label">Lening begin</div>
                    <div class="loan-context-value">${this.formatCurrency(leningStart)}</div>
                </div>
                <div class="loan-context-item">
                    <div class="loan-context-label">Aflossingen</div>
                    <div class="loan-context-value">${this.formatCurrency(aflossing)}</div>
                </div>
                <div class="loan-context-item">
                    <div class="loan-context-label">Lening eind</div>
                    <div class="loan-context-value">${this.formatCurrency(leningEnd)}</div>
                </div>
                <div class="loan-context-item">
                    <div class="loan-context-label">Rente betaald</div>
                    <div class="loan-context-value loan-context-value--negative">${this.formatCurrency(rente)}</div>
                </div>
            </div>
        `;
    }

    generateInsights(waterfallData) {
        const insights = [];
        const totals = waterfallData.totals;

        if (!totals) return;

        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const kosten = totals.kosten || 0;
        // Netto hier = verandering in eigen vermogen door de flow componenten.
        // Aflossingen veranderen eigen vermogen niet en worden daarom niet
        // afgetrokken (zie waterfall data model).
        const netto = bruttoInkomsten - belasting - rente - kosten;

        const efficiency = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
        if (efficiency > 50) {
            insights.push({
                type: 'success',
                text: `Sterke netto marge: ${efficiency.toFixed(1)}% van het bruto rendement groeit door naar het eigen vermogen (na belasting, rente en vaste kosten).`
            });
        } else if (efficiency < 20 && bruttoInkomsten > 0) {
            insights.push({
                type: 'warning',
                text: `Lage netto marge: slechts ${efficiency.toFixed(1)}% van het bruto rendement blijft over na belasting, rente en kosten. Overweeg kostenoptimalisatie.`
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

        if (insights.length === 0) {
            insights.push({
                type: 'info',
                text: 'Geen bijzonderheden in deze periode. De cashflow is in balans.'
            });
        }

        const container = document.getElementById('waterfallInsights');
        if (container) {
            container.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    ${insight.text}
                </div>
            `).join('');
        }
    }

    switchAnalysisTab(tabElement) {
        const analysisType = tabElement && tabElement.dataset ? tabElement.dataset.analysis : null;
        if (!analysisType) return;

        document.querySelectorAll('.analysis-tab').forEach(tab => {
            const active = tab === tabElement;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
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
                this.showTrendsAnalysis(document.querySelector('[data-analysis-panel="trends"]'));
                break;
            case 'ratios':
                this.showRatiosAnalysis(document.querySelector('[data-analysis-panel="ratios"]'));
                break;
            case 'components':
                // Components panel is always kept up to date via update().
                break;
            default:
                break;
        }
    }

    getQuartersForPeriod(period) {
        const monthlyData = (this.calculator && this.calculator.data)
            ? this.calculator.data.monthlyData || []
            : [];

        if (monthlyData.length === 0) return [];

        // Determine which calendar months to consider based on the active
        // period selector. For "totaal" aggregate all months into Q1..Q4;
        // for a single year restrict to that year's 12 months.
        let relevant = monthlyData;
        if (period && period.startsWith('jaar')) {
            const year = parseInt(period.replace('jaar', ''), 10);
            if (Number.isFinite(year) && year > 0) {
                const start = (year - 1) * 12;
                const end = Math.min(year * 12, monthlyData.length);
                relevant = monthlyData.slice(start, end);
            }
        }

        const quarters = [];
        for (let q = 1; q <= 4; q++) {
            const quarterStart = (q - 1) * 3 + 1;
            const quarterEnd = q * 3;
            const quarterMonths = relevant.filter(m => {
                const monthInYear = ((m.month - 1) % 12) + 1;
                return monthInYear >= quarterStart && monthInYear <= quarterEnd;
            });

            if (quarterMonths.length > 0) {
                const bruto = quarterMonths.reduce((s, m) => s + (m.bruttoOpbrengst || 0), 0);
                const netto = quarterMonths.reduce((s, m) => s + (m.netto || 0), 0);
                quarters.push({ quarter: q, bruto, netto });
            }
        }

        return quarters;
    }

    showTrendsAnalysis(container) {
        if (!container) return;

        let quarters = this.getQuartersForPeriod(this.currentPeriod);

        // Fallback to mock data if no real data is available yet so the
        // panel still renders something meaningful on first load.
        if (quarters.length === 0) {
            quarters = [
                { quarter: 1, bruto: 3750, netto: 2100 },
                { quarter: 2, bruto: 3750, netto: 2200 },
                { quarter: 3, bruto: 3750, netto: 2300 },
                { quarter: 4, bruto: 3750, netto: 2400 }
            ];
        }

        const periodLabel = this.getPeriodName(this.currentPeriod);

        container.innerHTML = `
            <div class="trends-grid">
                <div class="trend-card">
                    <h4>📈 Rendement Trend</h4>
                    <p>Kwartaal gemiddelden voor ${periodLabel}</p>
                    <div class="trend-chart-wrapper">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
                <div class="trend-card">
                    <h4>📊 Cashflow Ontwikkeling</h4>
                    <div class="trend-stats">
                        ${quarters.map(q => `
                            <div>
                                <span>Q${q.quarter}</span>
                                <span>${this.formatCurrency(q.netto)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.createTrendChart(quarters);
    }

    showRatiosAnalysis(container) {
        if (!container) return;

        const waterfallData = this.getWaterfallData(this.currentPeriod);
        const totals = waterfallData.totals;

        if (!totals || !(totals.bruttoOpbrengst > 0)) {
            container.innerHTML = '<p class="empty-state">Geen ratio data beschikbaar voor deze periode.</p>';
            return;
        }

        const ratios = this.calculateRatios(totals);
        const periodLabel = this.getPeriodName(this.currentPeriod);

        container.innerHTML = `
            <div class="ratios-analysis">
                <h4>Financiële Ratio's - ${periodLabel}</h4>
                <div class="ratios-grid">
                    ${ratios.map(ratio => `
                        <div class="ratio-card">
                            <div class="ratio-label">${ratio.label}</div>
                            <div class="ratio-value">${ratio.value}</div>
                            <div class="ratio-description">${ratio.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateRatios(totals) {
        const bruto = totals.bruttoOpbrengst || 1;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const kosten = totals.kosten || 0;
        const nettoNaBelasting = bruto - belasting;
        const nettoResultaat = nettoNaBelasting - rente - kosten;

        return [
            {
                label: 'Netto Marge',
                value: (nettoResultaat / bruto * 100).toFixed(1) + '%',
                description: 'Eigen vermogensgroei (bruto − belasting − rente − kosten) als % van bruto rendement'
            },
            {
                label: 'Belastingdruk',
                value: (belasting / bruto * 100).toFixed(1) + '%',
                description: 'Belasting als % van bruto rendement'
            },
            {
                label: 'Rentelast',
                value: (rente / bruto * 100).toFixed(1) + '%',
                description: 'Rente op lening als % van bruto rendement'
            },
            {
                label: 'Kostenratio',
                value: (kosten / bruto * 100).toFixed(1) + '%',
                description: 'Vaste kosten als % van bruto rendement'
            },
            {
                label: 'Netto na Belasting',
                value: (nettoNaBelasting / bruto * 100).toFixed(1) + '%',
                description: 'Rendement na belasting als % van bruto'
            },
            {
                label: 'Totale Kostenratio',
                value: ((belasting + rente + kosten) / bruto * 100).toFixed(1) + '%',
                description: 'Belasting + rente + kosten als % van bruto rendement'
            }
        ];
    }

    createTrendChart(quarters) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        // The canvas is destroyed and recreated every time showTrendsAnalysis
        // rebuilds the panel, so make sure we release Chart.js' reference to
        // the old canvas before instantiating a new chart on the new one.
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
        const existing = typeof Chart !== 'undefined' && Chart.getChart
            ? Chart.getChart(ctx)
            : null;
        if (existing) existing.destroy();

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters.map(q => `Q${q.quarter}`),
                datasets: [{
                    label: 'Bruto Rendement',
                    data: quarters.map(q => q.bruto),
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Netto Cashflow',
                    data: quarters.map(q => q.netto),
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
                            label: (context) => {
                                const label = context.dataset.label || '';
                                return `${label}: ${this.formatCurrency(context.parsed.y)}`;
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

    comparePeriods() {
        try {
            const periods = ['totaal'];
            const inputs = this.calculator.stateManager.getInputs();
            const years = Number(inputs.looptijd) || Number(inputs.jaren) || 5;

            for (let i = 1; i <= years; i++) {
                periods.push(`jaar${i}`);
            }

            const comparisonData = periods.map(period => {
                const data = this.getWaterfallData(period);
                const totals = data.totals || {};
                const bruto = totals.bruttoOpbrengst || 0;
                // Efficiency here reflects how much of the bruto rendement
                // actually ends up as growth in eigen vermogen. Aflossingen
                // do not belong in this ratio (they shift value between cash
                // and debt without changing equity).
                const efficiency = bruto > 0
                    ? ((bruto - (totals.belasting || 0) - (totals.rente || 0) - (totals.kosten || 0)) / bruto) * 100
                    : 0;
                return {
                    period: this.getPeriodName(period),
                    totals,
                    efficiency
                };
            });

            this.showPeriodComparison(comparisonData);
        } catch (error) {
            console.error('Error in comparePeriods:', error);
        }
    }

    showPeriodComparison(comparisonData) {
        // Avoid stacking multiple modals if the user clicks the compare
        // button repeatedly.
        this.closeComparisonModal();

        const modal = document.createElement('div');
        modal.className = 'period-comparison-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Periode vergelijking');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Periode Vergelijking</h3>
                    <button type="button" class="modal-close" aria-label="Sluiten">×</button>
                </div>
                <div class="modal-body">
                    <div class="comparison-table-wrapper">
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Periode</th>
                                    <th title="Rendement op de totale portefeuille (incl. lening), vóór belasting en kosten">Bruto Rendement</th>
                                    <th>Belasting</th>
                                    <th>Rente</th>
                                    <th>Vaste Kosten</th>
                                    <th title="(Bruto − Belasting − Rente − Kosten) / Bruto">Netto Marge</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${comparisonData.map(period => `
                                    <tr>
                                        <td><strong>${period.period}</strong></td>
                                        <td>${this.formatCurrency(period.totals.bruttoOpbrengst || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.belasting || 0)}</td>
                                        <td class="negative">${this.formatCurrency(period.totals.rente || 0)}</td>
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

        const close = () => this.closeComparisonModal();

        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('keydown', keyHandler);

        this.activeModal = { element: modal, keyHandler };
        document.body.appendChild(modal);

        // Move focus to the close button for accessible keyboard handling.
        requestAnimationFrame(() => {
            const btn = modal.querySelector('.modal-close');
            if (btn) btn.focus();
        });
    }

    closeComparisonModal() {
        if (!this.activeModal) {
            // Also clean up any stray modal that might have been added by a
            // previous (pre-fix) run of the page.
            document.querySelectorAll('.period-comparison-modal').forEach(m => m.remove());
            return;
        }
        const { element, keyHandler } = this.activeModal;
        if (element && element.parentNode) element.parentNode.removeChild(element);
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        this.activeModal = null;
    }

    getPeriodName(period) {
        if (!period || period === 'totaal') return 'Totale Periode';
        return period.replace('jaar', 'Jaar ');
    }

    formatCurrency(value) {
        const safe = Number.isFinite(value) ? value : 0;
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(safe);
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
        if (!totals) return [];

        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const rente = totals.rente || 0;
        const kosten = totals.kosten || 0;
        const netto = bruttoInkomsten - belasting - rente - kosten;

        return {
            efficiency: bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0,
            taxRate: bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0,
            interestRatio: bruttoInkomsten > 0 ? (rente / bruttoInkomsten) * 100 : 0,
            costsRatio: bruttoInkomsten > 0 ? (kosten / bruttoInkomsten) * 100 : 0
        };
    }
}
