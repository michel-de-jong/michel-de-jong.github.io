// Box 3 (Vermogensbelasting) Calculator Module

class Box3Calculator {
    constructor() {
        this.config = {
            rendementBrackets: Config.tax.BOX3_RENDEMENT_BRACKETS,
            belastingTarief: Config.tax.BOX3_BELASTING_TARIEF,
            defaultRendement: Config.tax.DEFAULT_BOX3_RENDEMENT,
            defaultVrijstelling: Config.defaults.box3Vrijstelling
        };
    }
    
    /**
     * Calculate Box 3 tax (monthly)
     * @param {number} huidigVermogen - Current wealth
     * @param {number} box3Rendement - Assumed return percentage
     * @param {number} box3Tarief - Tax rate
     * @param {number} box3Vrijstelling - Tax-free allowance
     * @param {number} month - Current month
     * @returns {number} Tax amount
     */
    calculate(huidigVermogen, box3Rendement, box3Tarief, box3Vrijstelling, month) {
        // Box 3 wordt jaarlijks berekend, niet maandelijks
        // Alleen berekenen in december (maand 12, 24, 36, etc.)
        if (month % 12 !== 0) {
            return 0;
        }
        
        // Vermogen boven heffingsvrije voet
        const belastbaarVermogen = Math.max(0, huidigVermogen - box3Vrijstelling);
        
        if (belastbaarVermogen <= 0) {
            return 0;
        }
        
        // Fictief rendement berekenen
        const fictiefRendement = belastbaarVermogen * (box3Rendement / 100);
        
        // Belasting over fictief rendement
        const jaarlijkseBelasting = fictiefRendement * (box3Tarief / 100);
        
        // Verdeel over 12 maanden
        return jaarlijkseBelasting / 12;
    }
    
    /**
     * Calculate progressive Box 3 tax (full calculation)
     * @param {number} vermogen - Total wealth
     * @param {number} schulden - Total debts
     * @param {number} vrijstelling - Tax-free allowance
     * @param {boolean} fiscaalPartner - Has fiscal partner
     * @returns {object} Tax calculation details
     */
    calculateProgressive(vermogen, schulden = 0, vrijstelling = null, fiscaalPartner = false) {
        const effectieveVrijstelling = vrijstelling || 
            (fiscaalPartner ? this.config.defaultVrijstelling * 2 : this.config.defaultVrijstelling);
        
        const nettoVermogen = vermogen - schulden;
        const belastbaarVermogen = Math.max(0, nettoVermogen - effectieveVrijstelling);
        
        if (belastbaarVermogen <= 0) {
            return {
                bruttoVermogen: vermogen,
                schulden: schulden,
                nettoVermogen: nettoVermogen,
                vrijstelling: effectieveVrijstelling,
                belastbaarVermogen: 0,
                fictiefRendement: 0,
                grondslag: 0,
                belasting: 0,
                effectiefRendement: 0,
                details: []
            };
        }
        
        // Calculate fictitious return based on brackets
        let fictiefRendement = 0;
        let restVermogen = belastbaarVermogen;
        const details = [];
        
        for (const bracket of this.config.rendementBrackets) {
            if (restVermogen <= 0) break;
            
            const inBracket = Math.min(restVermogen, bracket.max - bracket.min);
            const rendementInBracket = inBracket * bracket.rate;
            
            fictiefRendement += rendementInBracket;
            restVermogen -= inBracket;
            
            if (bracket.rate > 0) {
                details.push({
                    schijf: `€${bracket.min.toLocaleString('nl-NL')} - €${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString('nl-NL')}`,
                    vermogen: inBracket,
                    percentage: (bracket.rate * 100).toFixed(2) + '%',
                    rendement: rendementInBracket
                });
            }
        }
        
        const belasting = fictiefRendement * this.config.belastingTarief;
        const effectiefRendement = belastbaarVermogen > 0 ? 
            (fictiefRendement / belastbaarVermogen) * 100 : 0;
        
        return {
            bruttoVermogen: vermogen,
            schulden: schulden,
            nettoVermogen: nettoVermogen,
            vrijstelling: effectieveVrijstelling,
            belastbaarVermogen: belastbaarVermogen,
            fictiefRendement: fictiefRendement,
            grondslag: fictiefRendement,
            belasting: belasting,
            effectiefRendement: effectiefRendement,
            details: details
        };
    }
    
    /**
     * Calculate wealth required for target return after tax
     * @param {number} targetNetReturn - Desired net return in euros
     * @param {number} vrijstelling - Tax-free allowance
     * @returns {object} Required wealth calculation
     */
    calculateRequiredWealth(targetNetReturn, vrijstelling = null) {
        const effectieveVrijstelling = vrijstelling || this.config.defaultVrijstelling;
        
        // Work backwards from net return
        // Net = Gross - Tax
        // Net = Gross - (FictiefRendement * 0.31)
        // Net = Gross - (Vermogen * AvgRate * 0.31)
        
        // Simplified calculation using average rate
        const avgFictiefRendement = 0.0604; // 6.04% average
        const netRendementRate = avgFictiefRendement * (1 - this.config.belastingTarief);
        
        const requiredBelastbaarVermogen = targetNetReturn / netRendementRate;
        const requiredTotaalVermogen = requiredBelastbaarVermogen + effectieveVrijstelling;
        
        return {
            targetNetReturn,
            requiredVermogen: requiredTotaalVermogen,
            belastbaarVermogen: requiredBelastbaarVermogen,
            verwachtBrutoRendement: requiredBelastbaarVermogen * avgFictiefRendement,
            verwachteBelasting: requiredBelastbaarVermogen * avgFictiefRendement * this.config.belastingTarief,
            effectiefNettoRendement: netRendementRate * 100
        };
    }
    
    /**
     * Get Box 3 exempt assets
     * @returns {array} List of exempt assets
     */
    getExemptAssets() {
        return [
            'Eigen woning (hoofdverblijf)',
            'Inboedel en huisraad',
            'Groene beleggingen (binnen vrijstelling)',
            'Contant geld tot €551',
            'Auto\'s en andere vervoermiddelen voor privégebruik',
            'Voorwerpen van kunst en wetenschap (onder voorwaarden)',
            'Bos- en natuurterreinen (onder voorwaarden)',
            'Rechten op nog niet uitgekeerde pensioenen'
        ];
    }
    
    /**
     * Get optimization tips for Box 3
     * @param {object} calculation - Tax calculation results
     * @returns {array} Optimization suggestions
     */
    getOptimizationTips(calculation) {
        const tips = [];
        
        if (calculation.belastbaarVermogen > 0 && calculation.belastbaarVermogen < 50000) {
            tips.push({
                type: 'info',
                message: 'Overweeg groene beleggingen voor extra heffingskorting'
            });
        }
        
        if (calculation.effectiefRendement > 5.5) {
            tips.push({
                type: 'warning',
                message: 'U betaalt over een hoog fictief rendement. Werkelijk rendement kan lager zijn'
            });
        }
        
        if (calculation.schulden < calculation.bruttoVermogen * 0.1) {
            tips.push({
                type: 'info',
                message: 'Schulden zijn aftrekbaar in box 3. Een hypotheek kan fiscaal voordelig zijn'
            });
        }
        
        tips.push({
            type: 'success',
            message: `Uw heffingsvrije voet is €${calculation.vrijstelling.toLocaleString('nl-NL')}`
        });
        
        return tips;
    }
}

// Export for use in main application
window.Box3Calculator = Box3Calculator;