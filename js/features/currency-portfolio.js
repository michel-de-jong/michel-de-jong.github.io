// Currency Portfolio Feature - Extends portfolio functionality with multi-currency support
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
                await this.updateRiskAnalysis();
            }
        });
        
        // Analysis buttons
        const analyzeBtn = document.getElementById('analyzeFXRiskBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.performFXRiskAnalysis());
        }
        
        const hedgeBtn = document.getElementById('calculateHedgeBtn');
        if (hedgeBtn) {
            hedgeBtn.addEventListener('click', () => this.calculateHedgingStrategy());
        }
        
        const stressTestBtn = document.getElementById('runStressTestBtn');
        if (stressTestBtn) {
            stressTestBtn.addEventListener('click', () => this.runStressTest());
        }
    }
    
    /**
     * Update currency selectors in the UI
     */
    updateCurrencySelectors() {
        const currencies = this.currencyService.getSupportedCurrencies();
        const selectorHTML = currencies.map(curr => 
            `<option value="${curr.code}">${curr.symbol} ${curr.code} - ${curr.name}</option>`
        ).join('');
        
        // Update all currency selectors
        const selectors = document.querySelectorAll('.currency-selector');
        selectors.forEach(selector => {
            const currentValue = selector.value;
            selector.innerHTML = selectorHTML;
            if (currentValue && this.currencyService.isSupported(currentValue)) {
                selector.value = currentValue;
            }
        });
        
        // Update base currency selector
        const baseSelector = document.getElementById('baseCurrencySelector');
        if (baseSelector) {
            baseSelector.innerHTML = selectorHTML;
            baseSelector.value = this.currencyPortfolio.baseCurrency;
        }
    }
    
    /**
     * Handle currency change for an asset
     */
    async handleCurrencyChange(selectElement) {
        const assetRow = selectElement.closest('.asset-row');
        if (!assetRow) return;
        
        const assetId = assetRow.dataset.assetId;
        const newCurrency = selectElement.value;
        
        // Update currency in portfolio
        const asset = this.currencyPortfolio.assets.find(a => a.id === assetId);
        if (asset) {
            asset.currency = newCurrency;
        }
        
        // Update converted value display
        await this.updateConvertedValue(assetRow);
        
        // Recalculate portfolio metrics
        await this.updatePortfolioMetrics();
    }
    
    /**
     * Handle base currency change
     */
    async handleBaseCurrencyChange(newBaseCurrency) {
        this.currencyPortfolio.baseCurrency = newBaseCurrency;
        this.currencyService.setBaseCurrency(newBaseCurrency);
        
        // Update all converted values
        const assetRows = document.querySelectorAll('.asset-row');
        for (const row of assetRows) {
            await this.updateConvertedValue(row);
        }
        
        // Recalculate portfolio metrics
        await this.updatePortfolioMetrics();
        
        // Update risk analysis if visible
        if (this.uiState.showRiskAnalysis) {
            await this.updateRiskAnalysis();
        }
    }
    
    /**
     * Update converted value display for an asset
     */
    async updateConvertedValue(assetRow) {
        const amountInput = assetRow.querySelector('.asset-amount');
        const currencySelect = assetRow.querySelector('.asset-currency');
        const convertedDisplay = assetRow.querySelector('.converted-value');
        
        if (!amountInput || !currencySelect || !convertedDisplay) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect.value;
        
        if (amount > 0 && currency !== this.currencyPortfolio.baseCurrency) {
            try {
                const converted = await this.currencyService.convert(
                    amount,
                    currency,
                    this.currencyPortfolio.baseCurrency
                );
                
                const rate = await this.currencyService.getExchangeRate(
                    currency,
                    this.currencyPortfolio.baseCurrency
                );
                
                convertedDisplay.innerHTML = `
                    <span class="converted-amount">${formatNumber(converted)} ${this.currencyPortfolio.baseCurrency}</span>
                    <span class="exchange-rate">(1 ${currency} = ${rate.toFixed(4)} ${this.currencyPortfolio.baseCurrency})</span>
                `;
                convertedDisplay.style.display = 'block';
            } catch (error) {
                console.error('Currency conversion error:', error);
                convertedDisplay.style.display = 'none';
            }
        } else {
            convertedDisplay.style.display = 'none';
        }
    }
    
    /**
     * Update portfolio metrics with currency consideration
     */
    async updatePortfolioMetrics() {
        // Collect all assets with currency info
        const assets = [];
        const assetRows = document.querySelectorAll('.asset-row');
        
        for (const row of assetRows) {
            const id = row.dataset.assetId;
            const name = row.querySelector('.asset-name')?.value || '';
            const amount = parseFloat(row.querySelector('.asset-amount')?.value) || 0;
            const currency = row.querySelector('.asset-currency')?.value || this.currencyPortfolio.baseCurrency;
            const expectedReturn = parseFloat(row.querySelector('.asset-return')?.value) || 0;
            const risk = parseFloat(row.querySelector('.asset-risk')?.value) || 0;
            
            if (amount > 0) {
                assets.push({
                    id,
                    name,
                    value: amount,
                    currency,
                    expectedReturn,
                    risk
                });
            }
        }
        
        this.currencyPortfolio.assets = assets;
        
        // Calculate total portfolio value in base currency
        let totalValue = 0;
        let weightedReturn = 0;
        let currencyExposures = new Map();
        
        for (const asset of assets) {
            const valueInBase = await this.currencyService.convert(
                asset.value,
                asset.currency,
                this.currencyPortfolio.baseCurrency
            );
            
            totalValue += valueInBase;
            weightedReturn += valueInBase * asset.expectedReturn;
            
            // Track currency exposures
            if (currencyExposures.has(asset.currency)) {
                currencyExposures.get(asset.currency).value += valueInBase;
                currencyExposures.get(asset.currency).assets.push(asset);
            } else {
                currencyExposures.set(asset.currency, {
                    value: valueInBase,
                    assets: [asset]
                });
            }
        }
        
        // Update UI displays
        const portfolioWaardeEl = document.getElementById('portfolioWaarde');
        if (portfolioWaardeEl) {
            portfolioWaardeEl.textContent = 
                `${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} ${formatNumber(totalValue)}`;
        }
        
        const portfolioRendementEl = document.getElementById('portfolioRendement');
        if (portfolioRendementEl) {
            portfolioRendementEl.textContent = 
                totalValue > 0 ? `${(weightedReturn / totalValue).toFixed(2)}%` : '0%';
        }
        
        // Update currency exposure display
        this.updateCurrencyExposureDisplay(currencyExposures, totalValue);
        
        // Save portfolio state
        this.savePortfolioData();
    }
    
    /**
     * Update currency exposure visualization
     */
    updateCurrencyExposureDisplay(exposures, totalValue) {
        const container = document.getElementById('currencyExposureContainer');
        if (!container) return;
        
        const exposureHTML = Array.from(exposures.entries())
            .map(([currency, data]) => {
                const percentage = (data.value / totalValue * 100).toFixed(1);
                const isBase = currency === this.currencyPortfolio.baseCurrency;
                
                return `
                    <div class="currency-exposure-item ${isBase ? 'base-currency' : ''}">
                        <div class="exposure-header">
                            <span class="currency-code">${currency}</span>
                            <span class="exposure-percentage">${percentage}%</span>
                        </div>
                        <div class="exposure-bar">
                            <div class="exposure-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="exposure-value">
                            ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} ${formatNumber(data.value)}
                        </div>
                    </div>
                `;
            })
            .join('');
        
        container.innerHTML = exposureHTML;
    }
    
    /**
     * Perform comprehensive FX risk analysis
     */
    async performFXRiskAnalysis() {
        if (this.currencyPortfolio.assets.length === 0) {
            alert('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        // Show loading state
        this.showLoading('Analyzing FX risk...');
        
        try {
            // Perform exposure analysis
            const exposureAnalysis = await this.fxRiskAnalysis.analyzePortfolioExposure(
                this.currencyPortfolio.assets,
                this.currencyPortfolio.baseCurrency
            );
            
            // Perform risk attribution
            const riskAttribution = await this.fxRiskAnalysis.calculateRiskAttribution(
                this.currencyPortfolio.assets,
                this.currencyPortfolio.baseCurrency
            );
            
            // Store analysis results
            this.currencyPortfolio.lastAnalysis = {
                timestamp: new Date(),
                exposure: exposureAnalysis,
                riskAttribution: riskAttribution
            };
            
            // Update UI with analysis results
            this.displayRiskAnalysis(exposureAnalysis, riskAttribution);
            
            // Show risk analysis panel
            this.uiState.showRiskAnalysis = true;
            
        } catch (error) {
            console.error('FX Risk Analysis error:', error);
            alert('Er is een fout opgetreden bij de risicoanalyse');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display risk analysis results
     */
    displayRiskAnalysis(exposureAnalysis, riskAttribution) {
        const container = document.getElementById('fxRiskAnalysisResults');
        if (!container) return;
        
        // Generate risk metrics HTML
        const metricsHTML = `
            <div class="risk-metrics-grid">
                <div class="metric-card">
                    <h4>Portfolio VaR (95%)</h4>
                    <div class="metric-value">
                        ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                        ${formatNumber(exposureAnalysis.valueAtRisk.amount)}
                    </div>
                    <div class="metric-subtitle">
                        ${(exposureAnalysis.valueAtRisk.percentage * 100).toFixed(2)}% of portfolio
                    </div>
                </div>
                
                <div class="metric-card">
                    <h4>Expected Shortfall</h4>
                    <div class="metric-value">
                        ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                        ${formatNumber(exposureAnalysis.expectedShortfall)}
                    </div>
                    <div class="metric-subtitle">Average loss beyond VaR</div>
                </div>
                
                <div class="metric-card">
                    <h4>Correlation Risk</h4>
                    <div class="metric-value ${this.getCorrelationRiskClass(exposureAnalysis.correlationRisk)}">
                        ${exposureAnalysis.correlationRisk}
                    </div>
                    <div class="metric-subtitle">Currency pair correlation</div>
                </div>
            </div>
        `;
        
        // Generate exposure breakdown HTML
        const exposureHTML = `
            <div class="exposure-breakdown">
                <h4>Currency Exposure Breakdown</h4>
                ${exposureAnalysis.currencyBreakdown.map(currency => `
                    <div class="exposure-item">
                        <div class="exposure-currency">${currency.code}</div>
                        <div class="exposure-details">
                            <div class="exposure-value">
                                ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                                ${formatNumber(currency.valueInBase)}
                            </div>
                            <div class="exposure-metrics">
                                <span>Vol: ${(currency.volatility * 100).toFixed(1)}%</span>
                                <span>VaR: ${formatNumber(currency.valueAtRisk)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Generate risk attribution HTML
        const attributionHTML = `
            <div class="risk-attribution">
                <h4>Risk Attribution</h4>
                ${riskAttribution.map(item => `
                    <div class="attribution-item">
                        <div class="attribution-currency">${item.currency}</div>
                        <div class="attribution-bar">
                            <div class="attribution-fill" 
                                 style="width: ${item.percentageOfTotal}%"></div>
                        </div>
                        <div class="attribution-value">
                            ${item.percentageOfTotal.toFixed(1)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = metricsHTML + exposureHTML + attributionHTML;
    }
    
    /**
     * Calculate optimal hedging strategy
     */
    async calculateHedgingStrategy() {
        if (!this.currencyPortfolio.lastAnalysis) {
            alert('Voer eerst een risicoanalyse uit');
            return;
        }
        
        this.showLoading('Calculating hedging strategy...');
        
        try {
            const hedgingRecommendations = 
                await this.fxRiskAnalysis.calculateOptimalHedge(
                    this.currencyPortfolio.assets,
                    this.currencyPortfolio.baseCurrency,
                    this.uiState.riskTolerance
                );
            
            this.displayHedgingRecommendations(hedgingRecommendations);
            
        } catch (error) {
            console.error('Hedging calculation error:', error);
            alert('Er is een fout opgetreden bij het berekenen van de hedging strategie');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display hedging recommendations
     */
    displayHedgingRecommendations(recommendations) {
        const container = document.getElementById('hedgingRecommendations');
        if (!container) return;
        
        const html = `
            <div class="hedging-recommendations">
                <h3>Aanbevolen Hedging Strategie</h3>
                
                <div class="hedging-summary">
                    <div class="summary-item">
                        <label>Totale hedge ratio:</label>
                        <span>${(recommendations.totalHedgeRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div class="summary-item">
                        <label>Geschatte kosten:</label>
                        <span>${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                              ${formatNumber(recommendations.estimatedCost)}</span>
                    </div>
                    <div class="summary-item">
                        <label>Risk reductie:</label>
                        <span>${(recommendations.riskReduction * 100).toFixed(0)}%</span>
                    </div>
                </div>
                
                <div class="hedging-strategies">
                    ${recommendations.strategies.map((strategy, index) => `
                        <div class="strategy-card">
                            <h4>${strategy.currencyPair}</h4>
                            <div class="strategy-details">
                                <div class="detail-row">
                                    <label>Instrument:</label>
                                    <span>${this.getInstrumentName(strategy.instrument)}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Notional:</label>
                                    <span>${formatNumber(strategy.notionalAmount)}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Hedge ratio:</label>
                                    <span>${(strategy.hedgeRatio * 100).toFixed(0)}%</span>
                                </div>
                                <div class="detail-row">
                                    <label>Kosten:</label>
                                    <span>${formatNumber(strategy.cost)}</span>
                                </div>
                            </div>
                            <button class="implement-hedge-btn" 
                                    data-strategy-index="${index}">
                                Implementeer hedge
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners for implementation buttons
        container.querySelectorAll('.implement-hedge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.strategyIndex);
                this.implementHedgingStrategy(recommendations.strategies[index]);
            });
        });
    }
    
    /**
     * Implement selected hedging strategy
     */
    implementHedgingStrategy(strategy) {
        const hedgeId = generateId();
        const hedge = {
            id: hedgeId,
            ...strategy,
            implementationDate: new Date(),
            status: 'active'
        };
        
        this.currencyPortfolio.hedgingStrategies.push(hedge);
        this.savePortfolioData();
        
        // Update UI
        this.updateHedgingStrategiesDisplay();
        
        alert(`Hedging strategie geïmplementeerd voor ${strategy.currencyPair}`);
    }
    
    /**
     * Run currency stress test
     */
    async runStressTest() {
        if (this.currencyPortfolio.assets.length === 0) {
            alert('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showLoading('Running stress test...');
        
        try {
            const stressTestResults = 
                await this.fxRiskAnalysis.performStressTest(
                    this.currencyPortfolio.assets,
                    this.currencyPortfolio.baseCurrency
                );
            
            this.displayStressTestResults(stressTestResults);
            
        } catch (error) {
            console.error('Stress test error:', error);
            alert('Er is een fout opgetreden bij de stress test');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display stress test results
     */
    displayStressTestResults(results) {
        const container = document.getElementById('stressTestResults');
        if (!container) return;
        
        const html = `
            <div class="stress-test-results">
                <h3>Currency Stress Test Results</h3>
                
                <div class="stress-summary">
                    <div class="summary-card worst-case">
                        <h4>Worst Case Scenario</h4>
                        <div class="scenario-value">
                            ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                            ${formatNumber(results.worstCase.portfolioValue)}
                        </div>
                        <div class="scenario-loss">
                            Loss: ${formatNumber(results.worstCase.loss)} 
                            (${(results.worstCase.percentageLoss * 100).toFixed(1)}%)
                        </div>
                    </div>
                    
                    <div class="summary-card best-case">
                        <h4>Best Case Scenario</h4>
                        <div class="scenario-value">
                            ${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                            ${formatNumber(results.bestCase.portfolioValue)}
                        </div>
                        <div class="scenario-gain">
                            Gain: ${formatNumber(results.bestCase.gain)} 
                            (${(results.bestCase.percentageGain * 100).toFixed(1)}%)
                        </div>
                    </div>
                </div>
                
                <div class="stress-scenarios">
                    <h4>Scenario Analysis</h4>
                    <table class="stress-table">
                        <thead>
                            <tr>
                                <th>Scenario</th>
                                <th>Portfolio Value</th>
                                <th>Change</th>
                                <th>Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.scenarios.map(scenario => `
                                <tr class="${this.getScenarioClass(scenario.impact)}">
                                    <td>${scenario.name}</td>
                                    <td>${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} 
                                        ${formatNumber(scenario.portfolioValue)}</td>
                                    <td>${formatNumber(scenario.change)}</td>
                                    <td>${(scenario.percentageChange * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="stress-recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${results.recommendations.map(rec => 
                            `<li>${rec}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update hedging strategies display
     */
    updateHedgingStrategiesDisplay() {
        const container = document.getElementById('activeHedges');
        if (!container) return;
        
        const activeHedges = this.currencyPortfolio.hedgingStrategies
            .filter(h => h.status === 'active');
        
        if (activeHedges.length === 0) {
            container.innerHTML = '<p class="no-hedges">Geen actieve hedging strategieën</p>';
            return;
        }
        
        const html = `
            <div class="active-hedges-list">
                ${activeHedges.map(hedge => `
                    <div class="hedge-item">
                        <div class="hedge-header">
                            <span class="hedge-pair">${hedge.currencyPair}</span>
                            <span class="hedge-instrument">${this.getInstrumentName(hedge.instrument)}</span>
                        </div>
                        <div class="hedge-details">
                            <span>Notional: ${formatNumber(hedge.notionalAmount)}</span>
                            <span>Ratio: ${(hedge.hedgeRatio * 100).toFixed(0)}%</span>
                            <span>Cost: ${formatNumber(hedge.cost)}</span>
                        </div>
                        <div class="hedge-actions">
                            <button class="close-hedge-btn" data-hedge-id="${hedge.id}">
                                Close hedge
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners
        container.querySelectorAll('.close-hedge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hedgeId = e.target.dataset.hedgeId;
                this.closeHedge(hedgeId);
            });
        });
    }
    
    /**
     * Close a hedging position
     */
    closeHedge(hedgeId) {
        const hedge = this.currencyPortfolio.hedgingStrategies
            .find(h => h.id === hedgeId);
        
        if (!hedge) return;
        
        hedge.status = 'closed';
        hedge.closedDate = new Date();
        
        this.updateHedgingStrategiesDisplay();
        this.savePortfolioData();
    }
    
    /**
     * Update risk analysis display
     */
    async updateRiskAnalysis() {
        if (!this.uiState.showRiskAnalysis || 
            this.currencyPortfolio.assets.length === 0) {
            return;
        }
        
        await this.performFXRiskAnalysis();
    }
    
    /**
     * Remove hedge from portfolio
     */
    removeHedge(hedgeId) {
        const hedge = this.currencyPortfolio.hedgingStrategies
            .find(h => h.id === hedgeId);
        
        if (!hedge || hedge.status === 'active') return;
        
        this.currencyPortfolio.hedgingStrategies = 
            this.currencyPortfolio.hedgingStrategies.filter(h => h.id !== hedgeId);
        
        this.updateHedgingStrategiesDisplay();
        this.savePortfolioData();
    }
    
    /**
     * Helper methods
     */
    
    getCurrencySymbol(currencyCode) {
        const currency = this.currencyService.getCurrencyDetails(currencyCode);
        return currency ? currency.symbol : currencyCode;
    }
    
    getInstrumentName(instrumentType) {
        const names = {
            forward: 'Forward Contract',
            option: 'Currency Option',
            swap: 'Currency Swap',
            natural: 'Natural Hedge'
        };
        return names[instrumentType] || instrumentType;
    }
    
    getCorrelationRiskClass(risk) {
        if (risk === 'High') return 'risk-high';
        if (risk === 'Medium') return 'risk-medium';
        return 'risk-low';
    }
    
    getScenarioClass(impact) {
        if (impact < -0.1) return 'scenario-negative';
        if (impact > 0.1) return 'scenario-positive';
        return 'scenario-neutral';
    }
    
    showLoading(message) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            const messageEl = loader.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
            loader.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    savePortfolioData() {
        const data = {
            baseCurrency: this.currencyPortfolio.baseCurrency,
            assets: this.currencyPortfolio.assets,
            hedgingStrategies: this.currencyPortfolio.hedgingStrategies,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('roi_calculator_currency_portfolio', JSON.stringify(data));
    }
    
    loadSavedData() {
        const saved = localStorage.getItem('roi_calculator_currency_portfolio');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            
            if (data.baseCurrency) {
                this.currencyPortfolio.baseCurrency = data.baseCurrency;
            }
            
            if (data.assets) {
                this.currencyPortfolio.assets = data.assets;
            }
            
            if (data.hedgingStrategies) {
                this.currencyPortfolio.hedgingStrategies = data.hedgingStrategies;
            }
            
        } catch (error) {
            console.error('Error loading saved currency portfolio data:', error);
        }
    }
}