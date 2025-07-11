// Chart Manager Module
import { Config } from '../config/config.js';
import { formatNumber } from '../utils/format-utils.js';

export class ChartManager {
    constructor() {
        this.charts = {
            main: null,
            scenario: null,
            portfolio: null,
            monteCarlo: null,
            distribution: null,
            waterfall: null
        };
        
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 4) { // ROI
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += formatNumber(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };
    }
    
    // Initialize main chart
    initMainChart() {
        const canvas = document.getElementById('mainChart');
        if (!canvas) {
            console.warn('Main chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: this.createMainDatasets()
            },
            options: this.createMainOptions()
        });
    }
    
    createMainDatasets() {
        return [
            {
                label: 'Portfolio Waarde',
                data: [],
                borderColor: Config.charts.colors.primary,
                backgroundColor: this.createAlpha(Config.charts.colors.primary, 0.1),
                tension: 0.4,
                borderWidth: 2
            },
            {
                label: 'Cash Reserve',
                data: [],
                borderColor: Config.charts.colors.secondary,
                backgroundColor: this.createAlpha(Config.charts.colors.secondary, 0.1),
                tension: 0.4,
                borderWidth: 2
            },
            {
                label: 'Lening',
                data: [],
                borderColor: Config.charts.colors.danger,
                backgroundColor: this.createAlpha(Config.charts.colors.danger, 0.1),
                tension: 0.4,
                borderWidth: 2
            },
            {
                label: 'Totaal Vermogen',
                data: [],
                borderColor: Config.charts.colors.purple,
                backgroundColor: this.createAlpha(Config.charts.colors.purple, 0.1),
                tension: 0.4,
                borderWidth: 3
            },
            {
                label: 'ROI %',
                data: [],
                borderColor: Config.charts.colors.orange,
                backgroundColor: this.createAlpha(Config.charts.colors.orange, 0.1),
                tension: 0.4,
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ];
    }
    
    createMainOptions() {
        return {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                title: {
                    display: true,
                    text: 'Vermogensontwikkeling over tijd',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Jaren'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };
    }
    
    // Update main chart
    updateMainChart(data, useRealValues = false) {
        if (!this.charts.main) {
            console.warn('Main chart not initialized');
            return;
        }
        
        this.charts.main.data.labels = data.labels;
        this.charts.main.data.datasets[0].data = data.portfolio;
        this.charts.main.data.datasets[1].data = data.cashReserve;
        this.charts.main.data.datasets[2].data = data.lening;
        this.charts.main.data.datasets[3].data = data.totaalVermogen;
        this.charts.main.data.datasets[4].data = data.roi;
        
        const titleText = useRealValues 
            ? 'Vermogensontwikkeling over tijd (Reële waardes)'
            : 'Vermogensontwikkeling over tijd (Nominale waardes)';
        
        this.charts.main.options.plugins.title.text = titleText;
        this.charts.main.update('none');
    }
    
    // Initialize scenario chart
    initScenarioChart() {
        const canvas = document.getElementById('scenarioChart');
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.scenario = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Best Case', 'Base Case', 'Worst Case'],
                datasets: [{
                    label: 'ROI %',
                    data: [0, 0, 0],
                    backgroundColor: [
                        this.createAlpha(Config.charts.colors.secondary, 0.8),
                        this.createAlpha(Config.charts.colors.warning, 0.8),
                        this.createAlpha(Config.charts.colors.danger, 0.8)
                    ],
                    borderColor: [
                        Config.charts.colors.secondary,
                        Config.charts.colors.warning,
                        Config.charts.colors.danger
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Scenario Vergelijking'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        return true;
    }
    
    // Initialize Monte Carlo charts
    initMonteCarloCharts() {
        // Scatter plot
        const canvas1 = document.getElementById('monteCarloChart');
        if (!canvas1) return false;
        
        const ctx1 = canvas1.getContext('2d');
        this.charts.monteCarlo = new Chart(ctx1, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Simulatie Resultaten',
                    data: [],
                    backgroundColor: this.createAlpha(Config.charts.colors.primary, 0.5),
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: this.createMonteCarloOptions()
        });
        
        // Distribution histogram
        const canvas2 = document.getElementById('distributionChart');
        if (!canvas2) return false;
        
        const ctx2 = canvas2.getContext('2d');
        this.charts.distribution = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Frequentie',
                    data: [],
                    backgroundColor: this.createAlpha(Config.charts.colors.primary, 0.7),
                    borderColor: Config.charts.colors.primary,
                    borderWidth: 1
                }]
            },
            options: this.createDistributionOptions()
        });
        
        return true;
    }
    
    createMonteCarloOptions() {
        return {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                title: {
                    display: true,
                    text: 'Monte Carlo Simulatie - ROI Spreiding'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Simulatie #'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'ROI %'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };
    }
    
    createDistributionOptions() {
        return {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                title: {
                    display: true,
                    text: 'ROI Verdeling (Histogram)'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'ROI %'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Aantal Simulaties'
                    }
                }
            }
        };
    }
    
    // Initialize waterfall chart
    initWaterfallChart() {
        const canvas = document.getElementById('waterfallChart');
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.waterfall = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cashflow',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Cashflow Waterfall'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
        
        return true;
    }
    
    // Initialize portfolio chart
    initPortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.portfolio = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        Config.charts.colors.primary,
                        Config.charts.colors.secondary,
                        Config.charts.colors.danger,
                        Config.charts.colors.warning,
                        Config.charts.colors.purple,
                        Config.charts.colors.info
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Portfolio Verdeling'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        return true;
    }
    
    // Update waterfall chart
    updateWaterfallChart(waterfallData) {
        if (!this.charts.waterfall || !waterfallData.data) return;
        
        const data = waterfallData.data;
        let cumulative = 0;
        const chartData = [];
        const colors = [];
        const borderColors = [];
        
        data.forEach((item) => {
            if (item.type === 'start') {
                cumulative = item.value;
                chartData.push([0, item.value]);
                colors.push(this.createAlpha('#6c757d', 0.5));
                borderColors.push('#6c757d');
            } else if (item.type === 'total') {
                item.value = cumulative;
                chartData.push([0, cumulative]);
                colors.push(this.createAlpha(Config.charts.colors.purple, 0.7));
                borderColors.push(Config.charts.colors.purple);
            } else {
                chartData.push([cumulative, cumulative + item.value]);
                cumulative += item.value;
                if (item.type === 'positive') {
                    colors.push(this.createAlpha(Config.charts.colors.secondary, 0.5));
                    borderColors.push(Config.charts.colors.secondary);
                } else {
                    colors.push(this.createAlpha(Config.charts.colors.danger, 0.5));
                    borderColors.push(Config.charts.colors.danger);
                }
            }
        });
        
        this.charts.waterfall.data.labels = data.map(d => d.label);
        this.charts.waterfall.data.datasets[0].data = chartData;
        this.charts.waterfall.data.datasets[0].backgroundColor = colors;
        this.charts.waterfall.data.datasets[0].borderColor = borderColors;
        this.charts.waterfall.update('none');
    }
    
    // Update Monte Carlo charts
    updateMonteCarloCharts(stats) {
        // Update scatter plot
        if (this.charts.monteCarlo) {
            this.charts.monteCarlo.data.datasets[0].data = stats.results.map(r => ({
                x: r.simulation,
                y: r.roi
            }));
            this.charts.monteCarlo.update('none');
        }
        
        // Create histogram data
        if (this.charts.distribution) {
            const histogramData = this.createHistogram(
                stats.results.map(r => r.roi), 
                Config.monteCarlo.histogramBins
            );
            this.charts.distribution.data.labels = histogramData.labels;
            this.charts.distribution.data.datasets[0].data = histogramData.data;
            this.charts.distribution.update('none');
        }
    }
    
    // Helper: Create histogram data
    createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
        
        const histogram = new Array(bins).fill(0);
        const labels = [];
        
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            labels.push(binStart.toFixed(1));
            
            histogram[i] = data.filter(value => 
                value >= binStart && value < binEnd
            ).length;
        }
        
        return { labels, data: histogram };
    }
    
    // Helper: Create alpha color
    createAlpha(color, alpha) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Export chart as image
    exportChart(chartName) {
        const chart = this.charts[chartName];
        if (!chart) {
            console.warn(`Chart ${chartName} not found for export`);
            return;
        }
        
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `${chartName}_chart_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        link.click();
    }
    
    // Destroy all charts
    destroyAll() {
        Object.entries(this.charts).forEach(([name, chart]) => {
            if (chart) {
                console.log(`Destroying chart: ${name}`);
                chart.destroy();
            }
        });
        
        this.charts = {
            main: null,
            scenario: null,
            portfolio: null,
            monteCarlo: null,
            distribution: null,
            waterfall: null
        };
    }
}