// Validation Service
export class ValidationService {
    constructor() {
        this.rules = {
            startKapitaal: { min: 0, max: null, required: true },
            lening: { min: 0, max: null, required: false },
            renteLening: { min: 0, max: 20, required: false },
            looptijd: { min: 1, max: 50, required: true },
            leningLooptijd: { min: 1, max: 50, required: false },
            rendement: { min: -10, max: 50, required: true },
            herinvestering: { min: 0, max: 100, required: false },
            vasteKosten: { min: 0, max: null, required: false },
            herinvesteringDrempel: { min: 0, max: null, required: false },
            inflatie: { min: 0, max: 10, required: false },
            box1Tarief: { min: 0, max: 60, required: false },
            box3Rendement: { min: 0, max: 20, required: false },
            box3Tarief: { min: 0, max: 50, required: false },
            box3Vrijstelling: { min: 0, max: null, required: false }
        };
    }
    
    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        
        // If no rule exists for this field, consider it valid
        if (!rule) {
            return { valid: true };
        }
        
        // Check if field is required and empty
        if (rule.required && (value === '' || value === null || value === undefined)) {
            return { 
                valid: false, 
                error: 'Dit veld is verplicht',
                message: 'Dit veld is verplicht' // Keep both for compatibility
            };
        }
        
        // Allow empty values for non-required fields
        if (!rule.required && (value === '' || value === null || value === undefined)) {
            return { valid: true };
        }
        
        // Convert to number for validation
        const numValue = parseFloat(value);
        
        // Check if it's a valid number
        if (isNaN(numValue)) {
            return { 
                valid: false, 
                error: 'Voer een geldig getal in',
                message: 'Voer een geldig getal in'
            };
        }
        
        // Check minimum value
        if (rule.min !== null && numValue < rule.min) {
            return { 
                valid: false, 
                error: `Minimum waarde is ${rule.min}`,
                message: `Minimum waarde is ${rule.min}`
            };
        }
        
        // Check maximum value
        if (rule.max !== null && numValue > rule.max) {
            return { 
                valid: false, 
                error: `Maximum waarde is ${rule.max}`,
                message: `Maximum waarde is ${rule.max}`
            };
        }
        
        // All validations passed
        return { valid: true };
    }
    
    validateForm(formData) {
        const errors = {};
        let isValid = true;
        
        Object.entries(formData).forEach(([field, value]) => {
            const validation = this.validateField(field, value);
            if (!validation.valid) {
                errors[field] = validation.error || validation.message;
                isValid = false;
            }
        });
        
        return { isValid, errors };
    }
    
    // Validate related fields
    validateRelatedFields(formData) {
        const errors = {};
        
        // Validate loan-related fields
        if (formData.lening && formData.lening > 0) {
            if (!formData.renteLening || formData.renteLening <= 0) {
                errors.renteLening = 'Rente is verplicht bij een lening';
            }
            if (!formData.leningLooptijd || formData.leningLooptijd <= 0) {
                errors.leningLooptijd = 'Looptijd lening is verplicht';
            }
        }
        
        // Validate reinvestment threshold
        if (formData.herinvestering && formData.herinvestering > 0) {
            if (!formData.herinvesteringDrempel || formData.herinvesteringDrempel <= 0) {
                errors.herinvesteringDrempel = 'Drempel is verplicht bij herinvestering';
            }
        }
        
        return errors;
    }
    
    // Get field rules
    getFieldRules(fieldName) {
        return this.rules[fieldName] || null;
    }
    
    // Add custom validation rule
    addRule(fieldName, rule) {
        this.rules[fieldName] = rule;
    }
    
    // Remove validation rule
    removeRule(fieldName) {
        delete this.rules[fieldName];
    }
    
    validateInputs(inputs) {
        const errors = [];
        
        // Only check for critical validation errors
        if (inputs.startKapitaal <= 0) {
            errors.push({ field: 'startKapitaal', message: 'Startkapitaal moet groter zijn dan 0', critical: true });
        }
        
        // Make lening validation non-critical
        if (inputs.lening < 0) {
            errors.push({ field: 'lening', message: 'Lening kan niet negatief zijn', critical: false });
        }
        
        // Make looptijd validation non-critical if it's at least positive
        if (inputs.looptijd <= 0) {
            errors.push({ field: 'looptijd', message: 'Looptijd moet groter zijn dan 0', critical: true });
        }
        
        // Make these validations non-critical
        if (inputs.lening > 0 && inputs.renteLening <= 0) {
            errors.push({ field: 'renteLening', message: 'Rente moet groter zijn dan 0 wanneer er een lening is', critical: false });
        }
        
        if (inputs.herinvestering < 0 || inputs.herinvestering > 100) {
            errors.push({ field: 'herinvestering', message: 'Herinvestering moet tussen 0 en 100% liggen', critical: false });
        }
        
        if (inputs.inflatie < 0) {
            errors.push({ field: 'inflatie', message: 'Inflatie kan niet negatief zijn', critical: false });
        }
        
        return errors;
    }
}