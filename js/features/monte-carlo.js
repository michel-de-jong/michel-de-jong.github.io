// Monte Carlo Feature Module - Updated with Professional Loading
import { formatNumber, formatPercentage } from '../utils/format-utils.js';
import { randomNormal } from '../utils/calculation-utils.js';
import { Calculator } from '../core/calculator.js';

export class MonteCarloFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.simulationResults = null;
        this.isRunning = false;
        this.startTime = null;
        this.progressTimer = null;
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Run button
        const runBtn = document.getElementById('runMonteCarloBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.run());
        }
        
        // Parameter inputs
        const paramInputs = ['mcSimulations', 'mcVolatility', 'mcRenteVolatility', 'mcKostenVolatility'];
        paramInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    element.setAttribute('data-user-modified', 'true');
                    this.updateVolatilityIndicator(id, element.value);
                });
                
                element.addEventListener('input', () => {
                    this.updateParameterScale(id, element.value);
                });
            }
        });
    }
    
    activate(stateManager) {
        // Initialize charts if needed
        if (!this.chartManager.charts.monteCarlo) {
            const canvas = document.getElementById('monteCarloChart');
            if (canvas) {
                this.chartManager.initMonteCarloCharts();
            }
        }
        
        // Set default values if not modified by user
        this.setDefaultParameters();
    }
    
    setDefaultParameters() {
        const inputs = this.stateManager.getInputs();
        
        // Set volatility based on current rendement if not user-modified
        const mcVolatility = document.getElementById('mcVolatility');
        if (mcVolatility && !mcVolatility.hasAttribute('data-user-modified')) {
            const defaultVolatility = Math.max(1, Math.abs(inputs.rendement) * 0.3);
            mcVolatility.value = defaultVolatility.toFixed(1);
            this.updateVolatilityIndicator('mcVolatility', defaultVolatility);
        }
        
        // Set default simulations
        const mcSimulations = document.getElementById('mcSimulations');
        if (mcSimulations && !mcSimulations.hasAttribute('data-user-modified')) {
            mcSimulations.value = 1000;
            this.updateParameterScale('mcSimulations', 1000);
        }
    }

    async run() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Show loading with total simulations
        let numSimulations = parseInt(document.getElementById('mcSimulations')?.value) || 1000;
        numSimulations = Math.max(10, Math.min(5000, numSimulations));
        
        this.showLoading(true, numSimulations);
        
        try {
            // Get parameters
            const volatility = parseFloat(document.getElementById('mcVolatility')?.value) / 100 || 0.03;
            const renteVolatility = parseFloat(document.getElementById('mcRenteVolatility')?.value) / 100 || 0.01;
            const kostenVolatility = parseFloat(document.getElementById('mcKostenVolatility')?.value) / 100 || 0.1;
            
            // Initialize results
            this.simulationResults = { results: [] };
            
            // Run simulations in batches with progress updates
            const batchSize = 50;
            const totalBatches = Math.ceil(numSimulations / batchSize);
            
            for (let i = 0; i < totalBatches; i++) {
                const batchStart = i * batchSize;
                const batchEnd = Math.min((i + 1) * batchSize, numSimulations);
                const batchCount = batchEnd - batchStart;
                
                // Run batch
                const batchResults = await this.runBatch(
                    batchCount, 
                    volatility, 
                    renteVolatility, 
                    kostenVolatility
                );
                
                this.simulationResults.results.push(...batchResults);
                
                // Update progress
                const progress = (batchEnd / numSimulations) * 100;
                this.updateProgress(progress, batchEnd, numSimulations);
                
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Process results
            const stats = this.processResults(this.simulationResults.results);
            
            if (stats) {
                // Display results
                this.displayResults(stats);
                
                // Update charts
                if (this.chartManager && typeof this.chartManager.updateMonteCarloCharts === 'function') {
                    this.chartManager.updateMonteCarloCharts(stats);
                }
            }
        } catch (error) {
            console.error('Monte Carlo simulation error:', error);
        } finally {
            // Hide loading and reset state
            this.showLoading(false);
            this.isRunning = false;
            this.startTime = null;
        }
    }
    
    async runBatch(numSimulations, volatility, renteVolatility, kostenVolatility) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const results = [];
                const baseInputs = this.stateManager.getInputs();
                
                for (let i = 0; i < numSimulations; i++) {
                    const result = this.calculator.runMonteCarloSingle(
                        volatility,
                        renteVolatility,
                        kostenVolatility
                    );
                    results.push({
                        ...result,
                        simulation: this.simulationResults.results.length + i + 1
                    });
                }
                
                resolve(results);
            });
        });
    }
    
    processResults(results) {
        // Sort results by ROI
        results.sort((a, b) => a.roi - b.roi);
        
        const roiValues = results.map(r => r.roi);
        const finalValues = results.map(r => r.finalValue);
        const inputs = this.stateManager.getInputs();
        
        // Create histogram data
        const histogramBins = 20;
        const minROI = Math.min(...roiValues);
        const maxROI = Math.max(...roiValues);
        const binWidth = (maxROI - minROI) / histogramBins;
        
        const histogram = new Array(histogramBins).fill(0);
        const histogramLabels = [];
        
        for (let i = 0; i < histogramBins; i++) {
            const binStart = minROI + i * binWidth;
            const binEnd = binStart + binWidth;
            histogramLabels.push(`${binStart.toFixed(1)}% - ${binEnd.toFixed(1)}%`);
            
            roiValues.forEach(roi => {
                if (roi >= binStart && roi < binEnd) {
                    histogram[i]++;
                }
            });
        }
        
        // Handle edge case for maximum value
        if (roiValues[roiValues.length - 1] === maxROI) {
            histogram[histogramBins - 1]++;
        }
        
        // Generate percentile paths for visualization
        const pathLabels = Array.from({length: inputs.jaren + 1}, (_, i) => `Jaar ${i}`);
        const p5Values = [];
        const p50Values = [];
        const p95Values = [];
        
        for (let year = 0; year <= inputs.jaren; year++) {
            const yearProgress = year / inputs.jaren;
            p5Values.push(this.calculatePercentile(roiValues, 5) * yearProgress);
            p50Values.push(this.calculatePercentile(roiValues, 50) * yearProgress);
            p95Values.push(this.calculatePercentile(roiValues, 95) * yearProgress);
        }
        
        return {
            mean: this.calculateMean(roiValues),
            median: this.calculateMedian(roiValues),
            p5: this.calculatePercentile(roiValues, 5),
            p95: this.calculatePercentile(roiValues, 95),
            lossProb: (results.filter(r => r.roi < 0).length / results.length) * 100,
            vaR5: this.calculatePercentile(
                finalValues.map(v => v - inputs.startKapitaal), 
                5
            ),
            results: results,
            finalValues: finalValues,
            roiValues: roiValues,
            histogram: histogram,
            histogramLabels: histogramLabels,
            paths: {
                labels: pathLabels,
                p5: p5Values,
                p50: p50Values,
                p95: p95Values
            }
        };
    }
    
    displayResults(stats) {
        // Display numeric results
        const elements = {
            'mcMedianROI': { value: stats.median, isROI: true },
            'mcP5ROI': { value: stats.p5, isROI: true },
            'mcP95ROI': { value: stats.p95, isROI: true },
            'mcLossProb': { value: stats.lossProb, isROI: false },
            'mcVaR5': { value: stats.vaR5, isROI: false, isCurrency: true }
        };
        
        for (const [id, config] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                // Format the value appropriately
                const displayValue = config.isCurrency ? 
                    `€${formatNumber(config.value)}` : 
                    formatPercentage(config.value);
                
                element.textContent = displayValue;
                
                // Add color coding for ROI values
                if (config.isROI) {
                    element.className = 'result-value ' + this.getROIClass(config.value);
                }
            }
        }
    }
    
    getROIClass(roi) {
        if (roi >= 15) return 'excellent';
        if (roi >= 10) return 'good';
        if (roi >= 5) return 'moderate';
        return 'poor';
    }
    
    updateVolatilityIndicator(inputId, value) {
        const numValue = parseFloat(value) || 0;
        
        // Define thresholds based on input type
        const thresholds = {
            mcVolatility: { low: 2, medium: 5 },
            mcRenteVolatility: { low: 1, medium: 2 },
            mcKostenVolatility: { low: 5, medium: 15 }
        };
        
        const inputThresholds = thresholds[inputId] || { low: 5, medium: 10 };
        const level = numValue <= inputThresholds.low ? 'low' :
                     numValue <= inputThresholds.medium ? 'medium' : 'high';
        
        // Update volatility bars
        const container = document.querySelector(`#${inputId}`).closest('.parameter-body');
        if (container) {
            const bars = container.querySelectorAll('.volatility-bar');
            bars.forEach((bar, index) => {
                const barLevel = ['low', 'medium', 'high'][index];
                bar.classList.toggle('active', 
                    barLevel === 'low' || 
                    (barLevel === 'medium' && level !== 'low') ||
                    (barLevel === 'high' && level === 'high')
                );
            });
        }
    }
    
    updateParameterScale(inputId, value) {
        const element = document.getElementById(inputId);
        if (!element) return;
        
        const min = parseFloat(element.min) || 0;
        const max = parseFloat(element.max) || 100;
        const numValue = parseFloat(value) || 0;
        
        const percentage = ((numValue - min) / (max - min)) * 100;
        
        // Update scale fill
        const container = element.closest('.parameter-body');
        if (container) {
            const scaleFill = container.querySelector('.scale-fill');
            if (scaleFill) {
                scaleFill.style.width = `${percentage}%`;
            }
        }
    }
    
    updateProgress(percentage, current, total) {
        // Update percentage text
        const percentElement = document.getElementById('mcProgressPercentage');
        if (percentElement) {
            percentElement.textContent = `${Math.round(percentage)}%`;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('mcProgressBar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Update simulation count
        const countElement = document.getElementById('mcSimulationCount');
        if (countElement) {
            countElement.textContent = current;
        }
        
        // Update elapsed time
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const timeElement = document.getElementById('mcElapsedTime');
            if (timeElement) {
                timeElement.textContent = `${elapsed}s`;
            }
        }
    }
    
    showLoading(show, totalSimulations = 1000) {
        const loading = document.getElementById('mcLoading');
        const results = document.getElementById('mcResults');
        const chartContainer = document.getElementById('mcChartContainer');
        const distContainer = document.getElementById('mcDistContainer');
        
        if (show) {
            // Show loading using CSS class
            if (loading) loading.classList.add('active');
            if (results) results.style.display = 'none';
            if (chartContainer) chartContainer.style.display = 'none';
            if (distContainer) distContainer.style.display = 'none';
            
            // Set total simulations
            const totalElement = document.getElementById('mcTotalSimulations');
            if (totalElement) totalElement.textContent = totalSimulations;
            
            // Reset progress
            this.updateProgress(0, 0, totalSimulations);
            
            // Start progress timer
            this.startProgressTimer();
        } else {
            // Hide loading using CSS class
            if (loading) loading.classList.remove('active');
            if (results) results.style.display = 'block';
            if (chartContainer) chartContainer.style.display = 'block';
            if (distContainer) distContainer.style.display = 'block';
            
            // Stop progress timer
            this.stopProgressTimer();
        }
    }
    
    startProgressTimer() {
        // Update elapsed time every 100ms
        this.progressTimer = setInterval(() => {
            if (this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const timeElement = document.getElementById('mcElapsedTime');
                if (timeElement) {
                    timeElement.textContent = `${elapsed}s`;
                }
            }
        }, 100);
    }
    
    stopProgressTimer() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    }
    
    // Statistical calculation methods
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    calculateMedian(values) {
        const mid = Math.floor(values.length / 2);
        return values.length % 2 === 0 ? 
            (values[mid - 1] + values[mid]) / 2 : 
            values[mid];
    }
    
    calculatePercentile(values, percentile) {
        const index = (percentile / 100) * (values.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        return lower === upper ? 
            values[lower] : 
            values[lower] * (1 - weight) + values[upper] * weight;
    }
    
    // Export results for reporting
    exportResults() {
        if (!this.simulationResults || !this.simulationResults.results.length) {
            return null;
        }
        
        const stats = this.processResults(this.simulationResults.results);
        
        return {
            parameters: {
                simulations: this.simulationResults.results.length,
                volatility: document.getElementById('mcVolatility')?.value || 0,
                renteVolatility: document.getElementById('mcRenteVolatility')?.value || 0,
                kostenVolatility: document.getElementById('mcKostenVolatility')?.value || 0
            },
            results: {
                median: stats.median,
                mean: stats.mean,
                p5: stats.p5,
                p95: stats.p95,
                lossProb: stats.lossProb,
                vaR5: stats.vaR5
            },
            raw: this.simulationResults.results
        };
    }
}

if (typeof Calculator !== 'undefined') {
    Calculator.prototype.runMonteCarloSingle = function(volatility, renteVolatility, kostenVolatility) {
        const baseInputs = this.stateManager.getInputs();
        
        // Generate random variations
        const rendementVariation = randomNormal() * volatility;
        const renteVariation = randomNormal() * renteVolatility;
        const kostenVariation = randomNormal() * kostenVolatility;
        
        const scenarioInputs = {
            ...baseInputs,
            rendement: baseInputs.rendement + (rendementVariation * 100),
            renteLening: Math.max(0, baseInputs.renteLening + (renteVariation * 100)),
            vasteKosten: Math.max(0, baseInputs.vasteKosten * (1 + kostenVariation))
        };
        
        // Quick calculation without full state update
        const results = this.calculate(scenarioInputs);
        
        return {
            roi: results.finalROI,
            finalValue: results.finalVermogen
        };
    };
}