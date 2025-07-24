// Portfolio Feature - Multi-asset portfolio analysis with optimization
// Translated to Dutch and functionality fixes

import { formatNumber, formatPercentage } from '../utils/format-utils.js';

export class PortfolioFeature {
    constructor(chartManager, stateManager, dataService = null) {
        this.chartManager = chartManager;
        this.stateManager = stateManager;
        this.dataService = dataService;
        
        // Portfolio state
        this.assets = [];
        this.portfolioData = null;
        this.savedPortfoliosCache = null;
        this.useDataService = dataService !== null;
    }
    
    initialize() {
        this.setupEventListeners();
        this.addInitialAsset();
        
        // Load saved portfolios if DataService is available
        if (this.dataService && this.useDataService) {
            this.loadSavedPortfoliosFromDataService();
        }
    }
    
    setupEventListeners() {
        // Portfolio builder events
        document.getElementById('addAssetBtn')?.addEventListener('click', () => this.addAsset());
        document.getElementById('calculatePortfolioBtn')?.addEventListener('click', () => this.calculatePortfolio());
        document.getElementById('optimizePortfolioBtn')?.addEventListener('click', () => this.optimizePortfolio());
        document.getElementById('savePortfolioBtn')?.addEventListener('click', () => this.savePortfolio());
        document.getElementById('loadPortfolioBtn')?.addEventListener('click', () => this.loadPortfolio());
        document.getElementById('exportPortfolioBtn')?.addEventListener('click', () => this.exportPortfolio());
        
        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-remove')) {
                const assetRow = e.target.closest('.asset-row');
                if (assetRow) {
                    this.removeAsset(assetRow);
                }
            }
        });
        
        // Input validation
        document.addEventListener('input', (e) => {
            if (e.target.matches('.asset-amount, .asset-return, .asset-risk')) {
                this.validateAssetInput(e.target);
            }
        });
    }
    
    addInitialAsset() {
        // Initialize with one asset row
        const assetList = document.getElementById('assetList');
        if (assetList && assetList.children.length === 0) {
            this.addAsset();
        }
    }
    
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) return;
        
        const assetRow = document.createElement('div');
        assetRow.className = 'asset-row';
        assetRow.dataset.assetId = this.generateAssetId();
        
        assetRow.innerHTML = `
            <div class="asset-field">
                <label>Asset Naam</label>
                <input type="text" placeholder="bijv. Amerikaanse Aandelen" class="asset-name">
            </div>
            <div class="asset-field">
                <label>Valuta</label>
                <select class="asset-currency currency-selector">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CHF">CHF</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="CNY">CNY</option>
                </select>
            </div>
            <div class="asset-field">
                <label>Bedrag</label>
                <input type="number" placeholder="100000" class="asset-amount" min="0" step="1000">
                <div class="converted-value" style="display: none;"></div>
            </div>
            <div class="asset-field">
                <label>Rendement %</label>
                <input type="number" placeholder="7.5" class="asset-return" step="0.1">
            </div>
            <div class="asset-field">
                <label>Risico %</label>
                <input type="number" placeholder="15" class="asset-risk" min="0" max="100" step="1">
            </div>
            <button class="btn-remove" data-action="remove">×</button>
        `;
        
        assetList.appendChild(assetRow);
        
        if (window.app?.features?.currencyPortfolio?.updateCurrencySelectors) {
            window.app.features.currencyPortfolio.updateCurrencySelectors();
        }
    }
    
    removeAsset(assetRowOrId) {
        let assetRow;
        
        if (typeof assetRowOrId === 'string') {
            assetRow = document.querySelector(`[data-asset-id="${assetRowOrId}"]`);
        } else {
            assetRow = assetRowOrId;
        }
        
        if (!assetRow) return;
        
        const assetList = document.getElementById('assetList');
        const remainingAssets = assetList.querySelectorAll('.asset-row').length;
        
        // Keep at least one asset
        if (remainingAssets > 1) {
            assetRow.remove();
        } else {
            this.showError('U moet minimaal één asset hebben');
        }
    }
    
    validateAssetInput(input) {
        const value = parseFloat(input.value);
        const isValid = !isNaN(value) && value >= 0;
        
        input.classList.toggle('is-invalid', !isValid && input.value !== '');
    }
    
    collectAssets() {
        const assetRows = document.querySelectorAll('.asset-row');
        const assets = [];
        
        assetRows.forEach(row => {
            const name = row.querySelector('.asset-name').value;
            const currency = row.querySelector('.asset-currency').value;
            const amount = parseFloat(row.querySelector('.asset-amount').value) || 0;
            const expectedReturn = parseFloat(row.querySelector('.asset-return').value) || 0;
            const risk = parseFloat(row.querySelector('.asset-risk').value) || 0;
            
            if (name && amount > 0) {
                assets.push({
                    id: row.dataset.assetId,
                    name,
                    currency,
                    amount,
                    expectedReturn,
                    risk
                });
            }
        });
        
        this.assets = assets;
        return assets;
    }
    
    calculatePortfolio() {
        this.assets = this.collectAssets();
        
        if (this.assets.length === 0) {
            this.showError('Voer minimaal één asset in met een bedrag');
            return;
        }
        
        // Calculate portfolio metrics
        const totalValue = this.assets.reduce((sum, asset) => sum + asset.amount, 0);
        
        this.assets.forEach(asset => {
            asset.weight = asset.amount / totalValue;
            asset.contribution = asset.weight * asset.expectedReturn;
        });
        
        const portfolioReturn = this.assets.reduce((sum, asset) => sum + asset.contribution, 0);
        const portfolioRisk = this.calculatePortfolioRisk();
        const sharpeRatio = this.calculateSharpeRatio(portfolioReturn, portfolioRisk);
        
        // Store portfolio data
        this.portfolioData = {
            assets: this.assets,
            totalValue,
            expectedReturn: portfolioReturn,
            risk: portfolioRisk,
            sharpeRatio,
            timestamp: new Date().toISOString()
        };
        
        // Update display
        this.displayResults();
        this.updateCharts();
        
        // Enable portfolio management buttons
        const optimizeBtn = document.getElementById('optimizePortfolioBtn');
        const saveBtn = document.getElementById('savePortfolioBtn');
        const exportBtn = document.getElementById('exportPortfolioBtn');
        
        if (optimizeBtn) optimizeBtn.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
        
        this.showSuccess('Portfolio berekening voltooid');
    }
    
    calculatePortfolioRisk() {
        if (!this.assets || this.assets.length === 0) return 0;
        
        // Simplified risk calculation (assumes no correlation)
        // In reality, you'd need a correlation matrix
        let variance = 0;
        
        this.assets.forEach(asset => {
            if (typeof asset.weight === 'undefined') {
                const totalValue = this.assets.reduce((sum, a) => sum + a.amount, 0);
                asset.weight = asset.amount / totalValue;
            }
            variance += Math.pow(asset.weight * asset.risk / 100, 2);
        });
        
        return Math.sqrt(variance) * 100;
    }
    
    calculateSharpeRatio(return_, risk, riskFreeRate = 2) {
        if (risk === 0) return 0;
        return (return_ - riskFreeRate) / risk;
    }
    
    displayResults() {
        const resultsDiv = document.getElementById('portfolioResults');
        if (!resultsDiv || !this.portfolioData) return;
        
        const { totalValue, expectedReturn, risk, sharpeRatio } = this.portfolioData;
        
        // Update Portfolio Performance KPI cards
        const portfolioValueCard = document.getElementById('portfolioWaarde');
        const weightedReturnCard = document.getElementById('portfolioRendement');
        const portfolioRiskCard = document.getElementById('portfolioRisico');
        
        if (portfolioValueCard) {
            portfolioValueCard.textContent = `€ ${totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`;
        }
        if (weightedReturnCard) {
            weightedReturnCard.textContent = `${expectedReturn.toFixed(2)}%`;
        }
        if (portfolioRiskCard) {
            portfolioRiskCard.textContent = `${risk.toFixed(2)}%`;
        }
        
        // Update detailed metrics
        const metricsDiv = document.getElementById('portfolioMetrics');
        if (metricsDiv) {
            metricsDiv.innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">Sharpe Ratio:</span>
                    <span class="metric-value">${sharpeRatio.toFixed(3)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Verwacht Jaarrendement:</span>
                    <span class="metric-value">€ ${(totalValue * expectedReturn / 100).toLocaleString('nl-NL', { minimumFractionDigits: 0 })}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Risicoclassificatie:</span>
                    <span class="metric-value ${risk < 10 ? 'text-success' : risk < 20 ? 'text-warning' : 'text-danger'}">${risk < 10 ? 'Laag' : risk < 20 ? 'Gemiddeld' : 'Hoog'}</span>
                </div>
            `;
        }
        
        // Update allocation breakdown
        const allocationDiv = document.getElementById('allocationBreakdown');
        if (allocationDiv) {
            allocationDiv.innerHTML = this.assets.map(asset => `
                <div class="allocation-item">
                    <div class="allocation-header">
                        <span class="asset-name">${asset.name}</span>
                        <span class="asset-weight">${(asset.weight * 100).toFixed(1)}%</span>
                    </div>
                    <div class="allocation-details">
                        <span>€ ${asset.amount.toLocaleString('nl-NL')} (${asset.currency})</span>
                        <span>Rendement: ${asset.expectedReturn}%</span>
                        <span>Risico: ${asset.risk}%</span>
                    </div>
                </div>
            `).join('');
        }
        
        resultsDiv.style.display = 'block';
    }
    
    updateCharts() {
        if (this.chartManager && this.portfolioData && this.assets) {
            // Update portfolio chart with current data
            if (typeof this.chartManager.updatePortfolioChart === 'function') {
                this.chartManager.updatePortfolioChart(this.assets);
            } else {
                console.warn('updatePortfolioChart method not available on chartManager');
                this.createPortfolioChart();
            }
        }
    }
    
    createPortfolioChart() {
        if (!this.portfolioData || !this.assets) return;
        
        const chartContainer = document.getElementById('portfolioChart');
        if (!chartContainer) return;
        
        // Simple pie chart implementation for asset distribution
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        
        let chartHTML = '<div class="simple-pie-chart" style="display: flex; flex-direction: column; gap: 10px;">';
        this.assets.forEach((asset, index) => {
            const color = colors[index % colors.length];
            const percentage = (asset.weight * 100).toFixed(1);
            chartHTML += `
                <div class="chart-segment" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: ${color}20; border-left: 4px solid ${color}; border-radius: 4px;">
                    <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 50%;"></div>
                    <span class="segment-label" style="font-weight: 500;">${asset.name}: ${percentage}%</span>
                </div>
            `;
        });
        chartHTML += '</div>';
        
        chartContainer.innerHTML = chartHTML;
    }
    
    optimizePortfolio() {
        if (!this.portfolioData) return;
        
        this.showInfo('Portfolio optimalisatie wordt uitgevoerd...');
        
        // Simplified optimization (maximize Sharpe ratio)
        // In reality, you'd use quadratic programming
        setTimeout(() => {
            const optimizedWeights = this.calculateOptimalWeights();
            this.applyOptimizedWeights(optimizedWeights);
            this.calculatePortfolio();
            this.showSuccess('Portfolio geoptimaliseerd voor maximale Sharpe ratio');
        }, 1000);
    }
    
    calculateOptimalWeights() {
        // Simplified optimization logic
        // Real implementation would use mean-variance optimization
        const weights = [];
        const n = this.assets.length;
        
        this.assets.forEach((asset, i) => {
            // Simple heuristic: weight by return/risk ratio
            const score = asset.expectedReturn / (asset.risk || 1);
            weights.push(score);
        });
        
        // Normalize weights
        const sum = weights.reduce((a, b) => a + b, 0);
        return weights.map(w => w / sum);
    }
    
    applyOptimizedWeights(weights) {
        const totalValue = this.portfolioData.totalValue;
        
        this.assets.forEach((asset, i) => {
            asset.amount = weights[i] * totalValue;
            
            // Update UI
            const row = document.querySelector(`[data-asset-id="${asset.id}"]`);
            if (row) {
                row.querySelector('.asset-amount').value = Math.round(asset.amount);
            }
        });
    }
    
    // Integration with DataService
    savePortfolio() {
        if (!this.portfolioData) {
            this.showError('Bereken eerst het portfolio voordat u het opslaat');
            return;
        }
        
        const name = prompt('Geef een naam voor dit portfolio:');
        if (!name || name.trim() === '') return;
        
        const portfolioToSave = {
            name: name.trim(),
            ...this.portfolioData,
            savedAt: new Date().toISOString()
        };
        
        // Use DataService if available, otherwise use local method
        if (this.dataService && this.useDataService) {
            const success = this.dataService.savePortfolio(portfolioToSave);
            if (success) {
                this.showSuccess('Portfolio opgeslagen via DataService');
                this.invalidateSavedPortfoliosCache();
                
                // Emit event
                const event = new CustomEvent('portfolioSaved', { 
                    detail: { portfolio: portfolioToSave } 
                });
                document.dispatchEvent(event);
            } else {
                this.showError('Fout bij het opslaan van portfolio');
            }
        } else {
            // Fallback to local storage
            this.savePortfolioLocally(portfolioToSave);
        }
    }
    
    savePortfolioLocally(portfolio) {
        try {
            const savedPortfolios = this.getLocalSavedPortfolios();
            savedPortfolios.push({
                ...portfolio,
                id: this.generateAssetId()
            });
            
            // Keep only last 20 portfolios
            if (savedPortfolios.length > 20) {
                savedPortfolios.shift();
            }
            
            localStorage.setItem('roi_calculator_portfolios', JSON.stringify(savedPortfolios));
            this.showSuccess('Portfolio lokaal opgeslagen');
        } catch (error) {
            console.error('Error saving portfolio locally:', error);
            this.showError('Fout bij het opslaan van portfolio');
        }
    }
    
    getLocalSavedPortfolios() {
        try {
            const saved = localStorage.getItem('roi_calculator_portfolios');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error reading saved portfolios:', error);
            return [];
        }
    }
    
    loadSavedPortfoliosFromDataService() {
        if (!this.dataService) return [];
        
        try {
            const portfolios = this.dataService.loadPortfolios();
            this.savedPortfoliosCache = portfolios || [];
            return this.savedPortfoliosCache;
        } catch (error) {
            console.error('Error loading portfolios from DataService:', error);
            this.savedPortfoliosCache = [];
            return this.savedPortfoliosCache;
        }
    }
    
    invalidateSavedPortfoliosCache() {
        this.savedPortfoliosCache = null;
    }
    
    loadPortfolio() {
        const savedPortfolios = this.dataService && this.useDataService
            ? this.loadSavedPortfoliosFromDataService()
            : this.getLocalSavedPortfolios();
        
        if (!savedPortfolios || savedPortfolios.length === 0) {
            this.showError('Geen opgeslagen portfolios gevonden');
            return;
        }
        
        // Create and show dialog
        const dialog = document.createElement('div');
        dialog.className = 'portfolio-load-dialog';
        dialog.innerHTML = `
            <div class="dialog-backdrop"></div>
            <div class="dialog-content">
                <h4>Selecteer een Portfolio</h4>
                <div class="portfolio-list">
                    ${savedPortfolios.map(p => `
                        <div class="portfolio-item" data-portfolio-id="${p.id}">
                            <div class="portfolio-name">${p.name}</div>
                            <div class="portfolio-info">
                                <span>${formatNumber(p.totalValue)}</span>
                                <span>${formatPercentage(p.expectedReturn)}</span>
                                <span>${new Date(p.savedAt || p.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary cancel-btn">Annuleren</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event handlers
        dialog.addEventListener('click', (e) => {
            if (e.target.classList.contains('dialog-backdrop') || 
                e.target.classList.contains('cancel-btn')) {
                dialog.remove();
            }
            
            const portfolioItem = e.target.closest('.portfolio-item');
            if (portfolioItem) {
                const portfolioId = portfolioItem.dataset.portfolioId;
                const portfolio = savedPortfolios.find(p => p.id === portfolioId);
                if (portfolio) {
                    this.loadPortfolioData(portfolio);
                    dialog.remove();
                }
            }
        });
    }
    
    loadPortfolioData(portfolioData) {
        try {
            const assets = portfolioData.assets;
            if (!assets || assets.length === 0) {
                this.showError('Portfolio bevat geen assets');
                return;
            }
            
            // Clear existing assets except first
            const assetList = document.getElementById('assetList');
            while (assetList.children.length > 1) {
                assetList.lastElementChild.remove();
            }
            
            // Load assets
            assets.forEach((asset, index) => {
                if (index === 0) {
                    // Update first row
                    const firstRow = assetList.firstElementChild;
                    firstRow.dataset.assetId = asset.id;
                    firstRow.querySelector('.asset-name').value = asset.name;
                    firstRow.querySelector('.asset-currency').value = asset.currency || 'EUR';
                    firstRow.querySelector('.asset-amount').value = asset.amount;
                    firstRow.querySelector('.asset-return').value = asset.expectedReturn;
                    firstRow.querySelector('.asset-risk').value = asset.risk;
                } else {
                    // Add new rows
                    this.addAsset();
                    const newRow = assetList.lastElementChild;
                    newRow.dataset.assetId = asset.id;
                    newRow.querySelector('.asset-name').value = asset.name;
                    newRow.querySelector('.asset-currency').value = asset.currency || 'EUR';
                    newRow.querySelector('.asset-amount').value = asset.amount;
                    newRow.querySelector('.asset-return').value = asset.expectedReturn;
                    newRow.querySelector('.asset-risk').value = asset.risk;
                }
            });
            
            // Trigger portfolio loaded event
            const event = new CustomEvent('portfolioLoaded', { 
                detail: { assets: assets } 
            });
            document.dispatchEvent(event);
            
            // Recalculate portfolio
            this.calculatePortfolio();
            
            this.showSuccess(`Portfolio "${portfolioData.name}" geladen`);
        } catch (error) {
            console.error('Error loading portfolio:', error);
            this.showError('Fout bij het laden van portfolio');
        }
    }
    
    exportPortfolio() {
        if (!this.portfolioData) {
            this.showError('Geen portfolio om te exporteren');
            return;
        }
        
        const exportData = {
            portfolio: this.portfolioData,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccess('Portfolio geëxporteerd');
    }
    
    refresh() {
        // Reload saved portfolios if using DataService
        if (this.dataService && this.useDataService) {
            this.invalidateSavedPortfoliosCache();
            this.loadSavedPortfoliosFromDataService();
        }
        
        // Recalculate if we have data
        if (this.assets.length > 0) {
            this.calculatePortfolio();
        }
    }
    
    generateAssetId() {
        return 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    showError(message) {
        this.showToast('error', 'Fout: ' + message);
    }
    
    showSuccess(message) {
        this.showToast('success', 'Succes: ' + message);
    }
    
    showInfo(message) {
        this.showToast('info', message);
    }
    
    showToast(type, message) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
