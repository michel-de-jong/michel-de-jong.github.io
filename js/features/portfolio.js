// Portfolio Feature Module - Enhanced with DataService Integration
import { formatNumber, formatPercentage } from '../utils/format-utils.js';

export class PortfolioFeature {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.assets = [];
        this.portfolioData = null;
        this.dataService = null; // Will be set by main app
        this.listeners = [];
        
        // Performance: Track if we're using DataService or local storage
        this.useDataService = true;
        
        // Cache for saved portfolios
        this.savedPortfoliosCache = null;
        this.cacheTimestamp = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    // Set DataService for integration
    setDataService(dataService) {
        this.dataService = dataService;
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM
        setTimeout(() => {
            this.attachEventListeners();
            this.initializeAssets();
            
            // Load saved portfolios if DataService is available
            if (this.dataService) {
                this.loadSavedPortfoliosFromDataService();
            }
        }, 100);
    }
    
    attachEventListeners() {
        // Add asset button
        const addAssetBtn = document.getElementById('addAssetBtn');
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => this.addAsset());
        }
        
        // Calculate portfolio button
        const calculateBtn = document.getElementById('calculatePortfolioBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculatePortfolio());
        }
        
        // Optimize portfolio button
        const optimizeBtn = document.getElementById('optimizePortfolioBtn');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizePortfolio());
        }
        
        // Save portfolio button
        const saveBtn = document.getElementById('savePortfolioBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePortfolio());
        }
        
        // Load portfolio button
        const loadBtn = document.getElementById('loadPortfolioBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.showLoadDialog());
        }
        
        // Export portfolio button
        const exportBtn = document.getElementById('exportPortfolioBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPortfolio());
        }
        
        // Asset list delegation
        const assetList = document.getElementById('assetList');
        if (assetList) {
            assetList.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-asset')) {
                    this.removeAsset(e.target.closest('.asset-row'));
                }
            });
            
            assetList.addEventListener('change', (e) => {
                if (e.target.classList.contains('asset-input')) {
                    this.validateAssetInput(e.target);
                }
            });
        }
    }
    
    initializeAssets() {
        // Start with 3 default assets
        for (let i = 0; i < 3; i++) {
            this.addAsset();
        }
    }
    
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) return;
        
        const assetId = this.generateAssetId();
        const assetRow = document.createElement('div');
        assetRow.className = 'asset-row';
        assetRow.dataset.assetId = assetId;
        
        assetRow.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <input type="text" class="form-control asset-input asset-name" 
                           placeholder="Asset naam" value="">
                </div>
                <div class="col-md-2">
                    <select class="form-control asset-input asset-currency">
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
                <div class="col-md-2">
                    <input type="number" class="form-control asset-input asset-amount" 
                           placeholder="Bedrag" step="1000" min="0">
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control asset-input asset-return" 
                           placeholder="Verwacht rendement %" step="0.1">
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control asset-input asset-risk" 
                           placeholder="Risico (σ) %" step="0.1" min="0">
                </div>
                <div class="col-md-1">
                    <button class="btn btn-danger remove-asset" type="button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        assetList.appendChild(assetRow);
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
        
        // Enable optimization button
        const optimizeBtn = document.getElementById('optimizePortfolioBtn');
        if (optimizeBtn) {
            optimizeBtn.disabled = false;
        }
    }
    
    calculatePortfolioRisk() {
        // Simplified risk calculation (assumes no correlation)
        // In reality, you'd need a correlation matrix
        let variance = 0;
        
        this.assets.forEach(asset => {
            variance += Math.pow(asset.weight * asset.risk, 2);
        });
        
        return Math.sqrt(variance);
    }
    
    calculateSharpeRatio(return_, risk, riskFreeRate = 2) {
        if (risk === 0) return 0;
        return (return_ - riskFreeRate) / risk;
    }
    
    displayResults() {
        const resultsDiv = document.getElementById('portfolioResults');
        if (!resultsDiv || !this.portfolioData) return;
        
        const { totalValue, expectedReturn, risk, sharpeRatio } = this.portfolioData;
        
        resultsDiv.innerHTML = `
            <div class="portfolio-metrics">
                <div class="metric">
                    <h5>Totale Waarde</h5>
                    <p class="metric-value">${formatNumber(totalValue)}</p>
                </div>
                <div class="metric">
                    <h5>Verwacht Rendement</h5>
                    <p class="metric-value">${formatPercentage(expectedReturn)}</p>
                </div>
                <div class="metric">
                    <h5>Portfolio Risico</h5>
                    <p class="metric-value">${formatPercentage(risk)}</p>
                </div>
                <div class="metric">
                    <h5>Sharpe Ratio</h5>
                    <p class="metric-value">${sharpeRatio.toFixed(2)}</p>
                </div>
            </div>
            
            <div class="asset-breakdown mt-4">
                <h5>Asset Verdeling</h5>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Valuta</th>
                            <th>Bedrag</th>
                            <th>Gewicht</th>
                            <th>Bijdrage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.assets.map(asset => `
                            <tr>
                                <td>${asset.name}</td>
                                <td>${asset.currency}</td>
                                <td>${formatNumber(asset.amount)}</td>
                                <td>${formatPercentage(asset.weight * 100)}</td>
                                <td>${formatPercentage(asset.contribution)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }
    
    updateCharts() {
        if (!this.portfolioData) return;
        
        // Allocation chart
        this.chartManager.updatePortfolioChart(this.portfolioData);
        
        // Risk-return scatter
        this.chartManager.updateRiskReturnChart(this.portfolioData);
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
            console.error('Error loading local portfolios:', error);
            return [];
        }
    }
    
    // Load portfolios from DataService
    loadSavedPortfoliosFromDataService() {
        if (!this.dataService) return;
        
        // Check cache first
        if (this.savedPortfoliosCache && this.cacheTimestamp) {
            const cacheAge = Date.now() - this.cacheTimestamp;
            if (cacheAge < this.cacheTimeout) {
                return this.savedPortfoliosCache;
            }
        }
        
        try {
            const portfolios = this.dataService.loadPortfolios();
            this.savedPortfoliosCache = portfolios;
            this.cacheTimestamp = Date.now();
            return portfolios;
        } catch (error) {
            console.error('Error loading portfolios from DataService:', error);
            return [];
        }
    }
    
    invalidateSavedPortfoliosCache() {
        this.savedPortfoliosCache = null;
        this.cacheTimestamp = null;
    }
    
    // Method for main app to set portfolios
    setPortfolios(portfolios) {
        this.savedPortfoliosCache = portfolios;
        this.cacheTimestamp = Date.now();
    }
    
    // Method for main app to load saved portfolios
    loadSavedPortfolios(portfolios) {
        if (portfolios && portfolios.length > 0) {
            this.savedPortfoliosCache = portfolios;
            this.cacheTimestamp = Date.now();
        }
    }
    
    showLoadDialog() {
        // Get saved portfolios from DataService or local storage
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
                    this.loadPortfolio(portfolio);
                    dialog.remove();
                }
            }
        });
    }
    
    loadPortfolio(portfolioData) {
        try {
            // Clear existing assets
            const assetList = document.getElementById('assetList');
            if (assetList) {
                assetList.innerHTML = '';
                
                // Get first row to update
                let firstRow = assetList.querySelector('.asset-row');
                
                // If no rows exist, add first one
                if (!firstRow) {
                    this.addAsset();
                    firstRow = assetList.querySelector('.asset-row');
                }
                
                // Ensure first row is cleared
                if (firstRow) {
                    firstRow.querySelector('.asset-name').value = '';
                    firstRow.querySelector('.asset-currency').value = 'EUR';
                    firstRow.querySelector('.asset-amount').value = '';
                    firstRow.querySelector('.asset-return').value = '';
                    firstRow.querySelector('.asset-risk').value = '';
                }
                
                // Handle both old and new data structures
                const assets = portfolioData.assets || portfolioData.items || [];
                
                // Add saved assets
                assets.forEach((asset, index) => {
                    if (index === 0 && firstRow) {
                        // Update first row
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
            }
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
        // Could be replaced with toast notification
        alert('Fout: ' + message);
    }
    
    showSuccess(message) {
        // Could be replaced with toast notification
        alert('Succes: ' + message);
    }
    
    showInfo(message) {
        // Could be replaced with toast notification
    }
}
