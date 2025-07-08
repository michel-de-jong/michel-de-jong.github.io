// Box 1 (Inkomstenbelasting) Calculator Module

class Box1Calculator {
    constructor() {
        this.config = {
            brackets: Config.tax.BOX1_BRACKETS,
            defaultRate: Config.tax.DEFAULT_BOX1_RATE,
            renteAftrekPercentage: 0.5 // Assumption: 50% of interest is deductible
        };
    }
    
    /**
     * Calculate Box 1 tax
     * @param {number} bruttoOpbrengst - Gross revenue
     * @param {number} maandRente - Monthly interest costs
     * @param {number} maandKosten - Monthly fixed costs
     * @param {number} box1Tarief - User specified tax rate
     * @param {number} herinvestering - Reinvestment percentage
     * @returns {number} Tax amount
     */
    calculate(bruttoOpbrengst, maandRente, maandKosten, box1Tarief, herinvestering) {
        // Voor box 1: beperkte aftrekbaarheid van rente
        const aftrekbareRente = maandRente * this.config.renteAftrekPercentage;
        
        const belastbareWinst = Math.max(0, bruttoOpbrengst - aftrekbareRente - maandKosten);
        
        // Box 1 is alleen over uitgekeerde winst
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        // Gebruik het opgegeven tarief
        const tariefDecimaal = box1Tarief / 100;
        return uitgekeerdeDeel * tariefDecimaal;
    }
    
    /**
     * Calculate progressive Box 1 tax
     * @param {number} jaarInkomen - Annual taxable income
     * @returns {object} Tax calculation details
     */
    calculateProgressive(jaarInkomen) {
        let belasting = 0;
        let restInkomen = jaarInkomen;
        let effectiefTarief = 0;
        const details = [];
        
        for (const bracket of this.config.brackets) {
            if (restInkomen <= 0) break;
            
            const belastbaarInSchijf = Math.min(restInkomen, bracket.max - bracket.min);
            const belastingInSchijf = belastbaarInSchijf * bracket.rate;
            
            belasting += belastingInSchijf;
            restInkomen -= belastbaarInSchijf;
            
            details.push({
                schijf: `€${bracket.min.toLocaleString('nl-NL')} - €${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString('nl-NL')}`,
                tarief: (bracket.rate * 100).toFixed(1) + '%',
                inkomen: belastbaarInSchijf,
                belasting: belastingInSchijf
            });
            
            if (bracket.max === Infinity || restInkomen <= 0) break;
        }
        
        if (jaarInkomen > 0) {
            effectiefTarief = (belasting / jaarInkomen) * 100;
        }
        
        return {
            bruttoInkomen: jaarInkomen,
            totaleBelasting: belasting,
            nettoInkomen: jaarInkomen - belasting,
            effectiefTarief,
            marginaalTarief: this.getMarginalRate(jaarInkomen) * 100,
            details
        };
    }
    
    /**
     * Get marginal tax rate for income level
     * @param {number} inkomen - Income level
     * @returns {number} Marginal tax rate
     */
    getMarginalRate(inkomen) {
        for (const bracket of this.config.brackets) {
            if (inkomen >= bracket.min && inkomen < bracket.max) {
                return bracket.rate;
            }
        }
        return this.config.brackets[this.config.brackets.length - 1].rate;
    }
    
    /**
     * Calculate maximum deductible interest
     * @param {number} eigenwoningSchuld - Mortgage debt
     * @param {number} rentePercentage - Interest rate
     * @returns {number} Maximum deductible amount
     */
    calculateHypotheekrenteAftrek(eigenwoningSchuld, rentePercentage) {
        const jaarRente = eigenwoningSchuld * (rentePercentage / 100);
        
        // Eigenwoningrente is volledig aftrekbaar in box 1
        return {
            bruttoRente: jaarRente,
            aftrekbaarBedrag: jaarRente,
            belastingvoordeel: jaarRente * this.config.defaultRate
        };
    }
    
    /**
     * Get Box 1 deductible items
     * @returns {array} List of deductible items
     */
    getDeductibleItems() {
        return [
            'Hypotheekrente eigen woning',
            'Giften aan goede doelen (met drempel)',
            'Alimentatie aan ex-partner',
            'Specifieke zorgkosten',
            'Studiekosten voor opleiding',
            'Ondernemersaftrek (voor IB-ondernemers)',
            'Reiskosten openbaar vervoer',
            'Lijfrentepremies (binnen jaarruimte)'
        ];
    }
    
    /**
     * Get tax optimization tips
     * @param {object} calculation - Tax calculation results
     * @returns {array} Optimization suggestions
     */
    getOptimizationTips(calculation) {
        const tips = [];
        
        if (calculation.marginaalTarief > 37) {
            tips.push({
                type: 'info',
                message: 'U zit in een hoog belastingtarief. Overweeg fiscaal vriendelijke investeringen'
            });
        }
        
        if (calculation.effectiefTarief < 20) {
            tips.push({
                type: 'success',
                message: 'Uw effectieve belastingdruk is relatief laag'
            });
        }
        
        tips.push({
            type: 'warning',
            message: 'Let op: rente is slechts beperkt aftrekbaar voor niet-eigen woning schulden'
        });
        
        return tips;
    }
}

// Export for use in main application
window.Box1Calculator = Box1Calculator;