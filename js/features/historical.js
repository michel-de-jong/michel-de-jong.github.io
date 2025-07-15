// Historical Performance Tracking & Backtesting Feature Module
import { formatNumber, getCurrentDateString } from '../utils/format-utils.js';
import { statistics } from '../utils/calculation-utils.js';

export class HistoricalFeature {
    constructor(calculator, chartManager, historicalDataService) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.dataService = historicalDataService;
        
        // State
        this.historicalData = [];
        this.projectedData = [];
        this.backtestResults = null;
        this.currentViewType = 'absolute';
        this.currentTimeRange = 'ALL';
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Data source selector
        const dataSource = document.getElementById('dataSource');
        if (dataSource) {
            dataSource.addEventListener('change', (e) => this.handleDataSourceChange(e));
        }
        
        // Fetch data button
        const fetchBtn = document.getElementById('fetchDataBtn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.fetchHistoricalData());
        }
        
        // Manual entry buttons
        const manualBtn = document.getElementById('manualEntryBtn');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => this.showManualEntryModal());
        }
        
        const importCSVBtn = document.getElementById('importCSVBtn');
        if (importCSVBtn) {
            importCSVBtn.addEventListener('click', () => this.importCSV());
        }
        
        // View type radio buttons
        document.querySelectorAll('input[name="viewType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentViewType = e.target.value;
                this.updatePerformanceChart();
            });
        });
        
        // Time range buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTimeRange = e.target.dataset.range;
                this.updatePerformanceChart();
            });
        });
        
        // Backtest button
        const backtestBtn = document.getElementById('runBacktestBtn');
        if (backtestBtn) {
            backtestBtn.addEventListener('click', () => this.runBacktest());
        }
        
        // Export button
        const exportBtn = document.getElementById('exportBacktestBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportBacktestResults());
        }
        
        // Modal controls
        this.setupModalControls();
        
        // Date inputs - set defaults
        this.setDefaultDates();
    }
    
    activate() {
        // Initialize charts if needed
        if (!this.chartManager.charts.performance) {
            this.initializeCharts();
        }
        
        // Load saved historical data
        this.loadSavedData();
        
        // Generate projected data from current calculation
        this.generateProjectedData();
        
        // Update display
        this.updateDisplay();
    }
    
    initializeCharts() {
        // Performance comparison chart
        const perfCanvas = document.getElementById('performanceChart');
        if (perfCanvas) {
            const ctx = perfCanvas.getContext('2d');
            this.chartManager.charts.performance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Geprojecteerd',
                            data: [],
                            borderColor: '#1e3c72',
                            backgroundColor: 'rgba(30, 60, 114, 0.1)',
                            borderWidth: 2,
                            tension: 0.4
                        },
                        {
                            label: 'Werkelijk',
                            data: [],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 2,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Geprojecteerde vs Werkelijke Prestaties'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
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
        
        // Deviation chart
        const devCanvas = document.getElementById('deviationChart');
        if (devCanvas) {
            const ctx = devCanvas.getContext('2d');
            this.chartManager.charts.deviation = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Afwijking %',
                        data: [],
                        backgroundColor: [],
                        borderColor: [],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Afwijkingen van Projectie'
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    handleDataSourceChange(e) {
        const source = e.target.value;
        const symbolGroup = document.getElementById('symbolGroup');
        const fetchBtn = document.getElementById('fetchDataBtn');
        
        // Show/hide symbol input based on source
        if (source === 'yahoofinance' || source === 'alphavantage') {
            symbolGroup.style.display = 'block';
        } else {
            symbolGroup.style.display = 'none';
        }
        
        // Enable fetch button if source is selected
        fetchBtn.disabled = !source;
    }
    
    async fetchHistoricalData() {
        const source = document.getElementById('dataSource').value;
        const symbol = document.getElementById('symbolInput')?.value;
        const startDate = document.getElementById('importStartDate').value;
        const endDate = document.getElementById('importEndDate').value;
        
        if (!source || !startDate || !endDate) {
            alert('Selecteer een data bron en periode.');
            return;
        }
        
        if ((source === 'yahoofinance' || source === 'alphavantage') && !symbol) {
            alert('Voer een symbool/ticker in.');
            return;
        }
        
        try {
            // Show loading state
            this.showLoading(true);
            
            // Fetch data from service
            const data = await this.dataService.fetchData(source, {
                symbol,
                startDate,
                endDate
            });
            
            if (data && data.length > 0) {
                // Process and store data
                this.processImportedData(data, source);
                
                // Update display
                this.updateDisplay();
                
                this.showSuccess(`${data.length} datapunten succesvol geïmporteerd.`);
            } else {
                this.showError('Geen data gevonden voor de opgegeven periode.');
            }
            
        } catch (error) {
            console.error('Error fetching historical data:', error);
            this.showError('Er is een fout opgetreden bij het ophalen van data. ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    processImportedData(data, source) {
        // Transform imported data to our format
        const transformedData = data.map(item => {
            let value, roi, date;
            
            switch(source) {
                case 'yahoofinance':
                case 'alphavantage':
                    // Stock/index data
                    date = item.date;
                    value = item.close || item.value;
                    roi = item.return || this.calculateROI(item.close, data[0].close);
                    break;
                    
                case 'ecb':
                    // Interest rate data
                    date = item.date;
                    value = item.rate;
                    roi = 0; // Not applicable for interest rates
                    break;
                    
                case 'cbs':
                    // Inflation data
                    date = item.date;
                    value = item.inflation;
                    roi = 0; // Not applicable for inflation
                    break;
                    
                default:
                    date = item.date;
                    value = item.value;
                    roi = item.roi || 0;
            }
            
            return {
                date: new Date(date),
                actual: {
                    value: value,
                    roi: roi,
                    cashflow: item.cashflow || 0
                },
                source: source,
                symbol: item.symbol || ''
            };
        });
        
        // Merge with existing data
        this.historicalData = this.mergeHistoricalData(this.historicalData, transformedData);
        
        // Save to storage
        this.saveHistoricalData();
    }
    
    mergeHistoricalData(existing, newData) {
        const merged = [...existing];
        
        newData.forEach(newItem => {
            const existingIndex = merged.findIndex(item => 
                item.date.getTime() === newItem.date.getTime()
            );
            
            if (existingIndex >= 0) {
                // Update existing entry
                merged[existingIndex] = { ...merged[existingIndex], ...newItem };
            } else {
                // Add new entry
                merged.push(newItem);
            }
        });
        
        // Sort by date
        return merged.sort((a, b) => a.date - b.date);
    }
    
    generateProjectedData() {
        const calculatorData = this.calculator.data;
        const inputs = this.stateManager.getInputs();
        
        if (!calculatorData.jaren || calculatorData.jaren.length === 0) {
            return;
        }
        
        this.projectedData = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (inputs.looptijd * 12));
        
        // Generate monthly projected data
        calculatorData.monthlyData.forEach((month, index) => {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + index);
            
            this.projectedData.push({
                date: date,
                projected: {
                    value: month.portfolio + month.cashReserve - month.lening,
                    roi: this.calculateROIFromStart(
                        month.portfolio + month.cashReserve - month.lening,
                        inputs.startKapitaal
                    ),
                    cashflow: month.netto
                }
            });
        });
    }
    
    calculateROI(currentValue, startValue) {
        if (startValue === 0) return 0;
        return ((currentValue - startValue) / startValue) * 100;
    }
    
    calculateROIFromStart(currentValue, startValue) {
        return this.calculateROI(currentValue, startValue);
    }
    
    updatePerformanceChart() {
        const chart = this.chartManager.charts.performance;
        if (!chart) return;
        
        // Filter data based on time range
        const filteredData = this.filterDataByTimeRange();
        
        // Prepare chart data
        const chartData = this.prepareChartData(filteredData);
        
        // Update chart
        chart.data.labels = chartData.labels;
        chart.data.datasets[0].data = chartData.projected;
        chart.data.datasets[1].data = chartData.actual;
        
        // Update title based on view type
        const titles = {
            'absolute': 'Geprojecteerde vs Werkelijke Waardes',
            'percentage': 'Percentage Verschil van Projectie',
            'cumulative': 'Cumulatief Rendement'
        };
        chart.options.plugins.title.text = titles[this.currentViewType];
        
        chart.update();
    }
    
    filterDataByTimeRange() {
        const now = new Date();
        let startDate = new Date();
        
        switch(this.currentTimeRange) {
            case '1M':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'ALL':
            default:
                startDate = new Date(0); // Beginning of time
        }
        
        return {
            historical: this.historicalData.filter(d => d.date >= startDate),
            projected: this.projectedData.filter(d => d.date >= startDate)
        };
    }
    
    prepareChartData(filteredData) {
        const labels = [];
        const projected = [];
        const actual = [];
        
        // Combine dates from both datasets
        const allDates = new Set();
        filteredData.historical.forEach(d => allDates.add(d.date.toISOString().split('T')[0]));
        filteredData.projected.forEach(d => allDates.add(d.date.toISOString().split('T')[0]));
        
        // Sort dates
        const sortedDates = Array.from(allDates).sort();
        
        sortedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            labels.push(date.toLocaleDateString('nl-NL'));
            
            // Find matching data points
            const historicalPoint = filteredData.historical.find(d => 
                d.date.toISOString().split('T')[0] === dateStr
            );
            const projectedPoint = filteredData.projected.find(d => 
                d.date.toISOString().split('T')[0] === dateStr
            );
            
            if (this.currentViewType === 'absolute') {
                projected.push(projectedPoint ? projectedPoint.projected.value : null);
                actual.push(historicalPoint ? historicalPoint.actual.value : null);
            } else if (this.currentViewType === 'percentage') {
                if (projectedPoint && historicalPoint) {
                    const diff = ((historicalPoint.actual.value - projectedPoint.projected.value) / 
                                 projectedPoint.projected.value) * 100;
                    projected.push(0); // Baseline
                    actual.push(diff);
                } else {
                    projected.push(null);
                    actual.push(null);
                }
            } else if (this.currentViewType === 'cumulative') {
                projected.push(projectedPoint ? projectedPoint.projected.roi : null);
                actual.push(historicalPoint ? historicalPoint.actual.roi : null);
            }
        });
        
        return { labels, projected, actual };
    }
    
    calculateMetrics() {
        if (this.historicalData.length === 0 || this.projectedData.length === 0) {
            return {
                trackingError: 0,
                correlation: 0,
                hitRate: 0,
                maxDeviation: 0
            };
        }
        
        // Find matching data points
        const matchedPairs = [];
        
        this.historicalData.forEach(hist => {
            const projected = this.projectedData.find(proj => 
                Math.abs(proj.date - hist.date) < 86400000 // Within 1 day
            );
            
            if (projected) {
                matchedPairs.push({
                    projected: projected.projected.value,
                    actual: hist.actual.value,
                    projectedROI: projected.projected.roi,
                    actualROI: hist.actual.roi
                });
            }
        });
        
        if (matchedPairs.length === 0) {
            return {
                trackingError: 0,
                correlation: 0,
                hitRate: 0,
                maxDeviation: 0
            };
        }
        
        // Calculate tracking error (standard deviation of differences)
        const differences = matchedPairs.map(pair => 
            ((pair.actual - pair.projected) / pair.projected) * 100
        );
        const trackingError = statistics.standardDeviation(differences);
        
        // Calculate correlation
        const projectedValues = matchedPairs.map(p => p.projected);
        const actualValues = matchedPairs.map(p => p.actual);
        const correlation = this.calculateCorrelation(projectedValues, actualValues);
        
        // Calculate hit rate (correct direction predictions)
        let correctDirections = 0;
        for (let i = 1; i < matchedPairs.length; i++) {
            const projectedChange = matchedPairs[i].projectedROI - matchedPairs[i-1].projectedROI;
            const actualChange = matchedPairs[i].actualROI - matchedPairs[i-1].actualROI;
            if ((projectedChange > 0 && actualChange > 0) || (projectedChange < 0 && actualChange < 0)) {
                correctDirections++;
            }
        }
        const hitRate = matchedPairs.length > 1 ? (correctDirections / (matchedPairs.length - 1)) * 100 : 0;
        
        // Calculate max deviation
        const maxDeviation = Math.max(...differences.map(Math.abs));
        
        return {
            trackingError,
            correlation,
            hitRate,
            maxDeviation
        };
    }
    
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
        const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
        const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    runBacktest() {
        if (this.historicalData.length === 0) {
            alert('Geen historische data beschikbaar voor backtesting.');
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        setTimeout(() => {
            try {
                const results = this.performBacktest();
                this.backtestResults = results;
                
                // Display results
                this.displayBacktestResults(results);
                
                // Generate insights
                this.generateLearningInsights(results);
                
                // Enable export button
                document.getElementById('exportBacktestBtn').disabled = false;
                
            } catch (error) {
                console.error('Backtest error:', error);
                this.showError('Er is een fout opgetreden tijdens de backtest.');
            } finally {
                this.showLoading(false);
            }
        }, 100);
    }
    
    performBacktest() {
        const metrics = this.calculateMetrics();
        const matchedPairs = this.getMatchedPairs();
        
        // Calculate additional backtest metrics
        const errors = matchedPairs.map(pair => pair.actual - pair.projected);
        const percentageErrors = matchedPairs.map(pair => 
            ((pair.actual - pair.projected) / pair.projected) * 100
        );
        
        const avgError = statistics.mean(errors);
        const avgPercentageError = statistics.mean(percentageErrors);
        const rmse = Math.sqrt(statistics.mean(errors.map(e => e * e)));
        
        // Model reliability score (0-100)
        const reliabilityFactors = [
            Math.max(0, 100 - Math.abs(avgPercentageError) * 2), // Low average error
            Math.max(0, 100 - metrics.trackingError), // Low tracking error
            metrics.correlation * 100, // High correlation
            metrics.hitRate // High hit rate
        ];
        const reliability = statistics.mean(reliabilityFactors);
        
        // Deviation analysis by time period
        const deviationByPeriod = this.analyzeDeviationByPeriod(matchedPairs);
        
        return {
            period: {
                start: this.historicalData[0]?.date,
                end: this.historicalData[this.historicalData.length - 1]?.date
            },
            observations: matchedPairs.length,
            metrics: metrics,
            errors: {
                average: avgError,
                averagePercentage: avgPercentageError,
                rmse: rmse
            },
            reliability: reliability,
            deviationByPeriod: deviationByPeriod
        };
    }
    
    getMatchedPairs() {
        const pairs = [];
        
        this.historicalData.forEach(hist => {
            const projected = this.projectedData.find(proj => 
                Math.abs(proj.date - hist.date) < 86400000 // Within 1 day
            );
            
            if (projected) {
                pairs.push({
                    date: hist.date,
                    projected: projected.projected.value,
                    actual: hist.actual.value,
                    projectedROI: projected.projected.roi,
                    actualROI: hist.actual.roi,
                    deviation: ((hist.actual.value - projected.projected.value) / projected.projected.value) * 100
                });
            }
        });
        
        return pairs;
    }
    
    analyzeDeviationByPeriod(matchedPairs) {
        const periods = {};
        
        matchedPairs.forEach(pair => {
            const monthYear = pair.date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short' });
            
            if (!periods[monthYear]) {
                periods[monthYear] = [];
            }
            
            periods[monthYear].push(pair.deviation);
        });
        
        const periodAnalysis = Object.entries(periods).map(([period, deviations]) => ({
            period,
            avgDeviation: statistics.mean(deviations),
            count: deviations.length
        }));
        
        return periodAnalysis.sort((a, b) => Math.abs(b.avgDeviation) - Math.abs(a.avgDeviation));
    }
    
    displayBacktestResults(results) {
        const container = document.getElementById('backtestResults');
        if (!container) return;
        
        container.style.display = 'block';
        
        // Update summary
        document.getElementById('btPeriod').textContent = 
            `${results.period.start.toLocaleDateString('nl-NL')} - ${results.period.end.toLocaleDateString('nl-NL')}`;
        document.getElementById('btObservations').textContent = results.observations;
        document.getElementById('btAvgError').textContent = `${results.errors.averagePercentage.toFixed(2)}%`;
        document.getElementById('btReliability').textContent = `${results.reliability.toFixed(1)}%`;
        
        // Update deviation chart
        this.updateDeviationChart(results.deviationByPeriod);
    }
    
    updateDeviationChart(deviationData) {
        const chart = this.chartManager.charts.deviation;
        if (!chart) return;
        
        const labels = deviationData.map(d => d.period);
        const data = deviationData.map(d => d.avgDeviation);
        const colors = data.map(d => d >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)');
        const borderColors = data.map(d => d >= 0 ? '#28a745' : '#dc3545');
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = colors;
        chart.data.datasets[0].borderColor = borderColors;
        
        chart.update();
    }
    
    generateLearningInsights(results) {
        const insights = [];
        
        // Reliability insight
        if (results.reliability > 80) {
            insights.push({
                type: 'success',
                title: 'Hoge Model Betrouwbaarheid',
                text: `Uw projectiemodel heeft een betrouwbaarheid van ${results.reliability.toFixed(1)}%. De voorspellingen zijn zeer accuraat.`
            });
        } else if (results.reliability < 50) {
            insights.push({
                type: 'warning',
                title: 'Lage Model Betrouwbaarheid',
                text: `Betrouwbaarheid is slechts ${results.reliability.toFixed(1)}%. Overweeg uw aannames te herzien.`
            });
        }
        
        // Average error insight
        if (Math.abs(results.errors.averagePercentage) > 10) {
            insights.push({
                type: 'info',
                title: 'Systematische Afwijking',
                text: `Gemiddeld wijkt de werkelijkheid ${results.errors.averagePercentage.toFixed(1)}% af van projecties. ${results.errors.averagePercentage > 0 ? 'U bent te conservatief' : 'U bent te optimistisch'}.`
            });
        }
        
        // Tracking error insight
        if (results.metrics.trackingError > 15) {
            insights.push({
                type: 'warning',
                title: 'Hoge Volatiliteit',
                text: `Tracking error van ${results.metrics.trackingError.toFixed(1)}% duidt op hoge onvoorspelbaarheid. Overweeg scenario analyse.`
            });
        }
        
        // Hit rate insight
        if (results.metrics.hitRate < 60) {
            insights.push({
                type: 'info',
                title: 'Richtingvoorspellingen',
                text: `Slechts ${results.metrics.hitRate.toFixed(0)}% van uw richtingvoorspellingen was correct. Focus op trends in plaats van absolute waardes.`
            });
        }
        
        // Period-specific insights
        const worstPeriod = results.deviationByPeriod[0];
        if (worstPeriod && Math.abs(worstPeriod.avgDeviation) > 20) {
            insights.push({
                type: 'danger',
                title: 'Extreme Afwijking Periode',
                text: `In ${worstPeriod.period} was de afwijking ${worstPeriod.avgDeviation.toFixed(1)}%. Analyseer wat er toen gebeurde.`
            });
        }
        
        // Display insights
        const container = document.getElementById('learningInsights');
        if (container) {
            container.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    <h4>${insight.title}</h4>
                    <p>${insight.text}</p>
                </div>
            `).join('');
        }
    }
    
    updateDisplay() {
        // Update metrics
        const metrics = this.calculateMetrics();
        
        document.getElementById('trackingError').textContent = `${metrics.trackingError.toFixed(1)}%`;
        document.getElementById('correlation').textContent = metrics.correlation.toFixed(2);
        document.getElementById('hitRate').textContent = `${metrics.hitRate.toFixed(0)}%`;
        document.getElementById('maxDeviation').textContent = `${metrics.maxDeviation.toFixed(1)}%`;
        
        // Update chart
        this.updatePerformanceChart();
    }
    
    // Modal handling
    showManualEntryModal() {
        const modal = document.getElementById('manualEntryModal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        }
    }
    
    setupModalControls() {
        const modal = document.getElementById('manualEntryModal');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelEntryBtn');
        const saveBtn = document.getElementById('saveEntryBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveManualEntry());
        }
        
        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }
    
    closeModal() {
        const modal = document.getElementById('manualEntryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    saveManualEntry() {
        const form = document.getElementById('manualEntryForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const entry = {
            date: new Date(document.getElementById('entryDate').value),
            actual: {
                value: parseFloat(document.getElementById('actualValue').value),
                cashflow: parseFloat(document.getElementById('actualCashflow').value) || 0,
                roi: parseFloat(document.getElementById('actualROI').value) || 0
            },
            notes: document.getElementById('notes').value,
            source: 'manual'
        };
        
        // Add to historical data
        this.historicalData.push(entry);
        this.historicalData.sort((a, b) => a.date - b.date);
        
        // Save and update
        this.saveHistoricalData();
        this.updateDisplay();
        
        // Close modal and reset form
        this.closeModal();
        form.reset();
        
        this.showSuccess('Gegevens succesvol opgeslagen.');
    }
    
    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = this.parseCSV(text);
                
                if (data.length > 0) {
                    this.processImportedData(data, 'csv');
                    this.updateDisplay();
                    this.showSuccess(`${data.length} rijen succesvol geïmporteerd.`);
                }
            } catch (error) {
                console.error('CSV import error:', error);
                this.showError('Fout bij importeren CSV bestand.');
            }
        };
        
        input.click();
    }
    
    parseCSV(text) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < 2) continue;
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim();
            });
            
            // Transform to our format
            data.push({
                date: row.date || row.datum,
                value: parseFloat(row.value || row.waarde || row.portfolio || 0),
                roi: parseFloat(row.roi || row.rendement || 0),
                cashflow: parseFloat(row.cashflow || row.kasstroom || 0)
            });
        }
        
        return data;
    }
    
    exportBacktestResults() {
        if (!this.backtestResults) return;
        
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['Backtest Resultaten'],
            [],
            ['Periode', `${this.backtestResults.period.start.toLocaleDateString('nl-NL')} - ${this.backtestResults.period.end.toLocaleDateString('nl-NL')}`],
            ['Observaties', this.backtestResults.observations],
            ['Gemiddelde Fout %', this.backtestResults.errors.averagePercentage.toFixed(2)],
            ['RMSE', this.backtestResults.errors.rmse.toFixed(2)],
            ['Tracking Error', this.backtestResults.metrics.trackingError.toFixed(2)],
            ['Correlatie', this.backtestResults.metrics.correlation.toFixed(3)],
            ['Hit Rate %', this.backtestResults.metrics.hitRate.toFixed(1)],
            ['Model Betrouwbaarheid %', this.backtestResults.reliability.toFixed(1)]
        ];
        
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Samenvatting');
        
        // Detailed data sheet
        const detailHeaders = ['Datum', 'Geprojecteerd', 'Werkelijk', 'Afwijking %'];
        const detailData = [detailHeaders];
        
        this.getMatchedPairs().forEach(pair => {
            detailData.push([
                pair.date.toLocaleDateString('nl-NL'),
                pair.projected,
                pair.actual,
                pair.deviation.toFixed(2)
            ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Details');
        
        // Save file
        const filename = `Backtest_Resultaten_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }
    
    // Helper methods
    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        
        const startInput = document.getElementById('importStartDate');
        const endInput = document.getElementById('importEndDate');
        
        if (startInput) startInput.value = startDate.toISOString().split('T')[0];
        if (endInput) endInput.value = endDate.toISOString().split('T')[0];
    }
    
    showLoading(show) {
        // Could implement a loading overlay
        const fetchBtn = document.getElementById('fetchDataBtn');
        const backtestBtn = document.getElementById('runBacktestBtn');
        
        if (fetchBtn) {
            fetchBtn.disabled = show;
            fetchBtn.textContent = show ? 'Laden...' : 'Data Ophalen';
        }
        
        if (backtestBtn) {
            backtestBtn.disabled = show;
            backtestBtn.textContent = show ? 'Bezig...' : 'Start Backtest';
        }
    }
    
    showSuccess(message) {
        // Could be replaced with toast notification
        alert(message);
    }
    
    showError(message) {
        // Could be replaced with toast notification
        alert(message);
    }
    
    // Data persistence
    saveHistoricalData() {
        try {
            localStorage.setItem('roi_calculator_historical_data', JSON.stringify(this.historicalData));
        } catch (error) {
            console.error('Error saving historical data:', error);
        }
    }
    
    loadSavedData() {
        try {
            const saved = localStorage.getItem('roi_calculator_historical_data');
            if (saved) {
                this.historicalData = JSON.parse(saved).map(item => ({
                    ...item,
                    date: new Date(item.date)
                }));
            }
        } catch (error) {
            console.error('Error loading historical data:', error);
        }
    }
}