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
        // Wait for DOM to be ready before setting up event listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.initializePortfolio();
            });
        } else {
            // DOM is already ready
            this.setupEventListeners();
            this.initializePortfolio();
        }
    }
    
    initializePortfolio() {
        // Check if we're on the portfolio tab
        const portfolioSection = document.getElementById('portfolio');
        if (portfolioSection) {
            this.addInitialAsset();
            
            // Load saved portfolios if DataService is available
            if (this.dataService && this.useDataService) {
                this.loadSavedPortfoliosFromDataService();
            }
        }
    }
    
    setupEventListeners() {
        // Portfolio builder events - use arrow functions to preserve 'this' context
        const addAssetBtn = document.getElementById('addAssetBtn');
        const calculatePortfolioBtn = document.getElementById('calculatePortfolioBtn');
        const optimizePortfolioBtn = document.getElementById('optimizePortfolioBtn');
        const savePortfolioBtn = document.getElementById('savePortfolioBtn');
        const loadPortfolioBtn = document.getElementById('loadPortfolioBtn');
        const exportPortfolioBtn = document.getElementById('exportPortfolioBtn');
        
        // Check if buttons exist before adding listeners
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => this.addAsset());
        }
        if (calculatePortfolioBtn) {
            calculatePortfolioBtn.addEventListener('click', () => this.calculatePortfolio());
        }
        if (optimizePortfolioBtn) {
            optimizePortfolioBtn.addEventListener('click', () => this.optimizePortfolio());
        }
        if (savePortfolioBtn) {
            savePortfolioBtn.addEventListener('click', () => this.savePortfolio());
        }
        if (loadPortfolioBtn) {
            loadPortfolioBtn.addEventListener('click', () => this.loadPortfolio());
        }
        if (exportPortfolioBtn) {
            exportPortfolioBtn.addEventListener('click', () => this.exportPortfolio());
        }
        
        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-remove') || e.target.closest('.btn-remove')) {
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
    
    // Move generateAssetId to the top for better organization
    generateAssetId() {
        return 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    addInitialAsset() {
        // Clear any existing static asset rows and add a fresh one
        const assetList = document.getElementById('assetList');
        if (assetList) {
            assetList.innerHTML = '';
            this.addAsset();
        }
    }
    
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) {
            console.warn('Asset list element not found');
            return;
        }
        
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
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NZD">NZD - New Zealand Dollar</option>
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
            <button class="btn-remove" data-action="remove" type="button">×</button>
        `;
        
        assetList.appendChild(assetRow);
        
        // Trigger currency update if currency portfolio feature is available
        const event = new CustomEvent('assetAdded', { detail: { assetId: assetRow.dataset.assetId } });
        document.dispatchEvent(event);
    }
    
    removeAsset(assetRow) {
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
    
    calculateSharpeRatio(returnRate, risk, riskFreeRate = 2) {
        if (risk === 0) return 0;
        return (returnRate - riskFreeRate) / risk;
    }
    
    displayResults() {
        if (!this.portfolioData) return;
        
        // Update KPI cards
        const waardeEl = document.getElementById('portfolioWaarde');
        const rendementEl = document.getElementById('portfolioRendement');
        const risicoEl = document.getElementById('portfolioRisico');
        
        if (waardeEl) waardeEl.textContent = formatNumber(this.portfolioData.totalValue);
        if (rendementEl) rendementEl.textContent = formatPercentage(this.portfolioData.expectedReturn);
        if (risicoEl) risicoEl.textContent = formatPercentage(this.portfolioData.risk);
        
        // Update detailed metrics
        const metricsDiv = document.getElementById('portfolioMetrics');
        const resultsDiv = document.getElementById('portfolioResults');
        
        if (metricsDiv) {
            const sharpe = this.portfolioData.sharpeRatio;
            const risk = this.portfolioData.risk;
            
            metricsDiv.innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">Sharpe Ratio:</span>
                    <span class="metric-value ${sharpe > 1 ? 'text-success' : sharpe > 0.5 ? 'text-warning' : 'text-danger'}">${sharpe.toFixed(2)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Diversificatie:</span>
                    <span class="metric-value">${this.assets.length} assets</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Risicoprofiel:</span>
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
        
        if (resultsDiv) resultsDiv.style.display = 'block';
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
        
        // Create a simple visualization if chartManager is not available
        console.log('Creating fallback portfolio chart');
    }
    
    async optimizePortfolio() {
        if (!this.portfolioData || this.assets.length === 0) {
            this.showError('Bereken eerst het portfolio voordat u optimaliseert');
            return;
        }
        
        this.showInfo('Portfolio optimalisatie wordt uitgevoerd...');
        
        // Simulate optimization process
        setTimeout(() => {
            const optimizedWeights = this.calculateOptimalWeights();
            this.applyOptimizedWeights(optimizedWeights);
            this.calculatePortfolio();
            this.showSuccess('Portfolio is geoptimaliseerd voor maximaal rendement/risico verhouding');
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
        if (this.useDataService && this.dataService) {
            this.saveToDataService(portfolioToSave);
        } else {
            this.saveToLocalStorage(portfolioToSave);
        }
    }
    
    async saveToDataService(portfolio) {
        try {
            await this.dataService.savePortfolio(portfolio);
            this.invalidateSavedPortfoliosCache();
            this.showSuccess(`Portfolio "${portfolio.name}" opgeslagen`);
        } catch (error) {
            console.error('Error saving portfolio:', error);
            this.showError('Fout bij het opslaan van portfolio');
        }
    }
    
    saveToLocalStorage(portfolio) {
        try {
            const saved = this.getLocalSavedPortfolios();
            saved.push({
                ...portfolio,
                id: this.generateAssetId()
            });
            localStorage.setItem('savedPortfolios', JSON.stringify(saved));
            this.showSuccess(`Portfolio "${portfolio.name}" lokaal opgeslagen`);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showError('Fout bij het lokaal opslaan van portfolio');
        }
    }
    
    getLocalSavedPortfolios() {
        try {
            const saved = localStorage.getItem('savedPortfolios');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }
    
    async loadSavedPortfoliosFromDataService() {
        if (!this.dataService || !this.useDataService) return;
        
        try {
            const portfolios = await this.dataService.getSavedPortfolios();
            this.savedPortfoliosCache = portfolios;
        } catch (error) {
            console.error('Error loading portfolios from DataService:', error);
        }
    }
    
    invalidateSavedPortfoliosCache() {
        this.savedPortfoliosCache = null;
    }
    
    async loadPortfolio() {
        const savedPortfolios = this.useDataService && this.savedPortfoliosCache 
            ? this.savedPortfoliosCache 
            : await (this.useDataService && this.dataService 
                ? this.loadSavedPortfoliosFromDataService() 
                : this.getLocalSavedPortfolios());
        
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