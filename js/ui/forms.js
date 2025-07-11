// Form Manager - Handles all form interactions
export class FormManager {
    constructor(validationService) {
        this.validationService = validationService;
        this.listeners = [];
        this.formElements = new Map();
        this.debounceTimers = new Map();
    }
    
    initialize(stateManager) {
        this.stateManager = stateManager;
        this.setupFormElements();
        this.loadInitialValues();
        this.attachEventListeners();
    }
    
    setupFormElements() {
        // Main calculator form elements
        const formIds = [
            'startKapitaal', 'lening', 'renteLening', 'looptijd', 'leningLooptijd',
            'rendementType', 'rendement', 'aflossingsType', 'herinvestering',
            'herinvesteringDrempel', 'vasteKosten', 'belastingType', 'inflatie',
            'inflatieToggle', 'priveSubType', 'box1Tarief', 'box3Rendement',
            'box3Tarief', 'box3Vrijstelling'
        ];
        
        formIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.formElements.set(id, element);
            }
        });
    }
    
    loadInitialValues() {
        const inputs = this.stateManager.getInputs();
        
        this.formElements.forEach((element, id) => {
            if (inputs.hasOwnProperty(id)) {
                if (element.type === 'checkbox') {
                    element.checked = inputs[id];
                } else {
                    element.value = inputs[id];
                }
            }
        });
        
        // Initialize tax options visibility
        this.updateTaxOptionsVisibility();
    }
    
    attachEventListeners() {
        this.formElements.forEach((element, id) => {
            if (element.type === 'checkbox') {
                element.addEventListener('change', (e) => this.handleChange(id, e));
            } else {
                element.addEventListener('change', (e) => this.handleChange(id, e));
                element.addEventListener('input', (e) => this.handleInput(id, e));
            }
        });
        
        // Special handling for tax type changes
        const belastingType = this.formElements.get('belastingType');
        if (belastingType) {
            belastingType.addEventListener('change', () => this.updateTaxOptionsVisibility());
        }
        
        const priveSubType = this.formElements.get('priveSubType');
        if (priveSubType) {
            priveSubType.addEventListener('change', () => this.updatePrivateSubTypeVisibility());
        }
    }
    
    handleChange(id, event) {
        const element = event.target;
        const value = this.getElementValue(element);
        
        // Validate immediately on change
        if (this.validateField(id, value)) {
            this.notifyListeners({ [id]: value });
        }
    }
    
    handleInput(id, event) {
        const element = event.target;
        const value = this.getElementValue(element);
        
        // Debounce input events
        this.debounce(id, () => {
            if (this.validateField(id, value)) {
                this.notifyListeners({ [id]: value });
            }
        }, 300);
    }
    
    getElementValue(element) {
        if (element.type === 'checkbox') {
            return element.checked;
        } else if (element.type === 'number') {
            return parseFloat(element.value) || 0;
        } else {
            return element.value;
        }
    }
    
    validateField(id, value) {
        const validation = this.validationService.validateField(id, value);
        
        if (!validation.valid) {
            this.showFieldError(id, validation.message);
            return false;
        } else {
            this.clearFieldError(id);
            return true;
        }
    }
    
    showFieldError(id, message) {
        const element = this.formElements.get(id);
        if (!element) return;
        
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            
            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            element.parentNode.appendChild(errorElement);
        }
    }
    
    clearFieldError(id) {
        const element = this.formElements.get(id);
        if (!element) return;
        
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
    
    updateTaxOptionsVisibility() {
        const belastingType = this.formElements.get('belastingType')?.value;
        const priveOptions = document.getElementById('priveOptions');
        
        if (priveOptions) {
            priveOptions.style.display = belastingType === 'prive' ? 'grid' : 'none';
            
            if (belastingType === 'prive') {
                this.updatePrivateSubTypeVisibility();
            }
        }
    }
    
    updatePrivateSubTypeVisibility() {
        const priveSubType = this.formElements.get('priveSubType')?.value;
        
        const box1Options = document.getElementById('box1Options');
        const box3Options = document.getElementById('box3Options');
        const box3TariefGroup = document.getElementById('box3TariefGroup');
        const box3VrijstellingGroup = document.getElementById('box3VrijstellingGroup');
        
        if (priveSubType === 'box1') {
            if (box1Options) box1Options.style.display = 'block';
            if (box3Options) box3Options.style.display = 'none';
            if (box3TariefGroup) box3TariefGroup.style.display = 'none';
            if (box3VrijstellingGroup) box3VrijstellingGroup.style.display = 'none';
        } else if (priveSubType === 'box3') {
            if (box1Options) box1Options.style.display = 'none';
            if (box3Options) box3Options.style.display = 'block';
            if (box3TariefGroup) box3TariefGroup.style.display = 'block';
            if (box3VrijstellingGroup) box3VrijstellingGroup.style.display = 'block';
        }
    }
    
    // Get all form values
    getFormData() {
        const data = {};
        
        this.formElements.forEach((element, id) => {
            data[id] = this.getElementValue(element);
        });
        
        return data;
    }
    
    // Set form values
    setFormData(data) {
        Object.entries(data).forEach(([id, value]) => {
            const element = this.formElements.get(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        this.updateTaxOptionsVisibility();
    }
    
    // Subscribe to form changes
    onChange(callback) {
        this.listeners.push(callback);
        
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    
    // Notify listeners - FIXED VERSION WITH INFLATIE TOGGLE HANDLING
    notifyListeners(changes) {
        // Special handling for inflatieToggle
        if ('inflatieToggle' in changes) {
            // Update UI state for real values display
            changes.showRealValues = changes.inflatieToggle;
            // Update state to handle UI changes
            if (this.stateManager) {
                this.stateManager.update({ ui: { showRealValues: changes.inflatieToggle } });
            }
        }
        
        this.listeners.forEach(listener => {
            try {
                listener(changes);
            } catch (error) {
                console.error('Error in form listener:', error);
            }
        });
    }
    
    // Debounce helper
    debounce(id, func, delay) {
        // Clear existing timer
        if (this.debounceTimers.has(id)) {
            clearTimeout(this.debounceTimers.get(id));
        }
        
        // Set new timer
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(id);
        }, delay);
        
        this.debounceTimers.set(id, timer);
    }
    
    // Disable/enable form
    setEnabled(enabled) {
        this.formElements.forEach(element => {
            element.disabled = !enabled;
        });
    }
    
    // Reset form to defaults
    reset() {
        const defaults = this.stateManager.getInputs();
        this.setFormData(defaults);
    }
}