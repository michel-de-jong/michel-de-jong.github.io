// Portfolio Feature Module with Currency Support
import { formatNumber } from '../utils/format-utils.js';
import { generateId } from '../utils/calculation-utils.js';

export class PortfolioFeature {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.assets = [];
        this.portfolioMetrics = {
            totalValue: 0,
            weightedReturn: 0,
            portfolioRisk: 0
        };
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Add asset button
        const addBtn = document.getElementById('addAssetBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addAsset());
        }
        
        // Calculate button
        const calculateBtn = document.getElementById('calculatePortfolioBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
        
        // Delegate remove button clicks
        const assetList = document.getElementById('assetList');
        if (assetList) {
            assetList.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-remove') || 
                    e.target.dataset.action === 'remove') {
                    this.removeAsset(e.target);
                }
            });
            
            // Input changes
            assetList.addEventListener('input', (e) => {
                if (e.target.classList.contains('asset-name') ||
                    e.target.classList.contains('asset-amount') ||
                    e.target.classList.contains('asset-return') ||
                    e.target.classList.contains('asset-risk')) {
                    this.validateAssetInput(e.target);
                }
            });
        }
    }
    
    activate() {
        // Initialize chart if needed
        if (!this.chartManager.charts.portfolio) {
            const canvas = document.getElementById('portfolioChart');
            if (canvas) {
                this.chartManager.initPortfolioChart();
            }
        }
        
        // Load any saved portfolio
        this.loadSavedPortfolio();
    }
    
    addAsset() {
        const assetList = document.getElementById('assetList');
        if (!assetList) return;
        
        const assetId = generateId();
        const newAsset = document.createElement('div');
        newAsset.className = 'asset-row';
        newAsset.dataset.assetId = assetId;
        
        newAsset.innerHTML = `
            <div class="asset-field">
                <label>Asset Name</label>
                <input type="text" placeholder="e.g. US Stocks" class="asset-name">
            </div>
            <div class="asset-field">
                <label>Currency</label>
                <select class="asset-currency currency-selector">
                    <!-- Options populated by currency feature -->
                </select>
            </div>
            <div class="asset-field">
                <label>Amount</label>
                <input type="number" placeholder="100000" class="asset-amount" min="0" step="1000">
                <div class="converted-value" style="display: none;"></div>
            </div>
            <div class="asset-field">
                <label>Return %</label>
                <input type="number" placeholder="7.5" class="asset-return" step="0.1">
            </div>
            <div class="asset-field">
                <label>Risk %</label>
                <input type="number" placeholder="15" class="asset-risk" min="0" max="100" step="1">
            </div>
            <button class="btn-remove" data-action="remove">×</button>
        `;
        
        assetList.appendChild(newAsset);
        
        // Trigger currency selector update event
        const event = new CustomEvent('assetAdded', { 
            detail: { assetId, assetRow: newAsset } 
        });
        document.dispatchEvent(event);
        
        // Focus on name input
        const nameInput = newAsset.querySelector('.asset-name');
        if (nameInput) {
            nameInput.focus();
        }
    }
    
    removeAsset(button) {
        const assetRow = button.closest('.asset-row');
        if (!assetRow) return;
        
        const assetId = assetRow.dataset.assetId;
        
        // Animate removal
        assetRow.style.opacity = '0';
        assetRow.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            assetRow.remove();
            this.updateAssetsList();
            
            // Trigger removal event
            const event = new CustomEvent('assetRemoved', { 
                detail: { assetId } 
            });
            document.dispatchEvent(event);
        }, 300);
    }
    
    validateAssetInput(input) {
        const value = input.value;
        
        if (input.classList.contains('asset-amount')) {
            if (value && parseFloat(value) < 0) {
                input.value = 0;
            }
        } else if (input.classList.contains('asset-risk')) {
            if (value && parseFloat(value) < 0) {
                input.value = 0;
            } else if (value && parseFloat(value) > 100) {
                input.value = 100;
            }
        }
    }
    
    updateAssetsList() {
        const assetRows = document.querySelectorAll('.asset-row');
        this.assets = [];
        
        assetRows.forEach((row, index) => {
            const asset = {
                id: row.dataset.assetId || `asset-${index}`,
                name: row.querySelector('.asset-name')?.value || '',
                currency: row.querySelector('.asset-currency')?.value || 'EUR',
                amount: parseFloat(row.querySelector('.asset-amount')?.value) || 0,
                expectedReturn: parseFloat(row.querySelector('.asset-return')?.value) || 0,
                risk: parseFloat(row.querySelector('.asset-risk')?.value) || 0
            };
            
            if (asset.amount > 0) {
                this.assets.push(asset);
            }
        });
    }
    
    calculate() {
        this.updateAssetsList();
        
        if (this.assets.length === 0) {
            alert('Voeg eerst minimaal één asset toe met een bedrag.');
            return;
        }
        
        // Basic portfolio calculations (currency conversion handled by currency feature)
        let totalValue = 0;
        let weightedReturn = 0;
        let weightedRisk = 0;
        
        // First pass: calculate total value
        this.assets.forEach(asset => {
            totalValue += asset.amount;
        });
        
        if (totalValue === 0) {
            alert('De totale portfolio waarde moet groter dan 0 zijn.');
            return;
        }
        
        // Second pass: calculate weighted metrics
        this.assets.forEach(asset => {
            const weight = asset.amount / totalValue;
            weightedReturn += asset.expectedReturn * weight;
            weightedRisk += Math.pow(asset.risk * weight, 2);
        });
        
        // Portfolio risk (simplified - doesn't account for correlations)
        const portfolioRisk = Math.sqrt(weightedRisk);
        
        // Update metrics
        this.portfolioMetrics = {
            totalValue,
            weightedReturn,
            portfolioRisk
        };
        
        // Update displays (basic values, currency conversion handled by currency feature)
        document.getElementById('portfolioWaarde').textContent = `€ ${formatNumber(totalValue)}`;
        document.getElementById('portfolioRendement').textContent = `${weightedReturn.toFixed(2)}%`;
        document.getElementById('portfolioRisico').textContent = `${portfolioRisk.toFixed(2)}%`;
        
        // Update chart
        this.updatePortfolioChart();
        
        // Save portfolio
        this.savePortfolio();
        
        // Trigger calculation complete event for currency feature
        const event = new CustomEvent('portfolioCalculated', { 
            detail: { 
                assets: this.assets,
                metrics: this.portfolioMetrics 
            } 
        });
        document.dispatchEvent(event);
    }
    
    updatePortfolioChart() {
        if (!this.chartManager.charts.portfolio) {
            const canvas = document.getElementById('portfolioChart');
            if (canvas) {
                this.chartManager.initPortfolioChart();
            }
        }
        
        // Prepare data for pie chart
        const labels = this.assets.map(a => a.name || 'Unnamed Asset');
        const data = this.assets.map(a => a.amount);
        const backgroundColors = this.generateColors(this.assets.length);
        
        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };
        
        this.chartManager.updatePortfolioChart(chartData);
    }
    
    generateColors(count) {
        const colors = [
            '#1e3c72', '#2a5298', '#7e8ce0', '#36b3d1', '#48d1cc',
            '#f39c12', '#e74c3c', '#9b59b6', '#2ecc71', '#34495e'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        
        return result;
    }
    
    savePortfolio() {
        const portfolioData = {
            assets: this.assets,
            metrics: this.portfolioMetrics,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('roi_calculator_portfolio', JSON.stringify(portfolioData));
    }
    
    loadSavedPortfolio() {
        const saved = localStorage.getItem('roi_calculator_portfolio');
        if (!saved) return;
        
        try {
            const portfolioData = JSON.parse(saved);
            
            if (portfolioData.assets && portfolioData.assets.length > 0) {
                // Clear current assets
                const assetList = document.getElementById('assetList');
                if (!assetList) return;
                
                // Keep only the first row as template
                const firstRow = assetList.querySelector('.asset-row');
                assetList.innerHTML = '';
                if (firstRow) {
                    assetList.appendChild(firstRow);
                }
                
                // Add saved assets
                portfolioData.assets.forEach((asset, index) => {
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
                    detail: { assets: portfolioData.assets } 
                });
                document.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error loading saved portfolio:', error);
        }
    }
}