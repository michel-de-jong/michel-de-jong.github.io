// Tax Factory Module - ES6 Module version
import { VPBCalculator } from './vpb-calculator.js';
import { Box1Calculator } from './box1-calculator.js';
import { Box3Calculator } from './box3-calculator.js';

export class TaxFactory {
    constructor() {
        this.calculators = {
            vpb: new VPBCalculator(),
            box1: new Box1Calculator(),
            box3: new Box3Calculator()
        };
    }
    
    /**
     * Get appropriate tax calculator
     * @param {string} type - Tax type (vpb, box1, box3)
     * @returns {object} Tax calculator instance
     */
    getCalculator(type) {
        return this.calculators[type] || null;
    }
    
    /**
     * Calculate tax based on type
     * @param {string} type - Tax type
     * @param {object} params - Calculation parameters
     * @returns {number} Tax amount
     */
    calculateTax(type, params) {
        const calculator = this.getCalculator(type);
        if (!calculator) {
            console.error(`Unknown tax type: ${type}`);
            return 0;
        }
        
        switch(type) {
            case 'vpb':
                return calculator.calculate(
                    params.bruttoOpbrengst,
                    params.maandRente,
                    params.maandKosten,
                    params.herinvestering
                );
                
            case 'box1':
                return calculator.calculate(
                    params.bruttoOpbrengst,
                    params.maandRente,
                    params.maandKosten,
                    params.box1Tarief,
                    params.herinvestering
                );
                
            case 'box3':
                return calculator.calculate(
                    params.huidigVermogen,
                    params.box3Rendement,
                    params.box3Tarief,
                    params.box3Vrijstelling,
                    params.month
                );
                
            default:
                return 0;
        }
    }
    
    /**
     * Get tax type from inputs
     * @param {object} inputs - Form inputs
     * @returns {string} Tax calculator type
     */
    getTaxType(inputs) {
        if (inputs.belastingType === 'vpb') {
            return 'vpb';
        } else if (inputs.belastingType === 'prive') {
            return inputs.priveSubType === 'box1' ? 'box1' : 'box3';
        }
        return null;
    }
    
    /**
     * Calculate comprehensive tax
     * @param {object} inputs - All calculation inputs
     * @param {number} bruttoOpbrengst - Gross revenue
     * @param {number} maandRente - Monthly interest
     * @param {number} maandKosten - Monthly costs
     * @param {number} huidigVermogen - Current wealth
     * @param {number} month - Current month
     * @returns {object} Tax calculation results
     */
    calculateComprehensiveTax(inputs, bruttoOpbrengst, maandRente, maandKosten, huidigVermogen, month) {
        const taxType = this.getTaxType(inputs);
        
        const params = {
            bruttoOpbrengst,
            maandRente,
            maandKosten,
            huidigVermogen,
            month,
            herinvestering: inputs.herinvestering,
            box1Tarief: inputs.box1Tarief,
            box3Rendement: inputs.box3Rendement,
            box3Tarief: inputs.box3Tarief,
            box3Vrijstelling: inputs.box3Vrijstelling
        };
        
        const belasting = this.calculateTax(taxType, params);
        
        return {
            type: taxType,
            belasting,
            effectiefTarief: bruttoOpbrengst > 0 ? (belasting / bruttoOpbrengst) * 100 : 0,
            aftrekbareKosten: this.getDeductibleCosts(taxType, maandRente, maandKosten)
        };
    }
    
    /**
     * Get deductible costs based on tax type
     * @param {string} type - Tax type
     * @param {number} rente - Interest costs
     * @param {number} kosten - Fixed costs
     * @returns {number} Total deductible amount
     */
    getDeductibleCosts(type, rente, kosten) {
        switch(type) {
            case 'vpb':
                return rente + kosten; // Full deduction
                
            case 'box1':
                return (rente * 0.5) + kosten; // Limited interest deduction
                
            case 'box3':
                return 0; // No deductions in box 3
                
            default:
                return 0;
        }
    }
    
