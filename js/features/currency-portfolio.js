// Currency Portfolio Feature - Extends portfolio functionality with multi-currency support
// Dutch translation and functionality fixes

import { formatNumber } from '../utils/format-utils.js';
import { generateId } from '../utils/calculation-utils.js';

export class CurrencyPortfolioFeature {
    constructor(portfolioFeature, currencyService, fxRiskAnalysis) {
        this.portfolioFeature = portfolioFeature;
        this.currencyService = currencyService;
        this.fxRiskAnalysis = fxRiskAnalysis;
        
        // Extended portfolio state
        this.currencyPortfolio = {
            assets: [],
            baseCurrency: 'EUR',
            hedgingStrategies: [],
            lastAnalysis: null
        };
        
        // UI state
        this.uiState = {
            showRiskAnalysis: false,
            selectedHedgingStrategy: null,
            riskTolerance: 'moderate'
        };
    }
    
    async initialize() {
        // Initialize currency service if it has an initialize method
        if (this.currencyService && typeof this.currencyService.initialize === 'function') {
            await this.currencyService.initialize();
        }
        
        // Load saved currency portfolio data
        this.loadSavedData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI with currency options
        this.updateCurrencySelectors();
    }
    
    setupEventListeners() {
        // Currency selector change
        document.addEventListener('change', async (e) => {
            if (e.target.classList.contains('asset-currency')) {
                await this.handleCurrencyChange(e.target);
            } else if (e.target.id === 'baseCurrencySelector') {
                await this.handleBaseCurrencyChange(e.target.value);
            } else if (e.target.id === 'riskToleranceSelector') {
                this.uiState.riskTolerance = e.target.value;
            }
        });
        
        // Listen for new assets being added
        document.addEventListener('assetAdded', (e) => {
            // Update currency selectors when a new asset is added
            setTimeout(() => {
                this.updateCurrencySelectors();
            }, 100);
        });
        
        // FX Analysis buttons
        const analyzeFXRiskBtn = document.getElementById('analyzeFXRiskBtn');
        const runStressTestBtn = document.getElementById('runStressTestBtn');
        const calculateHedgeBtn = document.getElementById('calculateHedgeBtn');
        
        if (analyzeFXRiskBtn) {
            analyzeFXRiskBtn.addEventListener('click', () => this.analyzeFXRisk());
        }
        if (runStressTestBtn) {
            runStressTestBtn.addEventListener('click', () => this.runStressTest());
        }
        if (calculateHedgeBtn) {
            calculateHedgeBtn.addEventListener('click', () => this.calculateOptimalHedge());
        }
    }
    
