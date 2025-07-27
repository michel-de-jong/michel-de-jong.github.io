// Portfolio Feature - Multi-asset portfolio analysis with optimization
// Complete implementation with error handling and fixes

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
        this.initialized = false;
        
        // Bind methods to preserve context
        this.addAsset = this.addAsset.bind(this);
        this.removeAsset = this.removeAsset.bind(this);
        this.calculatePortfolio = this.calculatePortfolio.bind(this);
        this.optimizePortfolio = this.optimizePortfolio.bind(this);
        this.savePortfolio = this.savePortfolio.bind(this);
        this.loadPortfolio = this.loadPortfolio.bind(this);
        this.exportPortfolio = this.exportPortfolio.bind(this);
    }
    
    initialize() {
        console.log('Initializing Portfolio Feature');
        
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
        console.log('Initializing portfolio UI');
        
        // Check if we're on the portfolio tab
        const portfolioSection = document.getElementById('portfolio');
        if (portfolioSection) {
            this.addInitialAsset();
            
            // Load saved portfolios if DataService is available
            if (this.dataService && this.useDataService) {
                this.loadSavedPortfoliosFromDataService();
            }
            
            this.initialized = true;
        }
    }
    
    setupEventListeners() {
        console.log('Setting up portfolio event listeners');
        
        // Portfolio builder events
        const addAssetBtn = document.getElementById('addAssetBtn');
        const calculatePortfolioBtn = document.getElementById('calculatePortfolioBtn');
        const optimizePortfolioBtn = document.getElementById('optimizePortfolioBtn');
        const savePortfolioBtn = document.getElementById('savePortfolioBtn');
        const loadPortfolioBtn = document.getElementById('loadPortfolioBtn');
        const exportPortfolioBtn = document.getElementById('exportPortfolioBtn');
        
        // Add event listeners with proper error handling
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.addAsset();
                } catch (error) {
                    console.error('Error adding asset:', error);
                    this.showError('Fout bij het toevoegen van asset');
                }
            });
        }
        
        if (calculatePortfolioBtn) {
            calculatePortfolioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculatePortfolio();
            });
        }
        
        if (optimizePortfolioBtn) {
            optimizePortfolioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.optimizePortfolio();
            });
        }
        
        if (savePortfolioBtn) {
            savePortfolioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePortfolio();
            });
        }
        
        if (loadPortfolioBtn) {
            loadPortfolioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadPortfolio();
            });
        }
        
        if (exportPortfolioBtn) {
            exportPortfolioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportPortfolio();
            });
        }
        
        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            // Handle remove button clicks
            if (e.target.matches('.btn-remove') || e.target.closest('.btn-remove')) {
                e.preventDefault();
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
    
    generateAssetId() {
        return 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    addInitialAsset() {
        const assetList = document.getElementById('assetList');
        if (assetList) {
            assetList.innerHTML = '';
            this.addAsset();
        }
    }
    
    addAsset() {
        try {
            const assetList = document.getElementById('assetList');
            if (!assetList) {
                console.error('Asset list element not found');
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
            
            // Trigger event for currency portfolio feature
            const event = new CustomEvent('assetAdded', { 
                detail: { assetId: assetRow.dataset.assetId } 
            });
            document.dispatchEvent(event);
            
            console.log('Asset added successfully');
        } catch (error) {
            console.error('Error in addAsset:', error);
            this.showError('Fout bij het toevoegen van asset');
        }
    }
    
    removeAsset(assetRow) {
        if (!assetRow) return;
        
        const assetList = document.getElementById('assetList');
        const remainingAssets = assetList.querySelectorAll('.asset-row').length;
        
        if (remainingAssets > 1) {
            assetRow.remove();
            this.showSuccess('Asset verwijderd');
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
            const name = row.querySelector('.asset-name').value.trim();
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
        try {
            console.log('Calculating portfolio');
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
            this.enablePortfolioButtons();
            
            this.showSuccess('Portfolio berekening voltooid');
        } catch (error) {
            console.error('Error calculating portfolio:', error);
            this.showError('Fout bij het berekenen van portfolio');
        }
    }
    
    calculatePortfolioRisk() {
        if (!this.assets || this.assets.length === 0) return 0;
        
        // Simplified risk calculation (assumes no correlation)
        let variance = 0;
        
        this.assets.forEach(asset => {
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
        
        // Show results section
        const resultsDiv = document.getElementById('portfolioResults');
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
        }
        
        // Update KPI cards
        const waardeEl = document.getElementById('portfolioWaarde');
        const rendementEl = document.getElementById('portfolioRendement');
        const risicoEl = document.getElementById('portfolioRisico');
        
        if (waardeEl) waardeEl.textContent = formatNumber(this.portfolioData.totalValue);
        if (rendementEl) rendementEl.textContent = formatPercentage(this.portfolioData.expectedReturn);
        if (risicoEl) risicoEl.textContent = formatPercentage(this.portfolioData.risk);
        
        // Update detailed metrics
        const metricsDiv = document.getElementById('portfolioMetrics');
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
    }
    
    updateCharts() {
        if (this.chartManager && this.portfolioData && this.assets) {
            if (typeof this.chartManager.updatePortfolioChart === 'function') {
                this.chartManager.updatePortfolioChart(this.assets);
            } else {
                console.log('Chart manager does not have updatePortfolioChart method');
                this.createBasicChart();
            }
        }
    }
    
    createBasicChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas || !window.Chart) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if any
        if (this.portfolioChart) {
            this.portfolioChart.destroy();
        }
        
        // Create pie chart
        this.portfolioChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: this.assets.map(a => a.name),
                datasets: [{
                    data: this.assets.map(a => a.amount),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${label}: €${value.toLocaleString('nl-NL')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    async optimizePortfolio() {
        try {
            if (!this.portfolioData || this.assets.length === 0) {
                this.showError('Bereken eerst het portfolio voordat u optimaliseert');
                return;
            }
            
            this.showInfo('Portfolio optimalisatie wordt uitgevoerd...');
            
            // Simulate optimization process
            setTimeout(() => {
                try {
                    const optimizedWeights = this.calculateOptimalWeights();
                    this.applyOptimizedWeights(optimizedWeights);
                    this.calculatePortfolio();
                    this.showSuccess('Portfolio is geoptimaliseerd voor maximaal rendement/risico verhouding');
                } catch (error) {
                    console.error('Error during optimization:', error);
                    this.showError('Fout tijdens optimalisatie');
                }
            }, 1000);
        } catch (error) {
            console.error('Error optimizing portfolio:', error);
            this.showError('Fout bij het optimaliseren van portfolio');
        }
    }
    
    calculateOptimalWeights() {
        // Simplified optimization using Sharpe ratio
        const weights = [];
        
        this.assets.forEach((asset) => {
            const score = asset.risk > 0 ? asset.expectedReturn / asset.risk : 0;
            weights.push(score);
        });
        
        // Normalize weights
        const sum = weights.reduce((a, b) => a + b, 0);
        return sum > 0 ? weights.map(w => w / sum) : weights.map(() => 1 / this.assets.length);
    }
    
    applyOptimizedWeights(weights) {
        const totalValue = this.portfolioData.totalValue;
        
        this.assets.forEach((asset, i) => {
            asset.amount = Math.round(weights[i] * totalValue);
            
            // Update UI
            const row = document.querySelector(`[data-asset-id="${asset.id}"]`);
            if (row) {
                const amountInput = row.querySelector('.asset-amount');
                if (amountInput) {
                    amountInput.value = asset.amount;
                }
            }
        });
    }
    
    savePortfolio() {
        if (!this.portfolioData) {
            this.showError('Bereken eerst het portfolio voordat u het opslaat');
            return;
        }
        
        const name = prompt('Geef een naam voor dit portfolio:');
        if (!name || name.trim() === '') return;
        
        const portfolioToSave = {
            id: this.generateAssetId(),
            name: name.trim(),
            ...this.portfolioData,
            savedAt: new Date().toISOString()
        };
        
        // Use DataService if available, otherwise use localStorage
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
            saved.push(portfolio);
            localStorage.setItem('savedPortfolios', JSON.stringify(saved));
            this.showSuccess(`Portfolio "${portfolio.name}" opgeslagen`);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showError('Fout bij het opslaan van portfolio');
        }
    }
    
    getLocalSavedPortfolios() {
        try {
            const saved = localStorage.getItem('savedPortfolios');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    }
    
    async loadSavedPortfoliosFromDataService() {
        if (!this.dataService || !this.useDataService) return;
        
        try {
            const portfolios = await this.dataService.loadPortfolios();
            this.savedPortfoliosCache = portfolios || [];
        } catch (error) {
            console.error('Error loading portfolios from DataService:', error);
            this.savedPortfoliosCache = [];
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
        this.showPortfolioLoadDialog(savedPortfolios);
    }
    
    showPortfolioLoadDialog(savedPortfolios) {
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
                                <span>€ ${formatNumber(p.totalValue)}</span>
                                <span>${formatPercentage(p.expectedReturn)}</span>
                                <span>${new Date(p.savedAt || p.timestamp).toLocaleDateString('nl-NL')}</span>
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
            
            // Clear existing assets
            const assetList = document.getElementById('assetList');
            assetList.innerHTML = '';
            
            // Load assets
            assets.forEach((asset) => {
                this.addAsset();
                const newRow = assetList.lastElementChild;
                if (newRow) {
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
    
    enablePortfolioButtons() {
        const optimizeBtn = document.getElementById('optimizePortfolioBtn');
        const saveBtn = document.getElementById('savePortfolioBtn');
        const exportBtn = document.getElementById('exportPortfolioBtn');
        
        if (optimizeBtn) optimizeBtn.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
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
    
    // UI Helper methods
    showError(message) {
        this.showToast('error', message);
    }
    
    showSuccess(message) {
        this.showToast('success', message);
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
            font-size: 14px;
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