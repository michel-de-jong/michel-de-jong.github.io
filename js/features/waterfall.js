// Waterfall Feature Module
import { formatNumber } from '../utils/format-utils.js';

export class WaterfallFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.currentPeriod = 'totaal';
        this.showPercentages = false;
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Period selector
        const periodSelect = document.getElementById('waterfallPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.update();
            });
        }
        
        // View toggle
        const viewToggle = document.getElementById('waterfallViewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('change', (e) => {
                this.showPercentages = e.target.checked;
                this.update();
            });
        }
        
        // Compare button
        const compareBtn = document.getElementById('comparePeriodsBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.comparePeriods());
        }
        
        // Analysis tabs
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAnalysisTab(e.target));
        });
    }
    
    activate() {
        // Initialize chart if needed
        if (!this.chartManager.charts.waterfall) {
            const canvas = document.getElementById('waterfallChart');
            if (canvas) {
                this.chartManager.initWaterfallChart();
            }
        }
        
        // Populate period selector
        this.populatePeriods();
        
        // Initial update
        this.update();
    }
    
    populatePeriods() {
        const periodSelect = document.getElementById('waterfallPeriod');
        if (!periodSelect || periodSelect.options.length > 0) return;
        
        const looptijd = this.stateManager.getInput('looptijd') || 10;
        let html = '<option value="totaal">Totale Periode</option>';
        
        for (let i = 1; i <= looptijd; i++) {
            html += `<option value="jaar${i}">Jaar ${i}</option>`;
        }
        
        periodSelect.innerHTML = html;
        periodSelect.value = this.currentPeriod;
    }
    
    update() {
        const waterfallData = this.calculator.getWaterfallData(this.currentPeriod);
        
        if (waterfallData.totals) {
            // Update summary cards
            this.updateSummaryCards(waterfallData.totals);
            
            // Update chart - check if method exists before calling
            if (this.chartManager && typeof this.chartManager.updateWaterfallChart === 'function') {
                this.chartManager.updateWaterfallChart(waterfallData);
            } else {
                // Fallback: Update chart manually if method doesn't exist
                this.updateWaterfallChartFallback(waterfallData);
            }
            
            // Update table
            this.updateTable(waterfallData);
            
            // Generate insights
            this.generateInsights(waterfallData);
        }
    }
    
    updateSummaryCards(totals) {
        const bruttoInkomsten = totals.bruttoOpbrengst || 0;
        const belasting = totals.belasting || 0;
        const uitgaven = (totals.rente || 0) + (totals.aflossing || 0) + (totals.kosten || 0);
        const nettoInkomsten = bruttoInkomsten - belasting;
        const netto = nettoInkomsten - uitgaven;
        const cashflowRatio = bruttoInkomsten > 0 ? (netto / bruttoInkomsten) * 100 : 0;
        const belastingTarief = bruttoInkomsten > 0 ? (belasting / bruttoInkomsten) * 100 : 0;
        
        // Update summary elements
        const elements = {
            wfTotaleInkomsten: formatNumber(bruttoInkomsten),
            wfInkomstenDetail: `Bruto: ${formatNumber(bruttoInkomsten)} | Belasting: ${formatNumber(belasting)}`,
            wfTotaleUitgaven: formatNumber(uitgaven),
            wfUitgavenDetail: `Rente: ${formatNumber(totals.rente || 0)} | Aflossing: ${formatNumber(totals.aflossing || 0)} | Kosten: ${formatNumber(totals.kosten || 0)}`,
            wfNettoCashflow: formatNumber(netto),
            wfCashflowDetail: `${cashflowRatio.toFixed(1)}% van bruto inkomsten`,
            wfBelastingTarief: `${belastingTarief.toFixed(1)}%`,
            wfBelastingDetail: 'Op bruto rendement'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    updateTable(waterfallData) {
        const tbody = document.getElementById('waterfallTableBody');
        if (!tbody || !waterfallData.data.length) return;
        
        let html = '';
        let cumulative = 0;
        const totalBruto = waterfallData.totals?.bruttoOpbrengst || 0;
        const finalValue = waterfallData.finalValue || 0;
        
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
            
            const valueDisplay = this.showPercentages && item.type !== 'start' && item.type !== 'total'
                ? `${percentageOfBruto.toFixed(1)}%`
                : formatNumber(item.value);
            
            html += `
                <tr>
                    <td>${item.label}</td>
                    <td class="${item.value < 0 ? 'negative' : item.value > 0 ? 'positive' : ''}">
                        ${valueDisplay}
                    </td>
                    <td>${item.type !== 'start' && item.type !== 'total' ? percentageOfBruto.toFixed(1) + '%' : '-'}</td>
                    <td>${item.type !== 'start' && item.type !== 'total' ? percentageOfFinal.toFixed(1) + '%' : '-'}</td>
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
                    // Components view is default - refresh table
                    this.update();
                    break;
            }
        }
    }
    
    showTrendsAnalysis(container) {
        const monthlyData = this.calculator.data.monthlyData;
        if (!monthlyData || monthlyData.length === 0) {
            container.innerHTML = '<p>Geen trend data beschikbaar.</p>';
            return;
        }
        
        // Calculate quarterly trends
        const quarters = this.calculateQuarterlyData(monthlyData);
        
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
                            <div>Q${q.quarter}: ${formatNumber(q.netto)}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Create trend chart
        this.createTrendChart(quarters);
    }
    
    showRatiosAnalysis(container) {
        const waterfallData = this.calculator.getWaterfallData('totaal');
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
    
    calculateQuarterlyData(monthlyData) {
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
        
        return quarters;
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
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters.map(q => `Q${q.quarter}`),
                datasets: [{
                    label: 'Bruto Rendement',
                    data: quarters.map(q => q.bruto),
                    borderColor: '#1e3c72',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Netto Cashflow',
                    data: quarters.map(q => q.netto),
                    borderColor: '#28a745',
                    tension: 0.4,
                    fill: false
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
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    comparePeriods() {
        // Feature for comparing multiple periods
        alert('Periode vergelijking komt binnenkort beschikbaar!');
        
        // Future implementation could include:
        // - Multi-period selection
        // - Side-by-side comparison
        // - Period-over-period growth analysis
    }
    
    exportWaterfallData() {
        const data = this.calculator.getWaterfallData(this.currentPeriod);
        
        return {
            period: this.currentPeriod,
            totals: data.totals,
            components: data.data
        };
    }
    
    // Add fallback implementation for updating waterfall chart
    updateWaterfallChartFallback(waterfallData) {
        const chart = this.chartManager?.charts?.waterfall;
        if (!chart) return;
        
        const labels = waterfallData.data.map(item => item.label);
        const positiveData = [];
        const negativeData = [];
        
        // Process data for waterfall visualization
        waterfallData.data.forEach((item, index) => {
            if (item.type === 'start') {
                positiveData[index] = item.value;
                negativeData[index] = null;
            } else if (item.type === 'total') {
                positiveData[index] = null;
                negativeData[index] = null;
            } else if (item.value >= 0) {
                positiveData[index] = item.value;
                negativeData[index] = null;
            } else {
                positiveData[index] = null;
                negativeData[index] = item.value;
            }
        });
        
        // Update chart
        chart.data.labels = labels;
        chart.data.datasets = [
            {
                label: 'Positief',
                data: positiveData,
                backgroundColor: 'rgba(40, 167, 69, 0.8)',
                borderColor: '#28a745',
                borderWidth: 1
            },
            {
                label: 'Negatief',
                data: negativeData,
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: '#dc3545',
                borderWidth: 1
            }
        ];
        
        // Update chart title
        const periodName = waterfallData.period === 'totaal' ? 
            'Totale Periode' : 
            waterfallData.period.replace('jaar', 'Jaar ');
        
        if (chart.options?.plugins?.title) {
            chart.options.plugins.title.text = `Cashflow Waterfall - ${periodName}`;
        }
        
        chart.update('none');
    }
}