    updateCurrencySelectors() {
        const baseCurrencySelector = document.getElementById('baseCurrencySelector');
        const assetCurrencySelectors = document.querySelectorAll('.asset-currency');
        
        if (!this.currencyService) {
            console.warn('Currency service not available');
            return;
        }
        
        const currencies = this.currencyService.getAvailableCurrencies();
        
        // Update base currency selector
        if (baseCurrencySelector && baseCurrencySelector.options.length === 0) {
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                if (currency.code === this.currencyPortfolio.baseCurrency) {
                    option.selected = true;
                }
                baseCurrencySelector.appendChild(option);
            });
        }
        
        // Update asset currency selectors - only update empty selectors
        assetCurrencySelectors.forEach(selector => {
            if (selector.options.length === 0) {
                currencies.forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.code;
                    option.textContent = `${currency.code} - ${currency.name}`;
                    if (currency.code === 'EUR') {
                        option.selected = true;
                    }
                    selector.appendChild(option);
                });
            }
        });
    }
    
    async handleCurrencyChange(selector) {
        const assetRow = selector.closest('.asset-row');
        if (!assetRow) return;
        
        const currency = selector.value;
        const amountInput = assetRow.querySelector('.asset-amount');
        const convertedDiv = assetRow.querySelector('.converted-value');
        
        if (!amountInput || !convertedDiv) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount > 0 && currency !== this.currencyPortfolio.baseCurrency) {
            try {
                const rate = await this.currencyService.getExchangeRate(currency, this.currencyPortfolio.baseCurrency);
                const convertedAmount = amount * rate;
                
                convertedDiv.textContent = `≈ ${this.formatCurrency(convertedAmount, this.currencyPortfolio.baseCurrency)}`;
                convertedDiv.style.display = 'block';
            } catch (error) {
                console.error('Error converting currency:', error);
                convertedDiv.style.display = 'none';
            }
        } else {
            convertedDiv.style.display = 'none';
        }
    }
    
    async handleBaseCurrencyChange(newCurrency) {
        this.currencyPortfolio.baseCurrency = newCurrency;
        
        // Update all converted values
        const assetRows = document.querySelectorAll('.asset-row');
        for (const row of assetRows) {
            const currencySelector = row.querySelector('.asset-currency');
            if (currencySelector) {
                await this.handleCurrencyChange(currencySelector);
            }
        }
        
        // Save preference
        this.saveCurrencyPreference();
    }
    
    async analyzeFXRisk() {
        const assets = this.portfolioFeature.collectAssets();
        
        if (assets.length === 0) {
            this.showError('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showInfo('FX risico analyse wordt uitgevoerd...');
        
        try {
            // Perform FX risk analysis
            const analysis = await this.fxRiskAnalysis.analyzePortfolio(
                assets,
                this.currencyPortfolio.baseCurrency
            );
            
            this.currencyPortfolio.lastAnalysis = analysis;
            this.displayFXRiskResults(analysis);
            
            this.showSuccess('FX risico analyse voltooid');
        } catch (error) {
            console.error('Error analyzing FX risk:', error);
            this.showError('Fout bij het analyseren van FX risico');
        }
    }
    
    displayFXRiskResults(analysis) {
        const resultsDiv = document.getElementById('fxRiskResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = `
            <div class="fx-analysis-results">
                <h4>Valuta Blootstelling Analyse</h4>
                
                <div class="exposure-summary">
                    <div class="exposure-metric">
                        <span class="label">Totale FX Blootstelling:</span>
                        <span class="value">${this.formatCurrency(analysis.totalExposure, this.currencyPortfolio.baseCurrency)}</span>
                    </div>
                    <div class="exposure-metric">
                        <span class="label">FX Risico (VaR 95%):</span>
                        <span class="value">${this.formatCurrency(analysis.valueAtRisk, this.currencyPortfolio.baseCurrency)}</span>
                    </div>
                </div>
                
                <div class="currency-breakdown">
                    <h5>Blootstelling per Valuta</h5>
                    ${analysis.exposures.map(exp => `
                        <div class="currency-exposure">
                            <div class="currency-header">
                                <span class="currency-code">${exp.currency}</span>
                                <span class="exposure-percentage">${exp.percentage.toFixed(1)}%</span>
                            </div>
                            <div class="exposure-bar">
                                <div class="exposure-fill" style="width: ${exp.percentage}%"></div>
                            </div>
                            <div class="exposure-details">
                                <span>Bedrag: ${this.formatCurrency(exp.amount, exp.currency)}</span>
                                <span>Volatiliteit: ${exp.volatility.toFixed(1)}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="correlation-matrix">
                    <h5>Valuta Correlatie Matrix</h5>
                    <div class="matrix-container">
                        ${this.renderCorrelationMatrix(analysis.correlations)}
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        
        // Update currency exposure chart if available
        this.updateCurrencyExposureChart(analysis);
    }
    
    renderCorrelationMatrix(correlations) {
        if (!correlations || correlations.length === 0) {
            return '<p>Geen correlatie data beschikbaar</p>';
        }
        
        // Simplified correlation matrix rendering
        let html = '<table class="correlation-table"><thead><tr><th></th>';
        
        correlations.forEach(row => {
            html += `<th>${row.currency}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        correlations.forEach(row => {
            html += `<tr><th>${row.currency}</th>`;
            row.correlations.forEach(corr => {
                const colorClass = corr > 0.5 ? 'high-positive' : 
                                 corr < -0.5 ? 'high-negative' : 
                                 corr > 0 ? 'low-positive' : 'low-negative';
                html += `<td class="${colorClass}">${corr.toFixed(2)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    async runStressTest() {
        if (!this.currencyPortfolio.lastAnalysis) {
            this.showError('Voer eerst een FX risico analyse uit');
            return;
        }
        
        this.showInfo('Stresstest wordt uitgevoerd...');
        
        try {
            const scenarios = [
                { name: 'USD +10%', changes: { USD: 0.10 } },
                { name: 'EUR -10%', changes: { EUR: -0.10 } },
                { name: 'Emerging Markets Crisis', changes: { CNY: -0.20, INR: -0.25, BRL: -0.30 } },
                { name: 'Flight to Quality', changes: { USD: 0.15, CHF: 0.10, JPY: 0.12, EUR: -0.05 } }
            ];
            
            const results = await this.fxRiskAnalysis.runStressTest(
                this.portfolioFeature.assets,
                scenarios,
                this.currencyPortfolio.baseCurrency
            );
            
            this.displayStressTestResults(results);
            this.showSuccess('Stresstest voltooid');
        } catch (error) {
            console.error('Error running stress test:', error);
            this.showError('Fout bij het uitvoeren van stresstest');
        }
    }
    
    displayStressTestResults(results) {
        const resultsDiv = document.getElementById('fxRiskResults');
        if (!resultsDiv) return;
        
        let html = '<div class="stress-test-results"><h4>Stresstest Resultaten</h4>';
        
        results.forEach(result => {
            const impactClass = result.impact < -5 ? 'negative' : 
                              result.impact > 5 ? 'positive' : 'neutral';
            
            html += `
                <div class="stress-scenario ${impactClass}">
                    <h5>${result.scenario}</h5>
                    <div class="scenario-impact">
                        <span class="label">Portfolio Impact:</span>
                        <span class="value">${result.impact > 0 ? '+' : ''}${result.impact.toFixed(2)}%</span>
                    </div>
                    <div class="scenario-value">
                        <span class="label">Nieuwe Waarde:</span>
                        <span class="value">${this.formatCurrency(result.newValue, this.currencyPortfolio.baseCurrency)}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        resultsDiv.innerHTML += html;
    }
    
    async calculateOptimalHedge() {
        if (!this.currencyPortfolio.lastAnalysis) {
            this.showError('Voer eerst een FX risico analyse uit');
            return;
        }
        
        this.showInfo('Optimale hedge strategie wordt berekend...');
        
        try {
            const hedgingStrategy = await this.fxRiskAnalysis.calculateOptimalHedge(
                this.portfolioFeature.assets,
                this.currencyPortfolio.baseCurrency,
                this.uiState.riskTolerance
            );
            
            this.currencyPortfolio.hedgingStrategies.push(hedgingStrategy);
            this.displayHedgingRecommendations(hedgingStrategy);
            
            this.showSuccess('Hedge strategie berekend');
        } catch (error) {
            console.error('Error calculating hedge:', error);
            this.showError('Fout bij het berekenen van hedge strategie');
        }
    }
    
    displayHedgingRecommendations(strategy) {
        const resultsDiv = document.getElementById('fxRiskResults');
        if (!resultsDiv) return;
        
        const container = document.createElement('div');
        container.className = 'hedging-strategy';
        
        if (!strategy || !strategy.recommendations) {
            container.innerHTML = '<p>Geen hedging aanbevelingen beschikbaar voor huidige allocatie</p>';
            return;
        }
        
        let html = '<div class="hedging-recommendations">';
        
        strategy.recommendations.forEach(rec => {
            html += `
                <div class="hedge-recommendation">
                    <h5>Hedge ${rec.currency} Blootstelling</h5>
                    <div class="hedge-details">
                        <p><strong>Blootstelling:</strong> ${this.formatCurrency(rec.exposure, strategy.baseCurrency)} (${rec.percentage.toFixed(1)}%)</p>
                        <p><strong>Aanbevolen Hedge:</strong> ${this.formatCurrency(rec.recommendedHedge, strategy.baseCurrency)} (${rec.hedgeRatio.toFixed(0)}%)</p>
                        <p><strong>Instrument:</strong> ${rec.instrument}</p>
                    </div>
                    <button class="btn btn-sm btn-primary implement-hedge" data-currency="${rec.currency}">
                        Implementeer Hedge
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        resultsDiv.appendChild(container);
        
        // Add event listeners for implementation buttons
        container.querySelectorAll('.implement-hedge').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currency = e.target.dataset.currency;
                this.showInfo(`Hedge implementatie voor ${currency} wordt voorbereid...`);
            });
        });
    }
    
    updateCurrencyExposureChart(analysis) {
        const chartDiv = document.querySelector('.currency-exposure-chart');
        const canvas = document.getElementById('currencyExposureChart');
        
        if (!chartDiv || !canvas || !this.portfolioFeature.chartManager) return;
        
        // Show the chart container
        chartDiv.style.display = 'block';
        
        // Prepare data for chart
        const chartData = {
            labels: analysis.exposures.map(exp => exp.currency),
            datasets: [{
                label: 'Valuta Blootstelling',
                data: analysis.exposures.map(exp => exp.amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        // Create or update chart
        if (typeof this.portfolioFeature.chartManager.createCurrencyExposureChart === 'function') {
            this.portfolioFeature.chartManager.createCurrencyExposureChart(canvas, chartData);
        }
    }
    
    loadSavedData() {
        try {
            const saved = localStorage.getItem('currencyPortfolioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.currencyPortfolio.baseCurrency = settings.baseCurrency || 'EUR';
                this.uiState.riskTolerance = settings.riskTolerance || 'moderate';
                
                // Update UI
                const baseCurrencySelector = document.getElementById('baseCurrencySelector');
                if (baseCurrencySelector) {
                    baseCurrencySelector.value = this.currencyPortfolio.baseCurrency;
                }
                
                const riskToleranceSelector = document.getElementById('riskToleranceSelector');
                if (riskToleranceSelector) {
                    riskToleranceSelector.value = this.uiState.riskTolerance;
                }
            }
        } catch (error) {
            console.error('Error loading saved currency portfolio data:', error);
        }
    }
    
    saveCurrencyPreference() {
        try {
            const settings = {
                baseCurrency: this.currencyPortfolio.baseCurrency,
                riskTolerance: this.uiState.riskTolerance
            };
            localStorage.setItem('currencyPortfolioSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving currency portfolio settings:', error);
        }
    }
    
    formatCurrency(amount, currency) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    showError(message) {
        if (this.portfolioFeature && typeof this.portfolioFeature.showError === 'function') {
            this.portfolioFeature.showError(message);
        } else {
            console.error(message);
        }
    }
    
    showSuccess(message) {
        if (this.portfolioFeature && typeof this.portfolioFeature.showSuccess === 'function') {
            this.portfolioFeature.showSuccess(message);
        } else {
            console.log(message);
        }
    }
    
    showInfo(message) {
        if (this.portfolioFeature && typeof this.portfolioFeature.showInfo === 'function') {
            this.portfolioFeature.showInfo(message);
        } else {
            console.info(message);
        }
    }
}