// Form Manager - Handles all form interactions
export class FormManager {
    constructor(validationService) {
        this.validationService = validationService;
        this.listeners = [];
        this.formElements = new Map();
        this.debounceTimers = new Map();
        this.initialized = false;
    }
    
    initialize(stateManager) {
        if (this.initialized) {
            return;
        }
        
        this.stateManager = stateManager;
        
        // Ensure DOM is ready before setting up elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.setupFormElements();
        this.loadInitialValues();
        this.attachEventListeners();
        this.initialized = true;
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
        
        let foundCount = 0;
        formIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.formElements.set(id, element);
                foundCount++;
            } else {
                console.warn(`Form element not found: ${id}`);
            }
        });
        
    }
    
    loadInitialValues() {
        if (!this.stateManager) {
            console.error('StateManager not available');
            return;
        }
        
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
            // Remove any existing listeners first
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            this.formElements.set(id, newElement);
            
            // Attach new listeners
            if (newElement.type === 'checkbox') {
                newElement.addEventListener('change', (e) => {
                    this.handleChange(id, e);
                });
            } else {
                // For text/number inputs, use both change and input events
                newElement.addEventListener('change', (e) => {
                    this.handleChange(id, e);
                });
                
                newElement.addEventListener('input', (e) => {
                    this.handleInput(id, e);
                });
            }
        });
        
        // Special handling for tax type changes
        const belastingType = this.formElements.get('belastingType');
        if (belastingType) {
            belastingType.addEventListener('change', () => {
                this.updateTaxOptionsVisibility();
            });
        }
        
        const priveSubType = this.formElements.get('priveSubType');
        if (priveSubType) {
            priveSubType.addEventListener('change', () => {
                this.updatePrivateSubTypeVisibility();
            });
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
            this.showFieldError(id, validation.error);
            return false;
        }
        
        this.clearFieldError(id);
        return true;
    }
    
    showFieldError(id, error) {
        const element = this.formElements.get(id);
        if (element) {
            element.classList.add('is-invalid');
            
            // Find or create error message element
            let errorEl = element.parentElement.querySelector('.invalid-feedback');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'invalid-feedback';
                element.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = error;
        }
    }
    
    clearFieldError(id) {
        const element = this.formElements.get(id);
        if (element) {
            element.classList.remove('is-invalid');
            const errorEl = element.parentElement.querySelector('.invalid-feedback');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }
    
    updateTaxOptionsVisibility() {
        const belastingType = this.formElements.get('belastingType');
        if (!belastingType) return;
        
        const taxType = belastingType.value;
        
        // Hide all tax options first
        document.querySelectorAll('.tax-options').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show relevant tax options
        const taxOptionsId = `${taxType}Options`;
        const taxOptions = document.getElementById(taxOptionsId);
        if (taxOptions) {
            taxOptions.style.display = 'block';
        }
    }
    
    updatePrivateSubTypeVisibility() {
        const priveSubType = this.formElements.get('priveSubType');
        if (!priveSubType) return;
        
        const subType = priveSubType.value;
        
        // Toggle visibility of Box 1 and Box 3 options
        const box1Options = document.getElementById('box1Options');
        const box3Options = document.getElementById('box3Options');
        
        if (box1Options) {
            box1Options.style.display = subType === 'box1' ? 'block' : 'none';
        }
        
        if (box3Options) {
            box3Options.style.display = subType === 'box3' ? 'block' : 'none';
        }
    }
    
    onChange(listener) {
        this.listeners.push(listener);
    }
    
    notifyListeners(changes) {
        
        // Handle special cases
        if (changes.inflatieToggle !== undefined) {
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
    
    // Get form data
    getFormData() {
        const data = {};
        this.formElements.forEach((element, id) => {
            data[id] = this.getElementValue(element);
        });
        return data;
    }
    
    // Set form data
    setFormData(data) {
        Object.keys(data).forEach(id => {
            const element = this.formElements.get(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = data[id];
                } else {
                    element.value = data[id];
                }
            }
        });
    }
    
    // Disable/enable form
    setEnabled(enabled) {
        this.formElements.forEach(element => {
            element.disabled = !enabled;
        });
    }
    
    // Reset form to defaults
    reset() {
        if (this.stateManager) {
            const defaults = this.stateManager.getInputs();
            this.setFormData(defaults);
        }
    }
    
    // Validate all fields
    validateAll() {
        let allValid = true;
        const errors = [];
        
        this.formElements.forEach((element, id) => {
            const value = this.getElementValue(element);
            const validation = this.validationService.validateField(id, value);
            
            if (!validation.valid) {
                allValid = false;
                errors.push({ field: id, error: validation.error });
                this.showFieldError(id, validation.error);
            } else {
                this.clearFieldError(id);
            }
        });
        
        return { valid: allValid, errors };
    }
}