// Waterfall Feature Module
export class WaterfallFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.currentPeriod = 'totaal';
        this.showAsPercentage = false;
        this.waterfallChart = null;
        this.trendChart = null;
    }
    
    init() {
        this.setupEventHandlers();
        this.populatePeriodSelector();
        this.update();
    }
    
    setupEventHandlers() {
        const periodSelect = document.getElementById('waterfallPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.update();
            });
        }
        
        const viewToggle = document.getElementById('waterfallViewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('change', (e) => {
                this.showAsPercentage = e.target.checked;
                this.update();
            });
        }
        
        const compareBtn = document.getElementById('comparePeriodsBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.comparePeriods());
        }
        
        // Analysis tab handlers
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAnalysisTab(e.target));
        });
    }
    
    populatePeriodSelector() {
        const select = document.getElementById('waterfallPeriod');
        if (!select) return;
        
        // Get investment duration from calculator
        const years = this.calculator?.inputs?.jaren || 5;
        
        select.innerHTML = '<option value="totaal">Totale Periode</option>';
        
        for (let i = 1; i <= years; i++) {
            select.innerHTML += `<option value="jaar${i}">Jaar ${i}</option>`;
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
        
        // Update DOM elements
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
        
        // Prepare data for Chart.js waterfall visualization
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        let cumulative = 0;
        
        waterfallData.data.forEach((item, index) => {
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
        
        // Create or update chart
        if (this.waterfallChart) {
            this.waterfallChart.data.labels = labels;
            this.waterfallChart.data.datasets[0].data = data;
            this.waterfallChart.data.datasets[0].backgroundColor = backgroundColors;
            this.waterfallChart.data.datasets[0].borderColor = borderColors;
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
                                    const value = context.parsed.y;
                                    const start = context.parsed.x || 0;
                                    const diff = value - start;
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
        const bruttoInkomsten = totals.bruttoOpbrengst || 1;
        const finalValue = waterfallData.data[waterfallData.data.length - 1].value;
        
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
            
            const valueDisplay = this.showAsPercentage ? 
                `${percentageOfBruto.toFixed(1)}%` : 
                this.formatCurrency(item.value);
            
            html += `
                <tr>
                    <td>${item.label}</td>
                    <td class="${item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : ''}">
                        ${valueDisplay}
                    </td>
                    <td>${percentageOfBruto.toFixed(1)}%</td>
                    <td>${percentageOfFinal.toFixed(1)}%</td>
                    <td>${impactBar}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
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
        
        // Fixed costs analysis
        if (kosten > 0 && bruttoInkomsten > 0) {
            const kostenRatio = (kosten / bruttoInkomsten) * 100;
            if (kostenRatio > 25) {
                insights.push({
                    type: 'info',
                    text: `Vaste kosten zijn ${kostenRatio.toFixed(1)}% van bruto rendement. Analyse van kostenstructuur aanbevolen.`
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
    
    switchAnalysisTab(tabElement) {
        // Update active state
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        tabElement.classList.add('active');
        
        // Update content
        const analysisType = tabElement.dataset.analysis;
        const container = document.getElementById('analysisContent');
        
        if (container) {
            switch(analysisType) {
                case 'trends':
                    this.showTrendsAnalysis(container);
                    break;
                case 'ratios':
                    this.showRatiosAnalysis(container);
                    break;
                default:
                    // Components view is default
                    this.update();
                    break;
            }
        }
    }
    
    showTrendsAnalysis(container) {
        // Get real quarterly data from calculator
        let quarters = [];
        
        if (this.calculator && this.calculator.data && this.calculator.data.monthlyData) {
            const monthlyData = this.calculator.data.monthlyData;
            
            for (let q = 1; q <= 4; q++) {
                const quarterMonths = monthlyData.filter(month => {
                    const quarterStart = (q - 1) * 3 + 1;
                    const quarterEnd = q * 3;
                    const monthInYear = ((month.month - 1) % 12) + 1;
                    return monthInYear >= quarterStart && monthInYear <= quarterEnd;
                });
                
                if (quarterMonths.length > 0) {
                    const bruto = quarterMonths.reduce((sum, month) => sum + month.bruttoOpbrengst, 0);
                    const netto = quarterMonths.reduce((sum, month) => sum + month.netto, 0);
                    quarters.push({ quarter: q, bruto, netto });
                }
            }
        }
        
        // Fallback to mock data if no real data available
        if (quarters.length === 0) {
            quarters = [
                { quarter: 1, bruto: 3750, netto: 2100 },
                { quarter: 2, bruto: 3750, netto: 2200 },
                { quarter: 3, bruto: 3750, netto: 2300 },
                { quarter: 4, bruto: 3750, netto: 2400 }
            ];
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
                            <div>
                                <span>Q${q.quarter}</span>
                                <span>${this.formatCurrency(q.netto)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Create trend chart
        this.createTrendChart(quarters);
    }
    
    showRatiosAnalysis(container) {
        const waterfallData = this.getWaterfallData('totaal');
        const totals = waterfallData.totals;
        
        if (!totals) {
            container.innerHTML = '<p>Geen ratio data beschikbaar.</p>';
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
                            <div class="ratio-value">${ratio.value}</div>
                            <div class="ratio-description">${ratio.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    calculateRatios(totals) {
        const bruttoInkomsten = totals.bruttoOpbrengst || 1;
        const nettoInkomsten = bruttoInkomsten - (totals.belasting || 0);
        const totaleKosten = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
        
        return [
            {
                label: 'Cashflow Conversie',
                value: ((nettoInkomsten - totaleKosten) / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Netto cashflow als % van bruto'
            },
            {
                label: 'Belastingdruk',
                value: ((totals.belasting || 0) / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Belasting als % van bruto'
            },
            {
                label: 'Rentelast',
                value: ((totals.rente || 0) / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Rente als % van bruto'
            },
            {
                label: 'Kostenratio',
                value: ((totals.kosten || 0) / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Vaste kosten als % van bruto'
            },
            {
                label: 'Operationele Efficiëntie',
                value: (nettoInkomsten / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Netto na belasting als % van bruto'
            },
            {
                label: 'Financieringsdruk',
                value: (((totals.rente || 0) + (totals.aflossing || 0)) / bruttoInkomsten * 100).toFixed(1) + '%',
                description: 'Totale financiering als % van bruto'
            }
        ];
    }
    
    createTrendChart(quarters) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        if (this.trendChart) {
            this.trendChart.destroy();
        }
        
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
        // Get data for all available periods
        const periods = ['totaal'];
        const years = this.calculator?.inputs?.jaren || 5;
        
        for (let i = 1; i <= years; i++) {
            periods.push(`jaar${i}`);
        }
        
        // Create comparison data
        const comparisonData = periods.map(period => {
            const data = this.getWaterfallData(period);
            return {
                period: this.getPeriodName(period),
                totals: data.totals || {},
                efficiency: data.totals ? 
                    ((data.totals.bruttoOpbrengst - data.totals.belasting - data.totals.rente - data.totals.aflossing - data.totals.kosten) / data.totals.bruttoOpbrengst * 100) : 0
            };
        });
        
        // Create modal or overlay to show comparison
        this.showPeriodComparison(comparisonData);
    }
    
    showPeriodComparison(comparisonData) {
        // Create a modal overlay for period comparison
        const modal = document.createElement('div');
        modal.className = 'period-comparison-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Periode Vergelijking</h3>
                    <button class="modal-close" onclick="this.closest('.period-comparison-modal').remove()">×</button>
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
        
        const table = modal.querySelector('.comparison-table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        `;
        
        const tableHeaders = modal.querySelectorAll('.comparison-table th');
        tableHeaders.forEach(th => {
            th.style.cssText = `
                background: #f8f9fa;
                padding: 12px 8px;
                text-align: left;
                border: 1px solid #dee2e6;
                font-weight: 600;
            `;
        });
        
        const tableCells = modal.querySelectorAll('.comparison-table td');
        tableCells.forEach(td => {
            td.style.cssText = `
                padding: 10px 8px;
                border: 1px solid #dee2e6;
            `;
            
            if (td.classList.contains('negative')) {
                td.style.color = '#dc3545';
            } else if (td.classList.contains('positive')) {
                td.style.color = '#28a745';
            }
        });
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
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
        if (!totals) return [];
        
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
