// VPB (Vennootschapsbelasting) Calculator Module

class VPBCalculator {
    constructor() {
        this.config = {
            standardRate: Config.tax.VPB_RATE,
            lowRate: Config.tax.VPB_LOW_RATE,
            lowThreshold: Config.tax.VPB_LOW_THRESHOLD
        };
    }
    
    /**
     * Calculate VPB tax
     * @param {number} bruttoOpbrengst - Gross revenue
     * @param {number} maandRente - Monthly interest costs
     * @param {number} maandKosten - Monthly fixed costs
     * @param {number} herinvestering - Reinvestment percentage
     * @returns {number} Tax amount
     */
    calculate(bruttoOpbrengst, maandRente, maandKosten, herinvestering) {
        // Belastbare winst = bruto rendement - aftrekbare kosten
        const belastbareWinst = Math.max(0, bruttoOpbrengst - maandRente - maandKosten);
        
        // Voor VPB: alleen belasting over uitgekeerde winst (niet herinvesteerde deel)
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        // Apply progressive rate if applicable
        let belasting = 0;
        
        if (uitgekeerdeDeel <= this.config.lowThreshold / 12) {
            // Apply low rate for amounts under threshold (monthly calculation)
            belasting = uitgekeerdeDeel * this.config.lowRate;
        } else {
            // Apply low rate up to threshold, standard rate for remainder
            const lowPart = this.config.lowThreshold / 12;
            const highPart = uitgekeerdeDeel - lowPart;
            belasting = (lowPart * this.config.lowRate) + (highPart * this.config.standardRate);
        }
        
        return belasting;
    }
    
    /**
     * Calculate annual VPB
     * @param {number} jaarWinst - Annual profit
     * @param {number} jaarRente - Annual interest costs
     * @param {number} jaarKosten - Annual fixed costs
     * @param {number} herinvestering - Reinvestment percentage
     * @returns {object} Tax calculation details
     */
    calculateAnnual(jaarWinst, jaarRente, jaarKosten, herinvestering) {
        const belastbareWinst = Math.max(0, jaarWinst - jaarRente - jaarKosten);
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        let belasting = 0;
        let effectiefTarief = 0;
        
        if (uitgekeerdeDeel > 0) {
            if (uitgekeerdeDeel <= this.config.lowThreshold) {
                belasting = uitgekeerdeDeel * this.config.lowRate;
            } else {
                belasting = (this.config.lowThreshold * this.config.lowRate) + 
                           ((uitgekeerdeDeel - this.config.lowThreshold) * this.config.standardRate);
            }
            
            effectiefTarief = (belasting / uitgekeerdeDeel) * 100;
        }
        
        return {
            belastbareWinst,
            uitgekeerdeDeel,
            herinvesteerdDeel: belastbareWinst - uitgekeerdeDeel,
            belasting,
            effectiefTarief,
            nettoUitkering: uitgekeerdeDeel - belasting
        };
    }
    
    /**
     * Get tax deductible items
     * @returns {array} List of deductible items
     */
    getDeductibleItems() {
        return [
            'Rente op zakelijke leningen',
            'Bedrijfskosten en algemene kosten',
            'Afschrijvingen',
            'Personeelskosten',
            'Huisvestingskosten',
            'Marketing en acquisitie',
            'Professionele diensten',
            'Verliescompensatie voorgaande jaren'
        ];
    }
    
    /**
     * Get tax optimization tips
     * @param {object} calculation - Tax calculation results
     * @returns {array} Optimization suggestions
     */
    getOptimizationTips(calculation) {
        const tips = [];
        
        if (calculation.effectiefTarief > 20) {
            tips.push({
                type: 'info',
                message: 'Overweeg hogere herinvestering om belastingdruk te verlagen'
            });
        }
        
        if (calculation.uitgekeerdeDeel > this.config.lowThreshold * 1.5) {
            tips.push({
                type: 'warning',
                message: 'U betaalt het hoge VPB tarief. Overweeg winst over meerdere jaren te spreiden'
            });
        }
        
        if (calculation.herinvesteerdDeel > calculation.uitgekeerdeDeel * 3) {
            tips.push({
                type: 'success',
                message: 'Goede herinvesteringsstrategie voor fiscale optimalisatie'
            });
        }
        
        return tips;
    }
}

// Export for use in main application
window.VPBCalculator = VPBCalculator;