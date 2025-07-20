// State Manager - Central state management for ROI Calculator
export class StateManager {
    constructor() {
        this.state = {
            inputs: {},
            results: {},
            ui: {
                currentTab: 'calculator',
                showRealValues: false
            }
        };
        
        this.listeners = [];
    }
    
    // Load default values
    loadDefaults(defaults) {
        this.state.inputs = { ...defaults };
        this.notifyListeners();
    }
    
    // Get current inputs
    getInputs() {
        return { ...this.state.inputs };
    }
    
    // Get current results
    getResults() {
        return { ...this.state.results };
    }
    
    // Get UI state
    getUIState() {
        return { ...this.state.ui };
    }
    
    // Update state
    update(changes) {
        const oldState = this.deepClone(this.state);
        
        // Update inputs
        if (changes.inputs) {
            this.state.inputs = {
                ...this.state.inputs,
                ...changes.inputs
            };
        }
        
        // Update UI state
        if (changes.ui) {
            this.state.ui = {
                ...this.state.ui,
                ...changes.ui
            };
        }
        
        // Check if state actually changed
        if (this.hasChanged(oldState, this.state)) {
            this.notifyListeners();
        }
    }
    
    // Set calculation results
    setResults(results) {
        this.state.results = results;
        // Don't notify here as it would cause infinite loop
    }
    
    // Subscribe to state changes
    onChange(callback) {
        this.listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    
    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
    
    // Get specific input value
    getInput(key) {
        return this.state.inputs[key];
    }
    
    // Set specific input value
    setInput(key, value) {
        this.update({
            inputs: { [key]: value }
        });
    }
    
    // Batch update inputs - FIXED VERSION
    setInputs(inputs) {
        this.state.inputs = { ...inputs };
        this.notifyListeners();
    }
    
    // Export current state
    export() {
        return {
            inputs: this.getInputs(),
            results: this.getResults(),
            timestamp: new Date().toISOString()
        };
    }
    
    // Import state
    import(stateData) {
        if (stateData.inputs) {
            this.state.inputs = { ...stateData.inputs };
        }
        if (stateData.results) {
            this.state.results = { ...stateData.results };
        }
        this.notifyListeners();
    }
    
    // Reset to defaults
    reset() {
        this.state.results = {};
        this.notifyListeners();
    }
    
    // Deep clone helper
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    // Check if state has changed
    hasChanged(oldState, newState) {
        return JSON.stringify(oldState) !== JSON.stringify(newState);
    }
    
    // Get state for specific feature
    getFeatureState(feature) {
        switch(feature) {
            case 'scenarios':
                return {
                    rendement: this.state.inputs.rendement,
                    vasteKosten: this.state.inputs.vasteKosten
                };
            case 'monteCarlo':
                return {
                    rendement: this.state.inputs.rendement,
                    volatility: this.state.inputs.mcVolatility || 3
                };
            case 'waterfall':
                return {
                    looptijd: this.state.inputs.looptijd,
                    showPercentages: this.state.ui.waterfallShowPercentages || false
                };
            default:
                return {};
        }
    }

    // Get all state
    getAll() {
        return {
            inputs: this.getInputs(),
            results: this.getResults(),
            ui: this.getUIState()
        };
    }
    
    // Update from inputs
    updateFromInputs(inputs) {
        const updates = {};
        
        Object.entries(inputs).forEach(([key, value]) => {
            // Convert string values to numbers if needed
            const processedValue = this.processInputValue(value);
            updates[key] = processedValue;
        });
        
        this.update({ inputs: updates });
    }
    
    // Process input value
    processInputValue(value) {
        // Convert string numbers to actual numbers
        if (!isNaN(value) && value !== '') {
            return Number(value);
        }
        return value;
    }
}