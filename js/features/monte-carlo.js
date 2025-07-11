// Monte Carlo Feature Module
import { formatNumber, formatPercentage } from '../utils/format-utils.js';

export class MonteCarloFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.simulationResults = null;
        this.isRunning = false;
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
            mcSimulations.value = 10000;
            this.updateParameterScale('mcSimulations', 10000);
        }
    }
    
    async run() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        const loading = document.getElementById('mcLoading');
        const results = document.getElementById('mcResults');
        const chartContainer = document.getElementById('mcChartContainer');
        const distContainer = document.getElementById('mcDistContainer');
        
        // Show loading
        this.showLoading(true);
        
        // Get parameters
        const numSimulations = parseInt(document.getElementById('mcSimulations')?.value) || 10000;
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value) / 100 || 0.03;
        const renteVolatility = parseFloat(document.getElementById('mcRenteVolatility')?.value) / 100 || 0.01;
        const kostenVolatility = parseFloat(document.getElementById('mcKostenVolatility')?.value) / 100 || 0.1;
        
        // Update progress
        this.updateProgress(0);
        
        // Run simulation with progress updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate in batches for progress updates
        const batchSize = 1000;
        const batches = Math.ceil(numSimulations / batchSize);
        let allResults = [];
        
        for (let i = 0; i < batches; i++) {
            const batchStart = i * batchSize;
            const batchEnd = Math.min((i + 1) * batchSize, numSimulations);
            const batchSimulations = batchEnd - batchStart;
            
            // Run batch
            const batchResults = await this.runBatch(
                batchSimulations,
                volatility,
                renteVolatility,
                kostenVolatility
            );
            
            allResults = allResults.concat(batchResults);
            
            // Update progress
            const progress = ((i + 1) / batches) * 100;
            this.updateProgress(progress);
            
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Process all results
        const stats = this.processResults(allResults);
        this.simulationResults = stats;
        
        // Update UI
        this.displayResults(stats);
        this.chartManager.updateMonteCarloCharts(stats);
        
        // Show results
        this.showLoading(false);
        
        this.isRunning = false;
    }
    
    async runBatch(numSimulations, volatility, renteVolatility, kostenVolatility) {
        return new Promise(resolve => {
            // Run calculations in next tick to prevent blocking
            setTimeout(() => {
                const results = [];
                for (let i = 0; i < numSimulations; i++) {
                    const result = this.calculator.runMonteCarloSingle(
                        volatility,
                        renteVolatility,
                        kostenVolatility
                    );
                    results.push(result);
                }
                resolve(results);
            }, 0);
        });
    }
    
    processResults(results) {
        // Sort results
        results.sort((a, b) => a.roi - b.roi);
        
        const roiValues = results.map(r => r.roi);
        const finalValues = results.map(r => r.finalValue);
        const inputs = this.stateManager.getInputs();
        
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
            results: results
        };
    }
    
    displayResults(stats) {
        // Update result values
        const elements = {
            mcMedianROI: `${stats.median.toFixed(1)}%`,
            mcConfidence: `${stats.p5.toFixed(1)}% - ${stats.p95.toFixed(1)}%`,
            mcLossProb: `${stats.lossProb.toFixed(1)}%`,
            mcVaR: formatNumber(stats.vaR5)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                
                // Add color coding
                if (id === 'mcMedianROI') {
                    element.className = 'result-value ' + this.getROIClass(stats.median);
                } else if (id === 'mcLossProb') {
                    element.className = 'result-value ' + this.getLossProbClass(stats.lossProb);
                }
            }
        });
        
        // Generate insights
        this.displayInsights(stats);
    }
    
    displayInsights(stats) {
        const insights = [];
        
        // Loss probability insight
        if (stats.lossProb < 5) {
            insights.push({
                type: 'success',
                text: `Zeer lage kans op verlies (${stats.lossProb.toFixed(1)}%). Uw investering lijkt robuust.`
            });
        } else if (stats.lossProb > 20) {
            insights.push({
                type: 'warning',
                text: `Significante kans op verlies (${stats.lossProb.toFixed(1)}%). Overweeg risicomitigatie.`
            });
        }
        
        // Confidence interval insight
        const range = stats.p95 - stats.p5;
        if (range > 50) {
            insights.push({
                type: 'info',
                text: `Hoge spreiding in uitkomsten (${range.toFixed(1)}%). Resultaten zijn onzeker.`
            });
        }
        
        // Value at Risk insight
        if (stats.vaR5 < -stats.mean * 0.5) {
            insights.push({
                type: 'danger',
                text: `Value at Risk is significant. In 5% van de gevallen verliest u meer dan ${formatNumber(Math.abs(stats.vaR5))}.`
            });
        }
        
        // Display insights (if there's a container for them)
        const insightsContainer = document.getElementById('mcInsights');
        if (insightsContainer && insights.length > 0) {
            insightsContainer.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    ${insight.text}
                </div>
            `).join('');
        }
    }
    
    updateVolatilityIndicator(inputId, value) {
        const indicators = {
            mcVolatility: { low: 2, medium: 5, high: 10 },
            mcRenteVolatility: { low: 1, medium: 2, high: 3 },
            mcKostenVolatility: { low: 10, medium: 20, high: 30 }
        };
        
        const thresholds = indicators[inputId];
        if (!thresholds) return;
        
        const numValue = parseFloat(value);
        const level = numValue <= thresholds.low ? 'low' :
                     numValue <= thresholds.medium ? 'medium' : 'high';
        
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
    
    updateProgress(percentage) {
        const progressElement = document.querySelector('.progress');
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressElement) {
            progressElement.textContent = `${Math.round(percentage)}%`;
        }
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    showLoading(show) {
        const loading = document.getElementById('mcLoading');
        const results = document.getElementById('mcResults');
        const chartContainer = document.getElementById('mcChartContainer');
        const distContainer = document.getElementById('mcDistContainer');
        
        if (loading) loading.classList.toggle('active', show);
        if (results) results.style.display = show ? 'none' : 'grid';
        if (chartContainer) chartContainer.style.display = show ? 'none' : 'block';
        if (distContainer) distContainer.style.display = show ? 'none' : 'block';
    }
    
    getROIClass(roi) {
        if (roi > 20) return 'excellent';
        if (roi > 10) return 'good';
        if (roi > 0) return 'moderate';
        return 'poor';
    }
    
    getLossProbClass(prob) {
        if (prob < 5) return 'excellent';
        if (prob < 10) return 'good';
        if (prob < 20) return 'moderate';
        return 'poor';
    }
    
    // Statistics helpers
    calculateMean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    
    calculateMedian(arr) {
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 !== 0
            ? arr[mid]
            : (arr[mid - 1] + arr[mid]) / 2;
    }
    
    calculatePercentile(arr, p) {
        const index = (p / 100) * (arr.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        return arr[lower] * (1 - weight) + arr[upper] * weight;
    }
    
    // Export results
    exportResults() {
        if (!this.simulationResults) return null;
        
        return {
            statistics: {
                mean: this.simulationResults.mean,
                median: this.simulationResults.median,
                p5: this.simulationResults.p5,
                p95: this.simulationResults.p95,
                lossProb: this.simulationResults.lossProb,
                vaR5: this.simulationResults.vaR5
            },
            parameters: {
                simulations: document.getElementById('mcSimulations')?.value,
                volatility: document.getElementById('mcVolatility')?.value,
                renteVolatility: document.getElementById('mcRenteVolatility')?.value,
                kostenVolatility: document.getElementById('mcKostenVolatility')?.value
            }
        };
    }
}

// Add single simulation method to Calculator
// This should be added to the Calculator class in calculator.js
Calculator.prototype.runMonteCarloSingle = function(volatility, renteVolatility, kostenVolatility) {
    const baseInputs = this.stateManager.getInputs();
    const { randomNormal } = await import('../utils/calculation-utils.js');
    
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