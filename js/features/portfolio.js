// Portfolio Feature Module
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
                <label>Asset Naam</label>
                <input type="text" placeholder="Bijv. Aandelen" class="asset-name" value="">
            </div>
            <div class="asset-field">
                <label>Bedrag (€)</label>
                <input type="number" placeholder="100000" class="asset-amount" min="0" step="1000" value="">
            </div>
            <div class="asset-field">
                <label>Rendement %</label>
                <input type="number" placeholder="7.5" class="asset-return" step="0.1" value="">
            </div>
            <div class="asset-field">
                <label>Risico %</label>
                <input type="number" placeholder="15" class="asset-risk" min="0" max="100" step="1" value="">
            </div>
            <button class="btn-remove" data-action="remove">×</button>
        `;
        
        assetList.appendChild(newAsset);
        
        // Focus on name field
        const nameField = newAsset.querySelector('.asset-name');
        if (nameField) nameField.focus();
    }
    
    removeAsset(button) {
        const row = button.closest('.asset-row');
        if (!row) return;
        
        // Check if this is the last asset
        const assetList = document.getElementById('assetList');
        const remainingAssets = assetList.querySelectorAll('.asset-row').length;
        
        if (remainingAssets <= 1) {
            alert('U moet minimaal één asset in uw portfolio hebben.');
            return;
        }
        
        // Remove with animation
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            row.remove();
            // Recalculate if there was data
            if (this.assets.length > 0) {
                this.calculate();
            }
        }, 300);
    }
    
    validateAssetInput(input) {
        const value = input.value;
        const isValid = this.validateInput(input.className, value);
        
        const formGroup = input.closest('.asset-field');
        if (formGroup) {
            if (!isValid) {
                formGroup.classList.add('error');
            } else {
                formGroup.classList.remove('error');
            }
        }
        
        return isValid;
    }
    
    validateInput(className, value) {
        if (className.includes('asset-name')) {
            return value.trim().length > 0;
        } else if (className.includes('asset-amount')) {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        } else if (className.includes('asset-return')) {
            const num = parseFloat(value);
            return !isNaN(num) && num >= -100 && num <= 100;
        } else if (className.includes('asset-risk')) {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0 && num <= 100;
        }
        return true;
    }
    
    calculate() {
        const assetData = this.collectAssetData();
        
        if (!assetData.valid) {
            this.showError(assetData.error);
            return;
        }
        
        this.assets = assetData.assets;
        
        // Calculate portfolio metrics
        this.calculateMetrics();
        
        // Update display
        this.updateDisplay();
        
        // Update chart
        this.updateChart();
        
        // Save portfolio
        this.savePortfolio();
    }
    
    collectAssetData() {
        const assets = [];
        let totalValue = 0;
        let hasErrors = false;
        let errorMessage = '';
        
        document.querySelectorAll('.asset-row').forEach((row, index) => {
            const name = row.querySelector('.asset-name')?.value.trim() || `Asset ${index + 1}`;
            const amount = parseFloat(row.querySelector('.asset-amount')?.value) || 0;
            const returnRate = parseFloat(row.querySelector('.asset-return')?.value) || 0;
            const risk = parseFloat(row.querySelector('.asset-risk')?.value) || 0;
            
            // Validate
            if (amount <= 0) {
                hasErrors = true;
                errorMessage = `Asset "${name}" moet een positief bedrag hebben.`;
                return;
            }
            
            if (risk < 0 || risk > 100) {
                hasErrors = true;
                errorMessage = `Risico voor "${name}" moet tussen 0% en 100% liggen.`;
                return;
            }
            
            assets.push({
                id: row.dataset.assetId || generateId(),
                name,
                amount,
                returnRate,
                risk
            });
            
            totalValue += amount;
        });
        
        if (hasErrors) {
            return { valid: false, error: errorMessage };
        }
        
        if (assets.length === 0) {
            return { valid: false, error: 'Voeg minimaal één asset toe aan uw portfolio.' };
        }
        
        if (totalValue === 0) {
            return { valid: false, error: 'Totale portfolio waarde moet groter dan 0 zijn.' };
        }
        
        return { valid: true, assets, totalValue };
    }
    
    calculateMetrics() {
        let totalValue = 0;
        let weightedReturn = 0;
        let weightedRisk = 0;
        
        // Calculate total value first
        this.assets.forEach(asset => {
            totalValue += asset.amount;
        });
        
        // Calculate weighted metrics
        this.assets.forEach(asset => {
            const weight = asset.amount / totalValue;
            asset.weight = weight;
            
            weightedReturn += asset.returnRate * weight;
            weightedRisk += asset.risk * weight;
        });
        
        // Calculate portfolio risk (simplified - doesn't account for correlation)
        // For a more accurate calculation, you would need correlation matrix
        let portfolioVariance = 0;
        this.assets.forEach(asset => {
            portfolioVariance += Math.pow(asset.weight * asset.risk, 2);
        });
        
        const portfolioRisk = Math.sqrt(portfolioVariance);
        
        // Store metrics
        this.portfolioMetrics = {
            totalValue,
            weightedReturn,
            portfolioRisk,
            sharpeRatio: this.calculateSharpeRatio(weightedReturn, portfolioRisk),
            diversificationRatio: this.calculateDiversificationRatio()
        };
    }
    
    calculateSharpeRatio(returns, risk, riskFreeRate = 2) {
        if (risk === 0) return 0;
        return ((returns - riskFreeRate) / risk).toFixed(2);
    }
    
    calculateDiversificationRatio() {
        // Simple measure: 1 - Herfindahl index
        let herfindahl = 0;
        this.assets.forEach(asset => {
            herfindahl += Math.pow(asset.weight, 2);
        });
        return ((1 - herfindahl) * 100).toFixed(1);
    }
    
    updateDisplay() {
        // Update KPIs
        const elements = {
            portfolioWaarde: formatNumber(this.portfolioMetrics.totalValue),
            portfolioRendement: this.portfolioMetrics.weightedReturn.toFixed(1) + '%',
            portfolioRisico: this.portfolioMetrics.portfolioRisk.toFixed(1) + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Add additional metrics if container exists
        this.displayAdditionalMetrics();
    }
    
    displayAdditionalMetrics() {
        const container = document.getElementById('portfolioMetrics');
        if (!container) return;
        
        // Add Sharpe ratio and diversification
        const additionalMetrics = `
            <div class="kpi-card purple">
                <div class="kpi-icon">📊</div>
                <div class="kpi-label">Sharpe Ratio</div>
                <div class="kpi-value">${this.portfolioMetrics.sharpeRatio}</div>
                <div class="kpi-subtitle">Risico-gewogen rendement</div>
            </div>
            <div class="kpi-card info">
                <div class="kpi-icon">🎯</div>
                <div class="kpi-label">Diversificatie</div>
                <div class="kpi-value">${this.portfolioMetrics.diversificationRatio}%</div>
                <div class="kpi-subtitle">Portfolio spreiding</div>
            </div>
        `;
        
        // Check if already added
        if (!container.querySelector('.kpi-card.purple')) {
            container.insertAdjacentHTML('beforeend', additionalMetrics);
        }
    }
    
    updateChart() {
        if (!this.chartManager.charts.portfolio) return;
        
        const chart = this.chartManager.charts.portfolio;
        
        // Update data
        chart.data.labels = this.assets.map(a => a.name);
        chart.data.datasets[0].data = this.assets.map(a => a.amount);
        
        // Update colors if more than 6 assets
        if (this.assets.length > 6) {
            const colors = this.generateColors(this.assets.length);
            chart.data.datasets[0].backgroundColor = colors;
        }
        
        chart.update();
    }
    
    generateColors(count) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = i * hueStep;
            colors.push(`hsl(${hue}, 70%, 50%)`);
        }
        
        return colors;
    }
    
    savePortfolio() {
        const portfolioData = {
            assets: this.assets,
            metrics: this.portfolioMetrics,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('roi_calculator_portfolio', JSON.stringify(portfolioData));
        } catch (e) {
            console.error('Error saving portfolio:', e);
        }
    }
    
    loadSavedPortfolio() {
        try {
            const saved = localStorage.getItem('roi_calculator_portfolio');
            if (!saved) return;
            
            const portfolioData = JSON.parse(saved);
            if (!portfolioData.assets || portfolioData.assets.length === 0) return;
            
            // Clear existing assets except first
            const assetList = document.getElementById('assetList');
            const rows = assetList.querySelectorAll('.asset-row');
            rows.forEach((row, index) => {
                if (index > 0) row.remove();
            });
            
            // Load saved assets
            portfolioData.assets.forEach((asset, index) => {
                if (index > 0) {
                    this.addAsset();
                }
                
                const row = assetList.querySelectorAll('.asset-row')[index];
                if (row) {
                    row.querySelector('.asset-name').value = asset.name;
                    row.querySelector('.asset-amount').value = asset.amount;
                    row.querySelector('.asset-return').value = asset.returnRate;
                    row.querySelector('.asset-risk').value = asset.risk;
                }
            });
            
            // Recalculate
            this.calculate();
            
        } catch (e) {
            console.error('Error loading portfolio:', e);
        }
    }
    
    exportPortfolioData() {
        return {
            assets: this.assets,
            metrics: this.portfolioMetrics,
            analysis: {
                topPerformer: this.getTopPerformer(),
                highestRisk: this.getHighestRisk(),
                recommendations: this.getRecommendations()
            }
        };
    }
    
    getTopPerformer() {
        if (this.assets.length === 0) return null;
        
        return this.assets.reduce((best, asset) => 
            asset.returnRate > best.returnRate ? asset : best
        );
    }
    
    getHighestRisk() {
        if (this.assets.length === 0) return null;
        
        return this.assets.reduce((riskiest, asset) => 
            asset.risk > riskiest.risk ? asset : riskiest
        );
    }
    
    getRecommendations() {
        const recommendations = [];
        
        // Concentration risk
        const maxWeight = Math.max(...this.assets.map(a => a.weight));
        if (maxWeight > 0.4) {
            recommendations.push('Overweeg verdere diversificatie - één asset is meer dan 40% van portfolio');
        }
        
        // Risk level
        if (this.portfolioMetrics.portfolioRisk > 20) {
            recommendations.push('Hoog risicoprofiel - overweeg toevoeging van defensieve assets');
        } else if (this.portfolioMetrics.portfolioRisk < 5) {
            recommendations.push('Laag risicoprofiel - mogelijk te conservatief voor lange termijn groei');
        }
        
        // Return expectations
        if (this.portfolioMetrics.weightedReturn < 3) {
            recommendations.push('Verwacht rendement onder inflatie - heroverweeg asset allocatie');
        }
        
        return recommendations;
    }
    
    showError(message) {
        alert(message);
    }
}