// Saved Scenarios Feature Module
import { formatNumber, getCurrentDateString } from '../utils/format-utils.js';

export class SavedScenariosFeature {
    constructor(calculator, dataService) {
        this.calculator = calculator;
        this.dataService = dataService;
        this.savedScenarios = [];
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Save current scenario button
        const saveBtn = document.getElementById('saveScenarioBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentScenario());
        }
        
        // Delegate clicks on scenario list
        const scenariosList = document.getElementById('savedScenariosList');
        if (scenariosList) {
            scenariosList.addEventListener('click', (e) => {
                const target = e.target;
                
                if (target.classList.contains('btn-load') || target.dataset.action === 'load') {
                    const scenarioId = target.closest('.saved-scenario')?.dataset.scenarioId;
                    if (scenarioId) this.loadScenario(scenarioId);
                }
                
                if (target.classList.contains('btn-delete') || target.dataset.action === 'delete') {
                    const scenarioId = target.closest('.saved-scenario')?.dataset.scenarioId;
                    if (scenarioId) this.deleteScenario(scenarioId);
                }
            });
        }
    }
    
    activate() {
        // Load saved scenarios when tab is activated
        this.loadSavedScenarios();
        this.displayScenarios();
    }
    
    loadSavedScenarios(scenarios) {
        if (scenarios) {
            this.savedScenarios = scenarios;
        } else {
            this.savedScenarios = this.dataService.loadScenarios();
        }
    }
    
    saveCurrentScenario() {
        const name = prompt('Geef een naam voor dit scenario:');
        if (!name || name.trim() === '') return;
        
        const inputs = this.stateManager.getInputs();
        const results = this.calculator.results;
        
        const scenario = {
            name: name.trim(),
            inputs: inputs,
            results: {
                finalVermogen: results.finalVermogen,
                finalROI: results.finalROI,
                leverageFactor: results.leverageFactor,
                finalCashReserve: results.finalCashReserve
            },
            timestamp: new Date().toISOString()
        };
        
        if (this.dataService.saveScenario(scenario)) {
            this.loadSavedScenarios();
            this.displayScenarios();
            this.showSuccess('Scenario succesvol opgeslagen!');
        } else {
            this.showError('Er is een fout opgetreden bij het opslaan.');
        }
    }
    
    loadScenario(id) {
        const scenario = this.savedScenarios.find(s => s.id === id);
        if (!scenario) return;
        
        // Confirm loading
        if (!confirm(`Wilt u scenario "${scenario.name}" laden? Dit overschrijft uw huidige waardes.`)) {
            return;
        }
        
        // Update state with scenario inputs
        this.stateManager.setInputs(scenario.inputs);
        
        // Switch to calculator tab
        const calculatorTab = document.querySelector('[data-tab="calculator"]');
        if (calculatorTab) {
            calculatorTab.click();
        }
        
        this.showSuccess(`Scenario "${scenario.name}" geladen!`);
    }
    
    deleteScenario(id) {
        const scenario = this.savedScenarios.find(s => s.id === id);
        if (!scenario) return;
        
        if (!confirm(`Weet u zeker dat u scenario "${scenario.name}" wilt verwijderen?`)) {
            return;
        }
        
        if (this.dataService.deleteScenario(id)) {
            this.loadSavedScenarios();
            this.displayScenarios();
            this.showSuccess('Scenario verwijderd.');
        }
    }
    
    displayScenarios() {
        const container = document.getElementById('savedScenariosList');
        if (!container) return;
        
        if (this.savedScenarios.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nog geen opgeslagen scenario's.</p>
                    <p>Gebruik de "Huidig Scenario Opslaan" knop om te beginnen.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.savedScenarios.map(scenario => {
            const date = new Date(scenario.timestamp);
            const dateStr = date.toLocaleDateString('nl-NL');
            const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="saved-scenario" data-scenario-id="${scenario.id}">
                    <div class="scenario-info">
                        <strong>${this.escapeHtml(scenario.name)}</strong>
                        <div class="scenario-meta">
                            <span>📅 ${dateStr} ${timeStr}</span>
                            <span>💰 ${formatNumber(scenario.results.finalVermogen)}</span>
                            <span>📈 ROI: ${scenario.results.finalROI.toFixed(1)}%</span>
                            <span>🔗 Leverage: ${scenario.results.leverageFactor.toFixed(1)}x</span>
                        </div>
                    </div>
                    <div class="scenario-actions">
                        <button class="btn btn-sm btn-primary btn-load" data-action="load">
                            <span class="btn-icon">📂</span>
                            Laden
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete" data-action="delete">
                            <span class="btn-icon">🗑️</span>
                            Verwijderen
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showSuccess(message) {
        // Could be replaced with a toast notification
        console.log('Success:', message);
        alert(message);
    }
    
    showError(message) {
        // Could be replaced with a toast notification
        console.error('Error:', message);
        alert(message);
    }
}