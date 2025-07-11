// ==================================================
// vpb-calculator.js - VPB Calculator Module
// ==================================================
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

// ==================================================
// box1-calculator.js - Box 1 Calculator Module
// ==================================================
import { Config } from '../config/config.js';

export class Box1Calculator {
    constructor() {
        this.config = {
            brackets: Config.tax.BOX1_BRACKETS,
            defaultRate: Config.tax.DEFAULT_BOX1_RATE,
            renteAftrekPercentage: 0.5
        };
    }
    
    calculate(bruttoOpbrengst, maandRente, maandKosten, box1Tarief, herinvestering) {
        const aftrekbareRente = maandRente * this.config.renteAftrekPercentage;
        const belastbareWinst = Math.max(0, bruttoOpbrengst - aftrekbareRente - maandKosten);
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        const tariefDecimaal = box1Tarief / 100;
        
        return uitgekeerdeDeel * tariefDecimaal;
    }
    
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
    
    getMarginalRate(inkomen) {
        for (const bracket of this.config.brackets) {
            if (inkomen >= bracket.min && inkomen < bracket.max) {
                return bracket.rate;
            }
        }
        return this.config.brackets[this.config.brackets.length - 1].rate;
    }
    
    calculateHypotheekrenteAftrek(eigenwoningSchuld, rentePercentage) {
        const jaarRente = eigenwoningSchuld * (rentePercentage / 100);
        
        return {
            bruttoRente: jaarRente,
            aftrekbaarBedrag: jaarRente,
            belastingvoordeel: jaarRente * this.config.defaultRate
        };
    }
    
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

// ==================================================
// box3-calculator.js - Box 3 Calculator Module  
// ==================================================
import { Config } from '../config/config.js';

export class Box3Calculator {
    constructor() {
        this.config = {
            rendementBrackets: Config.tax.BOX3_RENDEMENT_BRACKETS,
            belastingTarief: Config.tax.BOX3_BELASTING_TARIEF,
            defaultRendement: Config.tax.DEFAULT_BOX3_RENDEMENT,
            defaultVrijstelling: Config.defaults.box3Vrijstelling
        };
    }
    
    calculate(huidigVermogen, box3Rendement, box3Tarief, box3Vrijstelling, month) {
        // Box 3 wordt jaarlijks berekend, niet maandelijks
        if (month % 12 !== 0) {
            return 0;
        }
        
        const belastbaarVermogen = Math.max(0, huidigVermogen - box3Vrijstelling);
        
        if (belastbaarVermogen <= 0) {
            return 0;
        }
        
        const fictiefRendement = belastbaarVermogen * (box3Rendement / 100);
        const jaarlijkseBelasting = fictiefRendement * (box3Tarief / 100);
        
        // Verdeel over 12 maanden
        return jaarlijkseBelasting / 12;
    }
    
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
    
    calculateRequiredWealth(targetNetReturn, vrijstelling = null) {
        const effectieveVrijstelling = vrijstelling || this.config.defaultVrijstelling;
        const avgFictiefRendement = 0.0604;
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