    /**
     * Get tax optimization recommendations
     * @param {string} type - Tax type
     * @param {object} calculation - Calculation results
     * @returns {array} Optimization tips
     */
    getOptimizationTips(type, calculation) {
        const calculator = this.getCalculator(type);
        if (!calculator || !calculator.getOptimizationTips) {
            return [];
        }
        
        return calculator.getOptimizationTips(calculation);
    }
    
    /**
     * Compare tax scenarios
     * @param {object} baseInputs - Base calculation inputs
     * @param {array} scenarios - Different tax scenarios to compare
     * @returns {array} Comparison results
     */
    compareTaxScenarios(baseInputs, scenarios) {
        const results = [];
        
        scenarios.forEach(scenario => {
            const taxInputs = { ...baseInputs, ...scenario };
            const taxType = this.getTaxType(taxInputs);
            
            // Simple comparison calculation
            const monthlyRevenue = 10000; // Example
            const monthlyInterest = 500;
            const monthlyCosts = 1000;
            const currentWealth = 500000;
            
            const tax = this.calculateComprehensiveTax(
                taxInputs,
                monthlyRevenue,
                monthlyInterest,
                monthlyCosts,
                currentWealth,
                12 // December for box 3
            );
            
            results.push({
                name: scenario.name || taxType,
                type: taxType,
                monthlyTax: tax.belasting,
                annualTax: tax.belasting * 12,
                effectiveRate: tax.effectiefTarief,
                netMonthlyIncome: monthlyRevenue - tax.belasting - monthlyInterest - monthlyCosts
            });
        });
        
        return results.sort((a, b) => a.annualTax - b.annualTax);
    }
    
    /**
     * Export tax summary
     * @param {object} inputs - Calculation inputs
     * @param {object} results - Calculation results
     * @returns {object} Tax summary for reporting
     */
    exportTaxSummary(inputs, results) {
        const taxType = this.getTaxType(inputs);
        const calculator = this.getCalculator(taxType);
        
        return {
            regime: taxType.toUpperCase(),
            description: this.getTaxDescription(taxType),
            parameters: this.getTaxParameters(inputs, taxType),
            deductibleItems: calculator.getDeductibleItems ? calculator.getDeductibleItems() : [],
            yearlyEstimate: this.estimateYearlyTax(inputs, results),
            optimizationTips: calculator.getOptimizationTips ? 
                calculator.getOptimizationTips(results) : []
        };
    }
    
    /**
     * Get tax regime description
     * @param {string} type - Tax type
     * @returns {string} Description
     */
    getTaxDescription(type) {
        const descriptions = {
            vpb: 'Vennootschapsbelasting - Voor BV\'s en NV\'s',
            box1: 'Box 1 Inkomstenbelasting - Progressief tarief op winst',
            box3: 'Box 3 Vermogensrendementsheffing - Belasting op fictief rendement'
        };
        return descriptions[type] || 'Onbekend belastingregime';
    }
    
    /**
     * Get relevant tax parameters
     * @param {object} inputs - All inputs
     * @param {string} type - Tax type
     * @returns {object} Relevant parameters
     */
    getTaxParameters(inputs, type) {
        const base = {
            herinvestering: inputs.herinvestering + '%'
        };
        
        switch(type) {
            case 'vpb':
                return {
                    ...base,
                    tarief: '19% tot €200.000, daarna 25.8%'
                };
                
            case 'box1':
                return {
                    ...base,
                    tarief: inputs.box1Tarief + '%',
                    renteAftrek: 'Beperkt aftrekbaar'
                };
                
            case 'box3':
                return {
                    rendement: inputs.box3Rendement + '%',
                    tarief: inputs.box3Tarief + '%',
                    vrijstelling: '€' + inputs.box3Vrijstelling.toLocaleString('nl-NL')
                };
                
            default:
                return base;
        }
    }
    
    /**
     * Estimate yearly tax based on monthly calculations
     * @param {object} inputs - Calculation inputs
     * @param {object} results - Monthly results
     * @returns {number} Estimated yearly tax
     */
    estimateYearlyTax(inputs, results) {
        // This is a simplified estimation
        // In reality, would need full year calculation
        const monthlyAverage = results.monthlyTax || 0;
        return monthlyAverage * 12;
    }
}

export { TaxFactory };