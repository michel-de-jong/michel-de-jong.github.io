// VPB (Vennootschapsbelasting) Calculator Module
import { Config } from '../config/config.js';

export class VPBCalculator {
    constructor() {
        this.config = {
            standardRate: Config.tax.VPB_RATE,
            lowRate: Config.tax.VPB_LOW_RATE,
            lowThreshold: Config.tax.VPB_LOW_THRESHOLD
        };
    }
    
    calculate(bruttoOpbrengst, maandRente, maandKosten, herinvestering) {
        const belastbareWinst = Math.max(0, bruttoOpbrengst - maandRente - maandKosten);
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        let belasting = 0;
        
        if (uitgekeerdeDeel <= this.config.lowThreshold / 12) {
            belasting = uitgekeerdeDeel * this.config.lowRate;
        } else {
            const lowPart = this.config.lowThreshold / 12;
            const highPart = uitgekeerdeDeel - lowPart;
            belasting = (lowPart * this.config.lowRate) + (highPart * this.config.standardRate);
        }
        
        return belasting;
    }
    
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

// For backwards compatibility - will be removed in future version
if (typeof window !== 'undefined') {
    window.VPBCalculator = VPBCalculator;
}