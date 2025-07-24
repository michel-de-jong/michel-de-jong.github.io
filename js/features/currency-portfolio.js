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
        
        // FX Analysis buttons
        document.getElementById('analyzeFXRiskBtn')?.addEventListener('click', () => this.analyzeFXRisk());
        document.getElementById('runStressTestBtn')?.addEventListener('click', () => this.runStressTest());
        document.getElementById('calculateHedgeBtn')?.addEventListener('click', () => this.calculateOptimalHedge());
    }
    
    updateCurrencySelectors() {
        const currencyOptions = this.getCurrencyOptions();
        const selectors = document.querySelectorAll('.currency-selector');
        
        selectors.forEach(selector => {
            const currentValue = selector.value;
            selector.innerHTML = currencyOptions;
            if (currentValue) {
                selector.value = currentValue;
            }
        });
        
        // Set base currency selector to EUR by default
        const baseCurrencySelector = document.getElementById('baseCurrencySelector');
        if (baseCurrencySelector && !baseCurrencySelector.value) {
            baseCurrencySelector.value = 'EUR';
        }
    }
    
    getCurrencyOptions() {
        const currencies = [
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'USD', name: 'Amerikaanse Dollar', symbol: '$' },
            { code: 'GBP', name: 'Britse Pond', symbol: '£' },
            { code: 'JPY', name: 'Japanse Yen', symbol: '¥' },
            { code: 'CHF', name: 'Zwitserse Frank', symbol: 'CHF' },
            { code: 'CAD', name: 'Canadese Dollar', symbol: 'C$' },
            { code: 'AUD', name: 'Australische Dollar', symbol: 'A$' },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
        ];
        
        return currencies.map(curr => 
            `<option value="${curr.code}">${curr.code} - ${curr.name}</option>`
        ).join('');
    }
    
    async handleCurrencyChange(currencySelect) {
        const assetRow = currencySelect.closest('.asset-row');
        if (!assetRow) return;
        
        const currency = currencySelect.value;
        const amountInput = assetRow.querySelector('.asset-amount');
        const convertedValueDiv = assetRow.querySelector('.converted-value');
        
        if (currency !== this.currencyPortfolio.baseCurrency && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            const convertedAmount = await this.convertCurrency(amount, currency, this.currencyPortfolio.baseCurrency);
            
            if (convertedValueDiv && convertedAmount) {
                convertedValueDiv.textContent = `≈ ${this.formatCurrency(convertedAmount, this.currencyPortfolio.baseCurrency)}`;
                convertedValueDiv.style.display = 'block';
            }
        } else if (convertedValueDiv) {
            convertedValueDiv.style.display = 'none';
        }
    }
    
    async handleBaseCurrencyChange(newBaseCurrency) {
        this.currencyPortfolio.baseCurrency = newBaseCurrency;
        
        // Update all converted values
        const assetRows = document.querySelectorAll('.asset-row');
        for (const row of assetRows) {
            const currencySelect = row.querySelector('.asset-currency');
            if (currencySelect) {
                await this.handleCurrencyChange(currencySelect);
            }
        }
        
        // Save preference
        this.savePreferences();
        
        // Show notification
        this.showInfo(`Basisvaluta gewijzigd naar ${newBaseCurrency}`);
    }
    
    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        if (this.currencyService && typeof this.currencyService.convert === 'function') {
            try {
                return await this.currencyService.convert(amount, fromCurrency, toCurrency);
            } catch (error) {
                console.error('Currency conversion error:', error);
                return null;
            }
        }
        
        // Fallback: simplified conversion rates (for demo purposes)
        const rates = {
            'EUR': 1,
            'USD': 1.08,
            'GBP': 0.86,
            'JPY': 161.5,
            'CHF': 0.94,
            'CAD': 1.48,
            'AUD': 1.65,
            'CNY': 7.85
        };
        
        const eurAmount = amount / rates[fromCurrency];
        return eurAmount * rates[toCurrency];
    }
    
    formatCurrency(amount, currency) {
        const formatter = new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(amount);
    }
    
    async analyzeFXRisk() {
        const assets = this.portfolioFeature.collectAssets();
        if (assets.length === 0) {
            this.showError('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showLoadingIndicator(true);
        
        try {
            // Calculate FX exposure
            const fxExposure = await this.calculateFXExposure(assets);
            
            // Display results
            this.displayFXRiskAnalysis(fxExposure);
            
            // Store analysis
            this.currencyPortfolio.lastAnalysis = {
                timestamp: new Date().toISOString(),
                exposure: fxExposure,
                baseCurrency: this.currencyPortfolio.baseCurrency
            };
            
            this.showSuccess('FX risico analyse voltooid');
        } catch (error) {
            console.error('FX risk analysis error:', error);
            this.showError('Fout bij FX risico analyse');
        } finally {
            this.showLoadingIndicator(false);
        }
    }
    
    async calculateFXExposure(assets) {
        const exposure = {};
        let totalValueInBase = 0;
        
        for (const asset of assets) {
            const valueInBase = await this.convertCurrency(
                asset.amount, 
                asset.currency, 
                this.currencyPortfolio.baseCurrency
            );
            
            if (!exposure[asset.currency]) {
                exposure[asset.currency] = {
                    totalAmount: 0,
                    totalValueInBase: 0,
                    assets: []
                };
            }
            
            exposure[asset.currency].totalAmount += asset.amount;
            exposure[asset.currency].totalValueInBase += valueInBase;
            exposure[asset.currency].assets.push(asset);
            
            totalValueInBase += valueInBase;
        }
        
        // Calculate percentages
        Object.keys(exposure).forEach(currency => {
            exposure[currency].percentage = (exposure[currency].totalValueInBase / totalValueInBase) * 100;
        });
        
        return {
            exposure,
            totalValueInBase,
            baseCurrency: this.currencyPortfolio.baseCurrency
        };
    }
    
    displayFXRiskAnalysis(fxExposure) {
        const resultsDiv = document.getElementById('fxRiskAnalysisResults');
        if (!resultsDiv) return;
        
        let html = `
            <h4>Valuta Blootstelling Analyse</h4>
            <div class="fx-exposure-summary">
                <p><strong>Totale Portfolio Waarde:</strong> ${this.formatCurrency(fxExposure.totalValueInBase, fxExposure.baseCurrency)}</p>
                <p><strong>Basisvaluta:</strong> ${fxExposure.baseCurrency}</p>
            </div>
            <div class="fx-exposure-breakdown">
        `;
        
        Object.entries(fxExposure.exposure).forEach(([currency, data]) => {
            const riskLevel = this.assessCurrencyRisk(currency, data.percentage);
            html += `
                <div class="currency-exposure-item">
                    <div class="currency-header">
                        <span class="currency-code">${currency}</span>
                        <span class="exposure-percentage">${data.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="exposure-details">
                        <p>Waarde: ${this.formatCurrency(data.totalValueInBase, fxExposure.baseCurrency)}</p>
                        <p>Risico Niveau: <span class="risk-level ${riskLevel.class}">${riskLevel.label}</span></p>
                    </div>
                    <div class="exposure-assets">
                        ${data.assets.map(asset => `<span class="asset-tag">${asset.name}</span>`).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    assessCurrencyRisk(currency, percentage) {
        // Simplified risk assessment based on currency volatility and exposure
        const volatility = {
            'EUR': 0.5,
            'USD': 0.6,
            'GBP': 0.7,
            'JPY': 0.8,
            'CHF': 0.4,
            'CAD': 0.7,
            'AUD': 0.9,
            'CNY': 0.8
        };
        
        const risk = (volatility[currency] || 1) * percentage / 10;
        
        if (risk < 2) return { label: 'Laag', class: 'risk-low' };
        if (risk < 5) return { label: 'Gemiddeld', class: 'risk-medium' };
        return { label: 'Hoog', class: 'risk-high' };
    }
    
    async runStressTest() {
        const assets = this.portfolioFeature.collectAssets();
        if (assets.length === 0) {
            this.showError('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showLoadingIndicator(true);
        
        try {
            const scenarios = this.generateStressScenarios();
            const results = await this.simulateScenarios(assets, scenarios);
            
            this.displayStressTestResults(results);
            this.showSuccess('Stresstest voltooid');
        } catch (error) {
            console.error('Stress test error:', error);
            this.showError('Fout bij stresstest');
        } finally {
            this.showLoadingIndicator(false);
        }
    }
    
    generateStressScenarios() {
        return [
            { name: 'USD Depreciatie -10%', changes: { USD: -0.10 } },
            { name: 'EUR Appreciatie +5%', changes: { EUR: 0.05 } },
            { name: 'Emerging Market Crisis', changes: { CNY: -0.15, AUD: -0.12 } },
            { name: 'Flight to Quality', changes: { CHF: 0.08, JPY: 0.06, USD: -0.05 } },
            { name: 'Global FX Volatiliteit', changes: { USD: -0.08, GBP: -0.10, EUR: 0.03 } }
        ];
    }
    
    async simulateScenarios(assets, scenarios) {
        const baseValue = await this.calculatePortfolioValue(assets, {});
        const results = [];
        
        for (const scenario of scenarios) {
            const scenarioValue = await this.calculatePortfolioValue(assets, scenario.changes);
            const impact = scenarioValue - baseValue;
            const impactPercentage = (impact / baseValue) * 100;
            
            results.push({
                scenario: scenario.name,
                baseValue,
                scenarioValue,
                impact,
                impactPercentage
            });
        }
        
        return results;
    }
    
    async calculatePortfolioValue(assets, currencyChanges) {
        let totalValue = 0;
        
        for (const asset of assets) {
            const change = currencyChanges[asset.currency] || 0;
            const adjustedAmount = asset.amount * (1 + change);
            const valueInBase = await this.convertCurrency(
                adjustedAmount,
                asset.currency,
                this.currencyPortfolio.baseCurrency
            );
            totalValue += valueInBase;
        }
        
        return totalValue;
    }
    
    displayStressTestResults(results) {
        const resultsDiv = document.getElementById('stressTestResults');
        if (!resultsDiv) return;
        
        let html = `
            <h4>Stresstest Resultaten</h4>
            <div class="stress-test-summary">
        `;
        
        results.forEach(result => {
            const impactClass = result.impact < 0 ? 'negative' : 'positive';
            html += `
                <div class="stress-scenario">
                    <h5>${result.scenario}</h5>
                    <div class="scenario-metrics">
                        <div class="metric">
                            <span class="label">Portfolio Waarde:</span>
                            <span class="value">${this.formatCurrency(result.scenarioValue, this.currencyPortfolio.baseCurrency)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Impact:</span>
                            <span class="value ${impactClass}">${result.impact >= 0 ? '+' : ''}${this.formatCurrency(result.impact, this.currencyPortfolio.baseCurrency)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Percentage:</span>
                            <span class="value ${impactClass}">${result.impactPercentage >= 0 ? '+' : ''}${result.impactPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    async calculateOptimalHedge() {
        const assets = this.portfolioFeature.collectAssets();
        if (assets.length === 0) {
            this.showError('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        const fxExposure = await this.calculateFXExposure(assets);
        const hedgingStrategy = this.determineHedgingStrategy(fxExposure);
        
        this.displayHedgingRecommendations(hedgingStrategy);
        this.currencyPortfolio.hedgingStrategies.push({
            ...hedgingStrategy,
            timestamp: new Date().toISOString()
        });
        
        this.showSuccess('Optimale hedging strategie berekend');
    }
    
    determineHedgingStrategy(fxExposure) {
        const recommendations = [];
        const threshold = this.getHedgingThreshold();
        
        Object.entries(fxExposure.exposure).forEach(([currency, data]) => {
            if (currency !== fxExposure.baseCurrency && data.percentage > threshold) {
                const hedgeRatio = this.calculateHedgeRatio(data.percentage);
                recommendations.push({
                    currency,
                    exposure: data.totalValueInBase,
                    percentage: data.percentage,
                    recommendedHedge: data.totalValueInBase * hedgeRatio,
                    hedgeRatio: hedgeRatio * 100,
                    instrument: this.recommendHedgingInstrument(currency, data.totalValueInBase)
                });
            }
        });
        
        return {
            recommendations,
            totalExposure: fxExposure.totalValueInBase,
            baseCurrency: fxExposure.baseCurrency
        };
    }
    
    getHedgingThreshold() {
        const thresholds = {
            'conservative': 10,
            'moderate': 20,
            'aggressive': 30
        };
        return thresholds[this.uiState.riskTolerance] || 20;
    }
    
    calculateHedgeRatio(exposurePercentage) {
        // Dynamic hedge ratio based on exposure
        if (exposurePercentage < 20) return 0.3;
        if (exposurePercentage < 40) return 0.5;
        if (exposurePercentage < 60) return 0.7;
        return 0.85;
    }
    
    recommendHedgingInstrument(currency, exposureAmount) {
        if (exposureAmount < 100000) {
            return 'Currency ETF';
        } else if (exposureAmount < 1000000) {
            return 'Currency Futures';
        } else {
            return 'Currency Forwards';
        }
    }
    
    displayHedgingRecommendations(strategy) {
        const container = document.getElementById('activeHedgesContainer');
        if (!container) return;
        
        if (strategy.recommendations.length === 0) {
            container.innerHTML = '<p class="no-hedges">Geen hedging aanbevolen bij huidige allocatie</p>';
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
        
        // Add event listeners for implementation buttons
        container.querySelectorAll('.implement-hedge').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currency = e.target.dataset.currency;
                this.showInfo(`Hedge implementatie voor ${currency} wordt voorbereid...`);
            });
        });
    }
    
    loadSavedData() {
        try {
            const saved = localStorage.getItem('currency_portfolio_preferences');
            if (saved) {
                const data = JSON.parse(saved);
                this.currencyPortfolio.baseCurrency = data.baseCurrency || 'EUR';
                this.uiState.riskTolerance = data.riskTolerance || 'moderate';
                
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
            console.error('Error loading saved preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            const preferences = {
                baseCurrency: this.currencyPortfolio.baseCurrency,
                riskTolerance: this.uiState.riskTolerance
            };
            localStorage.setItem('currency_portfolio_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    showLoadingIndicator(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }
    
    showError(message) {
        this.portfolioFeature.showError(message);
    }
    
    showSuccess(message) {
        this.portfolioFeature.showSuccess(message);
    }
    
    showInfo(message) {
        this.portfolioFeature.showInfo(message);
    }
}