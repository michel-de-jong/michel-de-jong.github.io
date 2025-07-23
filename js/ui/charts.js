// Chart Manager Module - Handles all chart operations
import { Config } from '../config/config.js';
import { formatNumber, formatPercentage } from '../utils/format-utils.js';

export class ChartManager {
    constructor() {
        // Available libraries check
        if (!window.Chart) {
            console.error('Chart.js library not loaded');
            throw new Error('Required library Chart.js is not available');
        }
        
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
            animation: {
                duration: Config.ui.animations ? Config.ui.animationDuration : 0
            },
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            }
        };
    }
    
    initialize() {
        this.initMainChart();
        
        // Pre-initialize other charts if their canvases exist
        const scenarioCanvas = document.getElementById('scenarioChart');
        if (scenarioCanvas) this.initScenarioChart();
        
        const portfolioCanvas = document.getElementById('portfolioChart');
        if (portfolioCanvas) this.initPortfolioChart();
        
        const monteCarloCanvas = document.getElementById('monteCarloChart');
        const distributionCanvas = document.getElementById('distributionChart');
        if (monteCarloCanvas || distributionCanvas) this.initMonteCarloCharts();
        
        const waterfallCanvas = document.getElementById('waterfallChart');
        if (waterfallCanvas) this.initWaterfallChart();
    }

    // Initialize main chart
    initMainChart() {
        const canvas = document.getElementById('mainChart');
        if (!canvas) {
            console.warn('Main chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (this.charts.main) {
            console.log('Destroying existing main chart');
            this.charts.main.destroy();
            this.charts.main = null;
        }
        
        // Also check if there's a chart instance attached to the canvas
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            console.log('Found existing chart instance on canvas, destroying it');
            existingChart.destroy();
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
        
        // Destroy existing chart if it exists
        if (this.charts.scenario) {
            this.charts.scenario.destroy();
            this.charts.scenario = null;
        }
        
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
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
    
    // Initialize portfolio chart
    initPortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.charts.portfolio) {
            this.charts.portfolio.destroy();
            this.charts.portfolio = null;
        }
        
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.portfolio = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: Config.charts.colors.currencyPalette,
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
                        text: 'Asset Allocatie'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return label + ': ' + formatNumber(value) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Initialize Monte Carlo charts
    initMonteCarloCharts() {
        // Destroy existing charts if they exist
        if (this.charts.monteCarlo) {
            this.charts.monteCarlo.destroy();
            this.charts.monteCarlo = null;
        }
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
            this.charts.distribution = null;
        }
        
        // Initialize paths chart
        const pathsCanvas = document.getElementById('monteCarloChart');
        if (pathsCanvas) {
            const existingChart = Chart.getChart(pathsCanvas);
            if (existingChart) {
                existingChart.destroy();
            }
            
            const ctx = pathsCanvas.getContext('2d');
            this.charts.monteCarlo = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    ...this.defaultOptions,
                    animation: false,
                    plugins: {
                        ...this.defaultOptions.plugins,
                        title: {
                            display: true,
                            text: 'Monte Carlo Simulatie Paden'
                        },
                        legend: {
                            display: false
                        }
                    },
                    elements: {
                        line: {
                            tension: 0
                        },
                        point: {
                            radius: 0
                        }
                    }
                }
            });
        }
        
        // Initialize distribution chart
        const distCanvas = document.getElementById('distributionChart');
        if (distCanvas) {
            const existingChart = Chart.getChart(distCanvas);
            if (existingChart) {
                existingChart.destroy();
            }
            
            const ctx = distCanvas.getContext('2d');
            this.charts.distribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Frequentie',
                        data: [],
                        backgroundColor: this.createAlpha(Config.charts.colors.primary, 0.8),
                        borderColor: Config.charts.colors.primary,
                        borderWidth: 1
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    plugins: {
                        ...this.defaultOptions.plugins,
                        title: {
                            display: true,
                            text: 'Verdeling Eindwaarden'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Frequentie'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Eindwaarde (€)'
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Initialize waterfall chart
    initWaterfallChart() {
        const canvas = document.getElementById('waterfallChart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.charts.waterfall) {
            this.charts.waterfall.destroy();
            this.charts.waterfall = null;
        }
        
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.waterfall = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Cashflow Waterfall'
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
    }
    
    // Update scenario chart
    updateScenarioChart(scenarios) {
        if (!this.charts.scenario) {
            if (!this.initScenarioChart()) {
                return;
            }
        }
        
        const data = [
            scenarios.best.totaalROI,
            scenarios.base.totaalROI,
            scenarios.worst.totaalROI
        ];
        
        this.charts.scenario.data.datasets[0].data = data;
        this.charts.scenario.update('none');
    }
    
    // Update portfolio chart
    updatePortfolioChart(assets) {
        if (!this.charts.portfolio) {
            this.initPortfolioChart();
            if (!this.charts.portfolio) return;
        }
        
        const labels = assets.map(a => a.name);
        const data = assets.map(a => a.amount);
        
        this.charts.portfolio.data.labels = labels;
        this.charts.portfolio.data.datasets[0].data = data;
        this.charts.portfolio.update('none');
    }
    
    // Update Monte Carlo charts
    updateMonteCarloCharts(stats) {
        if (!stats) return;
        
        // Update paths chart
        if (this.charts.monteCarlo && stats.paths) {
            const datasets = [
                {
                    label: 'P95',
                    data: stats.paths.p95,
                    borderColor: Config.charts.colors.success,
                    borderWidth: 3,
                    fill: false
                },
                {
                    label: 'P50 (Mediaan)',
                    data: stats.paths.p50,
                    borderColor: Config.charts.colors.warning,
                    borderWidth: 3,
                    fill: false
                },
                {
                    label: 'P5',
                    data: stats.paths.p5,
                    borderColor: Config.charts.colors.danger,
                    borderWidth: 3,
                    fill: false
                }
            ];

            this.charts.monteCarlo.data.labels = stats.paths.labels;
            this.charts.monteCarlo.data.datasets = datasets;
            this.charts.monteCarlo.update('none');
        }

        // Update distribution chart
        if (this.charts.distribution && stats.histogram) {
            this.charts.distribution.data.labels = stats.histogramLabels;
            this.charts.distribution.data.datasets[0].data = stats.histogram;
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
    
    // Resize all active charts
    resize() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }
}