// Validation Service
export class ValidationService {
    constructor() {
        this.rules = {
            startKapitaal: { min: 0, max: null },
            lening: { min: 0, max: null },
            renteLening: { min: 0, max: 20 },
            looptijd: { min: 1, max: 50 },
            leningLooptijd: { min: 1, max: 50 },
            rendement: { min: -10, max: 50 },
            herinvestering: { min: 0, max: 100 },
            vasteKosten: { min: 0, max: null },
            herinvesteringDrempel: { min: 0, max: null },
            inflatie: { min: 0, max: 10 },
            box1Tarief: { min: 0, max: 60 },
            box3Rendement: { min: 0, max: 20 },
            box3Tarief: { min: 0, max: 50 },
            box3Vrijstelling: { min: 0, max: null }
        };
    }
    
    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        if (!rule) {
            return { valid: true };
        }
        
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) {
            return { valid: false, message: 'Voer een geldig getal in' };
        }
        
        if (rule.min !== null && numValue < rule.min) {
            return { valid: false, message: `Minimum waarde is ${rule.min}` };
        }
        
        if (rule.max !== null && numValue > rule.max) {
            return { valid: false, message: `Maximum waarde is ${rule.max}` };
        }
        
        return { valid: true };
    }
    
    validateForm(formData) {
        const errors = {};
        let isValid = true;
        
        Object.entries(formData).forEach(([field, value]) => {
            const validation = this.validateField(field, value);
            if (!validation.valid) {
                errors[field] = validation.message;
                isValid = false;
            }
        });
        
        return { isValid, errors };
    }
}
