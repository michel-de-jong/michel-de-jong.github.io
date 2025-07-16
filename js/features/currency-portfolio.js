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
        // Initialize currency service
        await this.currencyService.initialize();
        
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
        document.getElementById('portfolioWaarde').textContent = 
            `${this.getCurrencySymbol(this.currencyPortfolio.baseCurrency)} ${formatNumber(totalValue)}`;
        
        document.getElementById('portfolioRendement').textContent = 
            totalValue > 0 ? `${(weightedReturn / totalValue).toFixed(2)}%` : '0%';
        
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
            
            // Generate hedging recommendations
            const hedgingRecommendations = await this.fxRiskAnalysis.generateHedgingRecommendations(
                exposureAnalysis,
                this.uiState.riskTolerance
            );
            
            // Store analysis results
            this.currencyPortfolio.lastAnalysis = {
                timestamp: new Date(),
                exposureAnalysis,
                riskAttribution,
                hedgingRecommendations
            };
            
            // Update UI with results
            this.displayRiskAnalysisResults();
            
        } catch (error) {
            console.error('FX risk analysis error:', error);
            alert('Er is een fout opgetreden bij de risicoanalyse');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display risk analysis results
     */
    displayRiskAnalysisResults() {
        const results = this.currencyPortfolio.lastAnalysis;
        if (!results) return;
        
        const container = document.getElementById('fxRiskAnalysisResults');
        if (!container) return;
        
        const { exposureAnalysis, riskAttribution, hedgingRecommendations } = results;
        
        container.innerHTML = `
            <div class="risk-analysis-section">
                <h4>Currency Exposure Analysis</h4>
                <div class="analysis-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Portfolio Value</div>
                        <div class="metric-value">${this.getCurrencySymbol(exposureAnalysis.baseCurrency)} ${formatNumber(exposureAnalysis.totalValue)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Diversification Index</div>
                        <div class="metric-value">${(exposureAnalysis.diversificationIndex * 100).toFixed(1)}%</div>
                    </div>
                    <div class="metric-card risk">
                        <div class="metric-label">Aggregate FX Risk (VaR 95%)</div>
                        <div class="metric-value">${this.getCurrencySymbol(exposureAnalysis.baseCurrency)} ${formatNumber(exposureAnalysis.aggregateRisk)}</div>
                    </div>
                </div>
                
                <div class="currency-risk-table">
                    <h5>Currency Risk Breakdown</h5>
                    <table class="risk-table">
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Exposure</th>
                                <th>% of Portfolio</th>
                                <th>Volatility</th>
                                <th>VaR (95%, 30d)</th>
                                <th>Sharpe Ratio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exposureAnalysis.exposures.map(exp => `
                                <tr class="${exp.currency === exposureAnalysis.baseCurrency ? 'base-currency' : ''}">
                                    <td><strong>${exp.currency}</strong></td>
                                    <td>${formatNumber(exp.value)}</td>
                                    <td>${exp.percentage.toFixed(1)}%</td>
                                    <td>${exp.riskMetrics.volatility.toFixed(2)}%</td>
                                    <td>${formatNumber(exp.riskMetrics.var95)}</td>
                                    <td>${exp.riskMetrics.sharpeRatio.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="risk-analysis-section">
                <h4>Risk Attribution</h4>
                <div class="analysis-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Total FX Risk</div>
                        <div class="metric-value">${formatNumber(riskAttribution.totalFXRisk)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Concentration Risk</div>
                        <div class="metric-value">${riskAttribution.concentrationRisk.toFixed(1)}%</div>
                    </div>
                    <div class="metric-card positive">
                        <div class="metric-label">Diversification Benefit</div>
                        <div class="metric-value">${riskAttribution.diversificationBenefit.toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="risk-contributors">
                    <h5>Top Risk Contributors</h5>
                    ${riskAttribution.riskContributions
                        .filter(c => c.fxRiskContribution > 0)
                        .slice(0, 5)
                        .map(contrib => `
                            <div class="risk-contributor">
                                <div class="contributor-info">
                                    <span class="currency">${contrib.currency}</span>
                                    <span class="contribution">${contrib.percentageOfTotal.toFixed(1)}% of total risk</span>
                                </div>
                                <div class="contributor-bar">
                                    <div class="contributor-fill" style="width: ${contrib.percentageOfTotal}%"></div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="risk-analysis-section">
                <h4>Hedging Recommendations</h4>
                <div class="hedging-summary">
                    <p>Risk Tolerance: <strong>${hedgingRecommendations.riskTolerance}</strong></p>
                    <p>Total Hedging Cost Estimate: <strong>${formatNumber(hedgingRecommendations.totalHedgingCost)}</strong></p>
                    <p>Expected Risk Reduction: <strong>${hedgingRecommendations.riskReduction.toFixed(1)}%</strong></p>
                </div>
                
                ${hedgingRecommendations.recommendations.length > 0 ? `
                    <div class="hedging-recommendations">
                        ${hedgingRecommendations.recommendations.map((rec, index) => `
                            <div class="hedging-card">
                                <div class="hedging-header">
                                    <span class="hedge-currency">${rec.currency}</span>
                                    <span class="hedge-priority priority-${rec.priority > 150 ? 'high' : rec.priority > 100 ? 'medium' : 'low'}">
                                        Priority: ${rec.priority > 150 ? 'High' : rec.priority > 100 ? 'Medium' : 'Low'}
                                    </span>
                                </div>
                                <div class="hedging-details">
                                    <p><strong>Current Exposure:</strong> ${formatNumber(rec.currentExposure)} (${rec.exposurePercentage.toFixed(1)}%)</p>
                                    <p><strong>Recommended Hedge:</strong> ${formatNumber(rec.recommendedHedge)} (${rec.hedgePercentage.toFixed(1)}%)</p>
                                    <p><strong>Reason:</strong> ${rec.reason}</p>
                                    <p><strong>Estimated Cost:</strong> ${formatNumber(rec.estimatedCost)}</p>
                                    <div class="hedge-instruments">
                                        <strong>Suggested Instruments:</strong>
                                        ${rec.instruments.map(inst => `
                                            <span class="instrument-tag ${inst.suitability}">${this.getInstrumentName(inst.instrument)}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                <button class="btn btn-primary btn-sm implement-hedge-btn" data-index="${index}">
                                    Implement Hedge
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="no-recommendations">No hedging required based on current risk tolerance and portfolio composition.</p>'}
            </div>
        `;
        
        // Add event listeners for hedge implementation buttons
        container.querySelectorAll('.implement-hedge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.implementHedge(hedgingRecommendations.recommendations[index]);
            });
        });
        
        // Show the results section
        container.style.display = 'block';
        this.uiState.showRiskAnalysis = true;
    }
    
    /**
     * Run stress test scenarios
     */
    async runStressTest() {
        if (this.currencyPortfolio.assets.length === 0) {
            alert('Voeg eerst assets toe aan uw portfolio');
            return;
        }
        
        this.showLoading('Running stress test scenarios...');
        
        try {
            const stressTestResults = await this.fxRiskAnalysis.performStressTest(
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
        
        container.innerHTML = `
            <div class="stress-test-results">
                <h4>Currency Stress Test Results</h4>
                <div class="current-value">
                    <strong>Current Portfolio Value:</strong> 
                    ${this.getCurrencySymbol(results.baseCurrency)} ${formatNumber(results.currentValue)}
                </div>
                
                <div class="stress-scenarios">
                    ${results.scenarios.map(scenario => `
                        <div class="stress-scenario">
                            <h5>${scenario.scenario.charAt(0).toUpperCase() + scenario.scenario.slice(1)} Scenario (±${scenario.magnitude}%)</h5>
                            <div class="scenario-results">
                                <div class="scenario-direction appreciation">
                                    <div class="direction-label">Currency Appreciation</div>
                                    <div class="impact-value ${scenario.appreciation.percentageChange > 0 ? 'positive' : 'negative'}">
                                        ${scenario.appreciation.percentageChange > 0 ? '+' : ''}${scenario.appreciation.percentageChange.toFixed(2)}%
                                    </div>
                                    <div class="absolute-value">
                                        ${formatNumber(scenario.appreciation.value)}
                                    </div>
                                </div>
                                <div class="scenario-direction depreciation">
                                    <div class="direction-label">Currency Depreciation</div>
                                    <div class="impact-value ${scenario.depreciation.percentageChange > 0 ? 'positive' : 'negative'}">
                                        ${scenario.depreciation.percentageChange > 0 ? '+' : ''}${scenario.depreciation.percentageChange.toFixed(2)}%
                                    </div>
                                    <div class="absolute-value">
                                        ${formatNumber(scenario.depreciation.value)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="stress-test-summary">
                    <div class="summary-card worst-case">
                        <h5>Worst Case Scenario</h5>
                        <p>${results.worstCase.scenario} - ${results.worstCase.direction}</p>
                        <p class="impact-value">${results.worstCase.percentageChange.toFixed(2)}%</p>
                        <p>Portfolio Value: ${formatNumber(results.worstCase.value)}</p>
                    </div>
                    <div class="summary-card best-case">
                        <h5>Best Case Scenario</h5>
                        <p>${results.bestCase.scenario} - ${results.bestCase.direction}</p>
                        <p class="impact-value">+${results.bestCase.percentageChange.toFixed(2)}%</p>
                        <p>Portfolio Value: ${formatNumber(results.bestCase.value)}</p>
                    </div>
                </div>
                
                ${results.recommendations.length > 0 ? `
                    <div class="stress-test-recommendations">
                        <h5>Recommendations</h5>
                        <ul>
                            ${results.recommendations.map(rec => `
                                <li>
                                    <strong>${rec.scenario}:</strong> 
                                    ${rec.impact.toFixed(1)}% potential loss - 
                                    ${rec.recommendation}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.style.display = 'block';
    }
    
    /**
     * Implement a specific hedge
     */
    async implementHedge(recommendation) {
        const modal = this.createHedgeImplementationModal(recommendation);
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#hedgeImplementationForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const hedgeData = {
                currency: recommendation.currency,
                amount: parseFloat(formData.get('hedgeAmount')),
                instrument: formData.get('instrument'),
                maturity: formData.get('maturity'),
                notes: formData.get('notes')
            };
            
            // Add to hedging strategies
            this.currencyPortfolio.hedgingStrategies.push({
                id: generateId(),
                ...hedgeData,
                createdAt: new Date(),
                recommendation: recommendation
            });
            
            // Update UI
            this.updateHedgingStrategiesDisplay();
            
            // Close modal
            modal.remove();
            
            // Save data
            this.savePortfolioData();
            
            alert('Hedging strategy toegevoegd');
        });
        
        // Handle modal close
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    /**
     * Create hedge implementation modal
     */
    createHedgeImplementationModal(recommendation) {
        const modal = document.createElement('div');
        modal.className = 'modal hedge-implementation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Implement Hedge for ${recommendation.currency}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="hedgeImplementationForm">
                        <div class="form-group">
                            <label>Currency Exposure</label>
                            <input type="text" value="${formatNumber(recommendation.currentExposure)} (${recommendation.exposurePercentage.toFixed(1)}%)" readonly>
                        </div>
                        <div class="form-group">
                            <label>Recommended Hedge Amount</label>
                            <input type="number" name="hedgeAmount" value="${recommendation.recommendedHedge}" required>
                        </div>
                        <div class="form-group">
                            <label>Hedging Instrument</label>
                            <select name="instrument" required>
                                ${recommendation.instruments.map(inst => `
                                    <option value="${inst.instrument}">${this.getInstrumentName(inst.instrument)} - ${inst.reason}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Maturity (days)</label>
                            <select name="maturity" required>
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                                <option value="90" selected>90 days</option>
                                <option value="180">180 days</option>
                                <option value="365">1 year</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea name="notes" rows="3" placeholder="Additional notes..."></textarea>
                        </div>
                        <div class="form-group">
                            <p><strong>Estimated Cost:</strong> ${formatNumber(recommendation.estimatedCost)}</p>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Implement Hedge</button>
                            <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    /**
     * Update hedging strategies display
     */
    updateHedgingStrategiesDisplay() {
        const container = document.getElementById('activeHedgesContainer');
        if (!container) return;
        
        if (this.currencyPortfolio.hedgingStrategies.length === 0) {
            container.innerHTML = '<p class="no-hedges">No active hedging strategies</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="active-hedges">
                ${this.currencyPortfolio.hedgingStrategies.map(hedge => `
                    <div class="hedge-card" data-hedge-id="${hedge.id}">
                        <div class="hedge-header">
                            <span class="hedge-currency">${hedge.currency}</span>
                            <span class="hedge-instrument">${this.getInstrumentName(hedge.instrument)}</span>
                        </div>
                        <div class="hedge-details">
                            <p><strong>Amount:</strong> ${formatNumber(hedge.amount)}</p>
                            <p><strong>Maturity:</strong> ${hedge.maturity} days</p>
                            <p><strong>Created:</strong> ${new Date(hedge.createdAt).toLocaleDateString()}</p>
                            ${hedge.notes ? `<p><strong>Notes:</strong> ${hedge.notes}</p>` : ''}
                        </div>
                        <button class="btn btn-danger btn-sm remove-hedge-btn" data-hedge-id="${hedge.id}">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add remove event listeners
        container.querySelectorAll('.remove-hedge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hedgeId = e.target.dataset.hedgeId;
                this.removeHedge(hedgeId);
            });
        });
    }
    
    /**
     * Remove a hedging strategy
     */
    removeHedge(hedgeId) {
        if (!confirm('Are you sure you want to remove this hedge?')) return;
        
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
    
    showLoading(message) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.querySelector('.loading-message').textContent = message;
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