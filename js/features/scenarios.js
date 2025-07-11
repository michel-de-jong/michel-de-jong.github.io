// Scenarios Feature Module
export class ScenariosFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
        this.scenarioInputs = new Map();
        this.stressTestResults = null;
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.initializeScenarioInputs();
            this.attachEventListeners();
        }, 100);
    }
    
    initializeScenarioInputs() {
        const scenarios = ['best', 'base', 'worst'];
        const fields = ['Rendement', 'Kosten'];
        
        scenarios.forEach(scenario => {
            fields.forEach(field => {
                const id = `${scenario}Case${field}`;
                const element = document.getElementById(id);
                if (element) {
                    this.scenarioInputs.set(id, element);
                }
            });
        });
    }
    
    attachEventListeners() {
        // Scenario input listeners
        this.scenarioInputs.forEach((element, id) => {
            element.addEventListener('change', () => this.calculateScenarios());
            element.addEventListener('input', this.debounce(() => this.calculateScenarios(), 300));
        });
        
        // Stress test button
        const stressTestBtn = document.getElementById('runStressTestBtn');
        if (stressTestBtn) {
            stressTestBtn.addEventListener('click', () => this.runStressTest());
        }
    }
    
    activate(stateManager) {
        // Initialize chart if needed
        if (!this.chartManager.charts.scenario) {
            const canvas = document.getElementById('scenarioChart');
            if (canvas) {
                this.chartManager.initScenarioChart();
            }
        }
        
        // Sync inputs from main calculator
        this.syncInputsFromCalculator();
        
        // Calculate scenarios
        this.calculateScenarios();
    }
    
    syncInputsFromCalculator() {
        const inputs = this.stateManager.getInputs();
        
        // Set base case to current values
        this.setScenarioValue('base', 'Rendement', inputs.rendement);
        this.setScenarioValue('base', 'Kosten', inputs.vasteKosten);
        
        // Set best case (20% better)
        this.setScenarioValue('best', 'Rendement', inputs.rendement * 1.2);
        this.setScenarioValue('best', 'Kosten', inputs.vasteKosten * 0.8);
        
        // Set worst case (40% worse)
        this.setScenarioValue('worst', 'Rendement', inputs.rendement * 0.6);
        this.setScenarioValue('worst', 'Kosten', inputs.vasteKosten * 1.2);
    }
    
    setScenarioValue(scenario, field, value) {
        const element = this.scenarioInputs.get(`${scenario}Case${field}`);
        if (element) {
            element.value = typeof value === 'number' ? value.toFixed(2) : value;
        }
    }
    
    getScenarioValue(scenario, field) {
        const element = this.scenarioInputs.get(`${scenario}Case${field}`);
        return element ? parseFloat(element.value) || 0 : 0;
    }
    
    calculateScenarios() {
        const scenarios = ['best', 'base', 'worst'];
        const results = [];
        
        scenarios.forEach(scenario => {
            const rendement = this.getScenarioValue(scenario, 'Rendement');
            const kosten = this.getScenarioValue(scenario, 'Kosten');
            
            const roi = this.calculator.calculateScenario({
                rendement: rendement,
                vasteKosten: kosten
            });
            
            results.push(roi);
            
            // Update UI
            this.updateScenarioROI(scenario, roi);
        });
        
        // Update chart
        this.updateScenarioChart(results);
    }
    
    updateScenarioROI(scenario, roi) {
        const element = document.getElementById(`${scenario}CaseROI`);
        if (element) {
            element.textContent = `ROI: ${roi.toFixed(1)}%`;
            element.className = 'kpi-value scenario-roi ' + this.getROIClass(roi);
        }
    }
    
    getROIClass(roi) {
        if (roi > 20) return 'excellent';
        if (roi > 10) return 'good';
        if (roi > 0) return 'moderate';
        return 'poor';
    }
    
    updateScenarioChart(results) {
        if (this.chartManager.charts.scenario && results.length === 3) {
            this.chartManager.charts.scenario.data.datasets[0].data = results;
            this.chartManager.charts.scenario.update();
        }
    }
    
    runStressTest() {
        const results = this.calculator.runStressTest();
        this.stressTestResults = results;
        
        const container = document.getElementById('stressTestResults');
        if (container) {
            container.innerHTML = this.renderStressTestResults(results);
        }
    }
    
    renderStressTestResults(results) {
        const summary = `
            <div class="stress-test-summary">
                <p>Impact analyse van negatieve scenario's op uw ROI:</p>
            </div>
        `;
        
        const resultItems = results.map(r => {
            const impactClass = this.getImpactClass(r.impact);
            const icon = this.getImpactIcon(r.impact);
            
            return `
                <div class="stress-test-result ${impactClass}">
                    <div class="stress-test-header">
                        <span class="stress-test-icon">${icon}</span>
                        <strong>${r.name}</strong>
                    </div>
                    <div class="stress-test-metrics">
                        <div class="metric">
                            <span class="label">ROI:</span>
                            <span class="value">${r.roi.toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="label">Impact:</span>
                            <span class="value ${r.impact < 0 ? 'negative' : 'positive'}">
                                ${r.impact > 0 ? '+' : ''}${r.impact.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div class="impact-bar">
                        <div class="impact-fill ${r.impact < 0 ? 'negative' : 'positive'}" 
                             style="width: ${Math.min(Math.abs(r.impact) * 2, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        return summary + resultItems;
    }
    
    getImpactClass(impact) {
        if (impact < -10) return 'severe';
        if (impact < -5) return 'moderate';
        if (impact < 0) return 'mild';
        return 'positive';
    }
    
    getImpactIcon(impact) {
        if (impact < -10) return '⚠️';
        if (impact < 0) return '📉';
        return '📈';
    }
    
    // Export scenario data
    exportScenarioData() {
        const scenarios = ['best', 'base', 'worst'];
        const data = {};
        
        scenarios.forEach(scenario => {
            data[scenario] = {
                rendement: this.getScenarioValue(scenario, 'Rendement'),
                kosten: this.getScenarioValue(scenario, 'Kosten'),
                roi: this.getScenarioROI(scenario)
            };
        });
        
        return {
            scenarios: data,
            stressTest: this.stressTestResults
        };
    }
    
    getScenarioROI(scenario) {
        const element = document.getElementById(`${scenario}CaseROI`);
        if (element) {
            const match = element.textContent.match(/ROI: ([\d.-]+)%/);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    }
    
    // Utility: debounce function
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}