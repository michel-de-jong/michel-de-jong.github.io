// Currency Portfolio Feature - Extends portfolio functionality with multi-currency support
// Complete implementation with error handling

import { formatNumber } from '../utils/format-utils.js';

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
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('Initializing Currency Portfolio Feature');
        
        try {
            // Initialize currency service if it has an initialize method
            if (this.currencyService && typeof this.currencyService.initialize === 'function') {
                await this.currencyService.initialize();
            }
            
            // Load saved data
            this.loadSavedData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI with currency options
            this.updateCurrencySelectors();
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing currency portfolio:', error);
        }
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
        const analyzeFXBtn = document.getElementById('analyzeFXRiskBtn');
        const stressTestBtn = document.getElementById('runStressTestBtn');
        
        if (analyzeFXBtn) {
            analyzeFXBtn.addEventListener('click', () => this.analyzeFXRisk());
        }
        
        if (stressTestBtn) {
            stressTestBtn.addEventListener('click', () => this.runStressTest());
        }
        
        // Listen for portfolio loaded events
        document.addEventListener('portfolioLoaded', (e) => {
            if (e.detail && e.detail.assets) {
                this.updateCurrencySelectors();
                this.updateConvertedValues();
            }
        });
    }
    
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('currencyPortfolioPreferences');
            if (savedData) {
                const preferences = JSON.parse(savedData);
                if (preferences.baseCurrency) {
                    this.currencyPortfolio.baseCurrency = preferences.baseCurrency;
                }
                if (preferences.riskTolerance) {
                    this.uiState.riskTolerance = preferences.riskTolerance;
                }
            }
        } catch (error) {
            console.error('Error loading saved currency preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            const preferences = {
                baseCurrency: this.currencyPortfolio.baseCurrency,
                riskTolerance: this.uiState.riskTolerance
            };
            localStorage.setItem('currencyPortfolioPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving currency preferences:', error);
        }
    }
    
    updateCurrencySelectors() {
        const currencies = this.getAvailableCurrencies();
        
        // Update base currency selector
        const baseCurrencySelector = document.getElementById('baseCurrencySelector');
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
        
        // Update risk tolerance selector
        const riskToleranceSelector = document.getElementById('riskToleranceSelector');
        if (riskToleranceSelector && this.uiState.riskTolerance) {
            riskToleranceSelector.value = this.uiState.riskTolerance;
        }
        
        // Update asset currency selectors - only update empty selectors
        const assetCurrencySelectors = document.querySelectorAll('.asset-currency');
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
    
    getAvailableCurrencies() {
        // Default currency list
        return [
            { code: 'EUR', name: 'Euro' },
            { code: 'USD', name: 'US Dollar' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'JPY', name: 'Japanese Yen' },
            { code: 'CHF', name: 'Swiss Franc' },
            { code: 'AUD', name: 'Australian Dollar' },
            { code: 'CAD', name: 'Canadian Dollar' },
            { code: 'CNY', name: 'Chinese Yuan' },
            { code: 'SEK', name: 'Swedish Krona' },
            { code: 'NZD', name: 'New Zealand Dollar' }
        ];
    }
    
    async handleCurrencyChange(selector) {
        const assetRow = selector.closest('.asset-row');
        if (!assetRow) return;
        
        const currency = selector.value;
        const amountInput = assetRow.querySelector('.asset-amount');
        let convertedDiv = assetRow.querySelector('.converted-value');
        
        if (!amountInput) return;
        
        // Create converted value div if it doesn't exist
        if (!convertedDiv) {
            convertedDiv = document.createElement('div');
            convertedDiv.className = 'converted-value';
            convertedDiv.style.display = 'none';
            amountInput.parentNode.appendChild(convertedDiv);
        }
        
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount > 0 && currency !== this.currencyPortfolio.baseCurrency) {
            try {
                const convertedAmount = await this.convertCurrency(
                    amount,
                    currency,
                    this.currencyPortfolio.baseCurrency
                );
                
                if (convertedAmount !== null) {
                    convertedDiv.textContent = `≈ ${this.formatCurrency(convertedAmount, this.currencyPortfolio.baseCurrency)}`;
                    convertedDiv.style.display = 'block';
                } else {
                    convertedDiv.style.display = 'none';
                }
            } catch (error) {
                console.error('Error converting currency:', error);
                convertedDiv.style.display = 'none';
            }
        } else {
            convertedDiv.style.display = 'none';
        }
    }
    
    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        try {
            // Try to use currencyService if available
            if (this.currencyService && typeof this.currencyService.convert === 'function') {
                return await this.currencyService.convert(amount, fromCurrency, toCurrency);
            } else if (this.currencyService && typeof this.currencyService.getExchangeRate === 'function') {
                const rate = await this.currencyService.getExchangeRate(fromCurrency, toCurrency);
                return amount * rate;
            } else {
                // Fallback to hardcoded approximate rates
                const rates = {
                    'EUR_USD': 1.08,
                    'USD_EUR': 0.93,
                    'EUR_GBP': 0.86,
                    'GBP_EUR': 1.16,
                    'EUR_JPY': 162,
                    'JPY_EUR': 0.0062,
                    'EUR_CHF': 0.96,
                    'CHF_EUR': 1.04
                };
                const key = `${fromCurrency}_${toCurrency}`;
                return amount * (rates[key] || 1);
            }
        } catch (error) {
            console.error('Currency conversion error:', error);
            return null;
        }
    }
    
    async handleBaseCurrencyChange(newCurrency) {
        this.currencyPortfolio.baseCurrency = newCurrency;
        
        // Update all converted values
        await this.updateConvertedValues();
        
        // Save preference
        this.savePreferences();
        
        this.showSuccess(`Basisvaluta gewijzigd naar ${newCurrency}`);
    }
    
    async updateConvertedValues() {
        const assetRows = document.querySelectorAll('.asset-row');
        for (const row of assetRows) {
            const currencySelector = row.querySelector('.asset-currency');
            if (currencySelector) {
                await this.handleCurrencyChange(currencySelector);
            }
        }
    }
    
    async analyzeFXRisk() {
        const assets = this.portfolioFeature.collectAssets();
        
        if (assets.length === 0) {
            this.showError('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showInfo('FX risico analyse wordt uitgevoerd...');
        
        try {
            // Show loading state
            const resultsDiv = document.getElementById('fxRiskResults');
            if (resultsDiv) {
                resultsDiv.innerHTML = '<div class="loading">Analyseren...</div>';
                resultsDiv.style.display = 'block';
            }
            
            let analysisResults;
            
            // Check if FX Risk Analysis service is available
            if (this.fxRiskAnalysis) {
                analysisResults = await this.fxRiskAnalysis.analyzeCurrencyExposure(
                    assets,
                    this.currencyPortfolio.baseCurrency
                );
            } else {
                // Fallback: Simple FX exposure calculation
                analysisResults = await this.calculateSimpleFXExposure(assets);
            }
            
            this.currencyPortfolio.lastAnalysis = analysisResults;
            this.displayFXRiskResults(analysisResults);
            
            this.showSuccess('FX risico analyse voltooid');
        } catch (error) {
            console.error('Error analyzing FX risk:', error);
            this.showError('Fout bij FX risico analyse');
            
            const resultsDiv = document.getElementById('fxRiskResults');
            if (resultsDiv) {
                resultsDiv.style.display = 'none';
            }
        }
    }
    
    async calculateSimpleFXExposure(assets) {
        const baseCurrency = this.currencyPortfolio.baseCurrency;
        const exposures = {};
        let totalValue = 0;
        
        // Calculate exposure by currency
        for (const asset of assets) {
            const currency = asset.currency || 'EUR';
            
            if (!exposures[currency]) {
                exposures[currency] = {
                    currency: currency,
                    value: 0,
                    assets: []
                };
            }
            
            let valueInBase = asset.amount;
            if (currency !== baseCurrency) {
                valueInBase = await this.convertCurrency(asset.amount, currency, baseCurrency) || asset.amount;
            }
            
            exposures[currency].value += valueInBase;
            exposures[currency].assets.push(asset.name);
            totalValue += valueInBase;
        }
        
        // Calculate percentages
        Object.values(exposures).forEach(exposure => {
            exposure.percentage = (exposure.value / totalValue) * 100;
        });
        
        return {
            exposures: Object.values(exposures),
            totalValue,
            baseCurrency,
            diversificationScore: Object.keys(exposures).length / 10 * 100 // Simple score
        };
    }
    
    displayFXRiskResults(analysis) {
        const resultsDiv = document.getElementById('fxRiskResults');
        if (!resultsDiv) return;
        
        let html = '<div class="fx-analysis-results">';
        
        // Summary
        html += `
            <div class="fx-summary">
                <h4>Valuta Blootstelling Overzicht</h4>
                <div class="summary-metrics">
                    <div class="metric">
                        <span class="label">Totale Waarde:</span>
                        <span class="value">${this.formatCurrency(analysis.totalValue, analysis.baseCurrency)}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Aantal Valuta:</span>
                        <span class="value">${analysis.exposures.length}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Diversificatie Score:</span>
                        <span class="value">${analysis.diversificationScore ? analysis.diversificationScore.toFixed(0) + '%' : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Currency exposures
        html += '<div class="currency-exposures"><h4>Valuta Verdeling</h4>';
        
        analysis.exposures.forEach(exposure => {
            const barWidth = Math.max(exposure.percentage, 1);
            html += `
                <div class="exposure-item">
                    <div class="exposure-header">
                        <span class="currency">${exposure.currency}</span>
                        <span class="percentage">${exposure.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="exposure-bar-container">
                        <div class="exposure-bar" style="width: ${barWidth}%"></div>
                    </div>
                    <div class="exposure-details">
                        <span class="value">${this.formatCurrency(exposure.value, analysis.baseCurrency)}</span>
                        <span class="assets">${exposure.assets.join(', ')}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Risk metrics if available
        if (analysis.riskMetrics) {
            html += this.displayRiskMetrics(analysis.riskMetrics);
        }
        
        // Hedging recommendations if available
        if (analysis.hedgingRecommendations) {
            html += this.displayHedgingRecommendations(analysis.hedgingRecommendations);
        }
        
        html += '</div>';
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    displayRiskMetrics(riskMetrics) {
        let html = '<div class="risk-metrics"><h4>Risico Metrieken</h4>';
        
        if (riskMetrics.VaR) {
            html += `
                <div class="metric">
                    <span class="label">Value at Risk (95%):</span>
                    <span class="value">${this.formatCurrency(riskMetrics.VaR, this.currencyPortfolio.baseCurrency)}</span>
                </div>
            `;
        }
        
        if (riskMetrics.correlationMatrix) {
            html += '<h5>Valuta Correlaties</h5>';
            html += this.createCorrelationMatrix(riskMetrics.correlationMatrix);
        }
        
        html += '</div>';
        return html;
    }
    
    createCorrelationMatrix(correlations) {
        const currencies = Object.keys(correlations);
        let html = '<table class="correlation-matrix"><thead><tr><th></th>';
        
        currencies.forEach(curr => {
            html += `<th>${curr}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        currencies.forEach(curr1 => {
            html += `<tr><th>${curr1}</th>`;
            currencies.forEach(curr2 => {
                const corr = correlations[curr1][curr2] || 0;
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
    
    displayHedgingRecommendations(recommendations) {
        let html = '<div class="hedging-recommendations"><h4>Hedging Aanbevelingen</h4>';
        
        recommendations.forEach(rec => {
            html += `
                <div class="recommendation">
                    <h5>${rec.instrument}</h5>
                    <p>${rec.description}</p>
                    <div class="rec-details">
                        <span>Kosten: ${rec.estimatedCost}</span>
                        <span>Effectiviteit: ${rec.effectiveness}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
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
            
            let results;
            
            if (this.fxRiskAnalysis && typeof this.fxRiskAnalysis.runStressTest === 'function') {
                results = await this.fxRiskAnalysis.runStressTest(
                    this.portfolioFeature.assets,
                    scenarios,
                    this.currencyPortfolio.baseCurrency
                );
            } else {
                // Fallback simple stress test
                results = await this.runSimpleStressTest(scenarios);
            }
            
            this.displayStressTestResults(results);
            this.showSuccess('Stresstest voltooid');
        } catch (error) {
            console.error('Error running stress test:', error);
            this.showError('Fout bij het uitvoeren van stresstest');
        }
    }
    
    async runSimpleStressTest(scenarios) {
        const results = [];
        const assets = this.portfolioFeature.collectAssets();
        const baseCurrency = this.currencyPortfolio.baseCurrency;
        
        for (const scenario of scenarios) {
            let totalImpact = 0;
            let currentValue = 0;
            let stressedValue = 0;
            
            for (const asset of assets) {
                const currency = asset.currency || 'EUR';
                const valueInBase = await this.convertCurrency(asset.amount, currency, baseCurrency) || asset.amount;
                
                currentValue += valueInBase;
                
                // Apply stress
                const change = scenario.changes[currency] || 0;
                const stressedAssetValue = valueInBase * (1 + change);
                stressedValue += stressedAssetValue;
            }
            
            totalImpact = ((stressedValue - currentValue) / currentValue) * 100;
            
            results.push({
                scenario: scenario.name,
                impact: totalImpact,
                currentValue,
                stressedValue
            });
        }
        
        return results;
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
                    <div class="scenario-values">
                        <span>Huidige waarde: ${this.formatCurrency(result.currentValue, this.currencyPortfolio.baseCurrency)}</span>
                        <span>Stressed waarde: ${this.formatCurrency(result.stressedValue, this.currencyPortfolio.baseCurrency)}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Append to existing results
        const existingContent = resultsDiv.innerHTML;
        resultsDiv.innerHTML = existingContent + html;
    }
    
    formatCurrency(amount, currency) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    // UI Helper methods (delegate to portfolio feature if available)
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