// Core Calculator Module - Refactored for modularity
import { Config } from '../config/config.js';
import { 
    calculateAnnuity, 
    calculateLinearPayment, 
    randomNormal, 
    deepClone,
    statistics 
} from '../utils/calculation-utils.js';
import { formatNumber } from '../utils/format-utils.js';
import { TaxFactory } from '../tax/tax-factory.js';

export class Calculator {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.taxFactory = new TaxFactory();
        
        this.data = {
            jaren: [],
            portfolio: [],
            cashReserve: [],
            lening: [],
            totaalVermogen: [],
            roi: [],
            portfolioReeel: [],
            cashReserveReeel: [],
            totaalVermogenReeel: [],
            roiReeel: [],
            monthlyData: []
        };
        
        this.results = {};
    }
    
    // Main calculation method
    calculate(inputs = null) {
        // Use provided inputs or get from state
        const inputsToUse = inputs || this.stateManager.getInputs();
        
        this.resetData();
        
        const {
            startKapitaal,
            lening,
            renteLening,
            looptijd,
            leningLooptijd,
            rendementType,
            rendement,
            aflossingsType,
            herinvestering,
            vasteKosten,
            herinvesteringDrempel,
            inflatie,
            belastingType,
            priveSubType
        } = inputsToUse;
        
        // Convert rendement to monthly if needed
        const maandRendement = rendementType === 'jaarlijks' 
            ? (Math.pow(1 + rendement / 100, 1/12) - 1) * 100 
            : rendement;
        
        // Initialize variables
        let portfolioWaarde = startKapitaal + lening;
        let cashReserve = 0;
        let leningBedrag = lening;
        const totalMonths = looptijd * 12;
        const loanMonths = leningLooptijd * 12;
        const maandKosten = vasteKosten / 12;
        
        // Calculate monthly payment
        let maandAflossing = 0;
        let maandelijkseAflossing = 0;
        
        if (lening > 0 && loanMonths > 0) {
            if (aflossingsType === 'annuitair') {
                maandAflossing = calculateAnnuity(lening, renteLening, loanMonths);
            } else if (aflossingsType === 'lineair') {
                maandelijkseAflossing = lening / loanMonths;
            }
        }
        
        // Month by month simulation
        for (let month = 0; month <= totalMonths; month++) {
            // Calculate monthly return
            const bruttoOpbrengst = portfolioWaarde * (maandRendement / 100);
            
            // Calculate interest and payment
            let maandRente = 0;
            let actualPayment = 0;
            let principalPayment = 0;
            
            if (month > 0 && month <= loanMonths && leningBedrag > 0) {
                maandRente = leningBedrag * (renteLening / 100 / 12);
                
                if (aflossingsType === 'annuitair') {
                    actualPayment = Math.min(maandAflossing, leningBedrag + maandRente);
                    principalPayment = actualPayment - maandRente;
                } else if (aflossingsType === 'lineair') {
                    principalPayment = Math.min(maandelijkseAflossing, leningBedrag);
                    actualPayment = principalPayment + maandRente;
                } else if (aflossingsType === 'aflossingsvrij') {
                    actualPayment = maandRente;
                    principalPayment = 0;
                }
            }
            
            // Calculate tax
            let belasting = 0;
            if (month > 0) {
                const huidigVermogen = portfolioWaarde + cashReserve - leningBedrag;
                belasting = this.calculateTax(
                    bruttoOpbrengst, 
                    maandRente, 
                    maandKosten, 
                    huidigVermogen, 
                    inputsToUse,
                    month
                );
            }
            
            // Net result
            const nettoOpbrengst = month > 0 ? bruttoOpbrengst - belasting : 0;
            const totaleUitgaven = month > 0 ? actualPayment + maandKosten : 0;
            const nettoResultaat = month > 0 ? nettoOpbrengst - totaleUitgaven : 0;
            
            // Store monthly data
            if (month > 0) {
                this.data.monthlyData.push({
                    month,
                    bruttoOpbrengst,
                    belasting,
                    nettoOpbrengst,
                    rente: maandRente,
                    aflossing: principalPayment,
                    kosten: maandKosten,
                    netto: nettoResultaat,
                    portfolio: portfolioWaarde,
                    cashReserve,
                    lening: leningBedrag
                });
            }
            
            // Handle cash flows
            if (month > 0) {
                if (nettoResultaat < 0) {
                    // Use cash reserve first
                    if (cashReserve >= Math.abs(nettoResultaat)) {
                        cashReserve += nettoResultaat;
                    } else {
                        // Then sell portfolio
                        const tekort = Math.abs(nettoResultaat) - cashReserve;
                        cashReserve = 0;
                        portfolioWaarde = Math.max(0, portfolioWaarde - tekort);
                    }
                } else {
                    // Positive return: split between reinvestment and cash
                    const herinvesteringBedrag = nettoResultaat * (herinvestering / 100);
                    
                    if (herinvesteringBedrag >= herinvesteringDrempel) {
                        portfolioWaarde += herinvesteringBedrag;
                        cashReserve += nettoResultaat - herinvesteringBedrag;
                    } else {
                        cashReserve += nettoResultaat;
                    }
                }
                
                // Update loan amount
                if (month <= loanMonths && leningBedrag > 0) {
                    leningBedrag = Math.max(0, leningBedrag - principalPayment);
                }
            }
            
            // Store yearly data
            if (month % 12 === 0) {
                const jaar = month / 12;
                const inflatieFactor = Math.pow(1 + inflatie / 100, jaar);
                
                this.data.jaren.push(jaar);
                this.data.portfolio.push(portfolioWaarde);
                this.data.cashReserve.push(cashReserve);
                this.data.lening.push(leningBedrag);
                
                const totaalVermogen = portfolioWaarde + cashReserve - leningBedrag;
                this.data.totaalVermogen.push(totaalVermogen);
                
                // Calculate real values
                this.data.portfolioReeel.push(portfolioWaarde / inflatieFactor);
                this.data.cashReserveReeel.push(cashReserve / inflatieFactor);
                this.data.totaalVermogenReeel.push(totaalVermogen / inflatieFactor);
                
                const roi = ((totaalVermogen - startKapitaal) / startKapitaal) * 100;
                const roiReeel = jaar > 0 ? 
                    (((totaalVermogen / inflatieFactor) - startKapitaal) / startKapitaal) * 100 : 0;
                
                this.data.roi.push(roi);
                this.data.roiReeel.push(roiReeel);
            }
        }
        
        // Calculate final results
        this.calculateFinalResults(inputsToUse);
        
        return this.results;
    }
    
    // Calculate tax using tax factory
    calculateTax(bruttoOpbrengst, maandRente, maandKosten, huidigVermogen, inputs, month) {
        // Add debug logging
        console.debug('Tax calculation inputs:', {
            inputs,
            belastingType: inputs.belastingType,
            priveSubType: inputs.priveSubType
        });

        return this.taxFactory.calculateComprehensiveTax(
            inputs,
            bruttoOpbrengst,
            maandRente,
            maandKosten,
            huidigVermogen,
            month
        ).belasting;
    }
    
    // Calculate final results
    calculateFinalResults(inputs) {
        const { startKapitaal, lening, looptijd, inflatie } = inputs;
        
        const lastIndex = this.data.jaren.length - 1;
        const finalPortfolio = this.data.portfolio[lastIndex];
        const finalCashReserve = this.data.cashReserve[lastIndex];
        const finalLening = this.data.lening[lastIndex];
        
        const finalVermogen = finalPortfolio + finalCashReserve - finalLening;
        const finalROI = ((finalVermogen - startKapitaal) / startKapitaal) * 100;
        const leverageFactor = lening > 0 ? (startKapitaal + lening) / startKapitaal : 1;
        
        const inflatieFactor = Math.pow(1 + inflatie / 100, looptijd);
        const finalVermogenReeel = finalVermogen / inflatieFactor;
        const finalROIReeel = ((finalVermogenReeel - startKapitaal) / startKapitaal) * 100;
        const koopkrachtVerlies = finalVermogen - finalVermogenReeel;
        
        this.results = {
            finalVermogen,
            finalROI,
            leverageFactor,
            finalCashReserve,
            koopkrachtVerlies,
            finalVermogenReeel,
            finalROIReeel,
            finalCashReserveReeel: finalCashReserve / inflatieFactor,
            data: this.data
        };
        
        return this.results;
    }
    
    // Get data for charts
    getChartData(useRealValues = false) {
        if (useRealValues) {
            return {
                labels: this.data.jaren,
                portfolio: this.data.portfolioReeel,
                cashReserve: this.data.cashReserveReeel,
                lening: this.data.lening,
                totaalVermogen: this.data.totaalVermogenReeel,
                roi: this.data.roiReeel
            };
        } else {
            return {
                labels: this.data.jaren,
                portfolio: this.data.portfolio,
                cashReserve: this.data.cashReserve,
                lening: this.data.lening,
                totaalVermogen: this.data.totaalVermogen,
                roi: this.data.roi
            };
        }
    }
    
    // Calculate scenario
    calculateScenario(overrides) {
        const baseInputs = this.stateManager.getInputs();
        const scenarioInputs = { ...baseInputs, ...overrides };
        
        // Store current state
        const originalData = deepClone(this.data);
        const originalResults = deepClone(this.results);
        
        // Calculate with scenario inputs
        const results = this.calculate(scenarioInputs);
        const scenarioROI = results.finalROI;
        
        // Restore original state
        this.data = originalData;
        this.results = originalResults;
        
        return scenarioROI;
    }
    
    // Run stress test
    runStressTest() {
        const inputs = this.stateManager.getInputs();
        const scenarios = [
            { name: 'Rente stijging +2%', change: { renteLening: inputs.renteLening + 2 } },
            { name: 'Rendement daling -30%', change: { rendement: inputs.rendement * 0.7 } },
            { name: 'Kosten stijging +50%', change: { vasteKosten: inputs.vasteKosten * 1.5 } },
            { name: 'Inflatie piek +5%', change: { inflatie: inputs.inflatie + 5 } },
            { name: 'Gecombineerd negatief', change: { 
                renteLening: inputs.renteLening + 1.5,
                rendement: inputs.rendement * 0.8,
                vasteKosten: inputs.vasteKosten * 1.3
            }}
        ];
        
        const baseROI = this.results.finalROI;
        
        return scenarios.map(scenario => ({
            name: scenario.name,
            roi: this.calculateScenario(scenario.change),
            impact: this.calculateScenario(scenario.change) - baseROI
        }));
    }
    
    // Run Monte Carlo simulation
    runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility) {
        const results = [];
        const baseInputs = this.stateManager.getInputs();
        
        // Store current state
        const originalData = deepClone(this.data);
        const originalResults = deepClone(this.results);
        
        for (let i = 0; i < numSimulations; i++) {
            // Generate random variations
            const rendementVariation = randomNormal() * volatility;
            const renteVariation = randomNormal() * renteVolatility;
            const kostenVariation = randomNormal() * kostenVolatility;
            
            const scenarioInputs = {
                ...baseInputs,
                rendement: baseInputs.rendement + (rendementVariation * 100),
                renteLening: Math.max(0, baseInputs.renteLening + (renteVariation * 100)),
                vasteKosten: Math.max(0, baseInputs.vasteKosten * (1 + kostenVariation))
            };
            
            // Calculate this scenario
            const scenarioResults = this.calculate(scenarioInputs);
            
            results.push({
                simulation: i + 1,
                roi: scenarioResults.finalROI,
                finalValue: scenarioResults.finalVermogen,
                inputs: { 
                    rendement: scenarioInputs.rendement, 
                    rente: scenarioInputs.renteLening, 
                    kosten: scenarioInputs.vasteKosten 
                }
            });
        }
        
        // Restore original state
        this.data = originalData;
        this.results = originalResults;
        
        // Sort results and calculate statistics
        results.sort((a, b) => a.roi - b.roi);
        
        const roiValues = results.map(r => r.roi);
        const finalValues = results.map(r => r.finalValue);
        
        return {
            mean: statistics.mean(roiValues),
            median: statistics.median(roiValues),
            p5: statistics.percentile(roiValues, 5),
            p95: statistics.percentile(roiValues, 95),
            lossProb: (results.filter(r => r.roi < 0).length / numSimulations) * 100,
            vaR5: statistics.percentile(finalValues.map(v => v - baseInputs.startKapitaal), 5),
            results: results
        };
    }
    
    // Get waterfall data
    getWaterfallData(period) {
        if (this.data.monthlyData.length === 0) {
            return { data: [], totals: {} };
        }
        
        const inputs = this.stateManager.getInputs();
        
        if (period === 'totaal') {
            return this.getWaterfallTotalPeriod(inputs);
        } else {
            return this.getWaterfallYearPeriod(period, inputs);
        }
    }
    
    getWaterfallTotalPeriod(inputs) {
        // Aggregate all data
        const totals = this.data.monthlyData.reduce((acc, month) => {
            acc.bruttoOpbrengst += month.bruttoOpbrengst;
            acc.belasting += month.belasting;
            acc.rente += month.rente;
            acc.aflossing += month.aflossing;
            acc.kosten += month.kosten;
            return acc;
        }, { bruttoOpbrengst: 0, belasting: 0, rente: 0, aflossing: 0, kosten: 0 });
        
        const finalValue = this.data.totaalVermogen[this.data.totaalVermogen.length - 1];
        
        return {
            data: [
                { label: 'Start Kapitaal', value: inputs.startKapitaal, type: 'start' },
                { label: 'Lening', value: inputs.lening, type: 'positive' },
                { label: 'Bruto Rendement', value: totals.bruttoOpbrengst, type: 'positive' },
                { label: 'Belasting', value: -totals.belasting, type: 'negative' },
                { label: 'Rente Kosten', value: -totals.rente, type: 'negative' },
                { label: 'Aflossingen', value: -totals.aflossing, type: 'negative' },
                { label: 'Vaste Kosten', value: -totals.kosten, type: 'negative' },
                { label: 'Eindwaarde', value: finalValue, type: 'total' }
            ],
            totals,
            finalValue
        };
    }
    
    getWaterfallYearPeriod(period, inputs) {
        const year = parseInt(period.replace('jaar', ''));
        const startMonth = (year - 1) * 12;
        const endMonth = Math.min(year * 12, this.data.monthlyData.length);
        
        if (startMonth >= this.data.monthlyData.length) {
            return { data: [], totals: {} };
        }
        
        const yearData = this.data.monthlyData.slice(startMonth, endMonth);
        const yearTotals = yearData.reduce((acc, month) => {
            acc.bruttoOpbrengst += month.bruttoOpbrengst;
            acc.belasting += month.belasting;
            acc.rente += month.rente;
            acc.aflossing += month.aflossing;
            acc.kosten += month.kosten;
            return acc;
        }, { bruttoOpbrengst: 0, belasting: 0, rente: 0, aflossing: 0, kosten: 0 });
        
        const startValue = year > 0 && this.data.totaalVermogen[year - 1] !== undefined
            ? this.data.totaalVermogen[year - 1]
            : inputs.startKapitaal;
        
        const endValue = this.data.totaalVermogen[year] || startValue;
        
        return {
            data: [
                { label: 'Begin Saldo', value: startValue, type: 'start' },
                { label: 'Bruto Rendement', value: yearTotals.bruttoOpbrengst, type: 'positive' },
                { label: 'Belasting', value: -yearTotals.belasting, type: 'negative' },
                { label: 'Rente Kosten', value: -yearTotals.rente, type: 'negative' },
                { label: 'Aflossingen', value: -yearTotals.aflossing, type: 'negative' },
                { label: 'Vaste Kosten', value: -yearTotals.kosten, type: 'negative' },
                { label: 'Eind Saldo', value: endValue, type: 'total' }
            ],
            totals: yearTotals,
            finalValue: endValue
        };
    }
    
    // Reset data
    resetData() {
        this.data = {
            jaren: [],
            portfolio: [],
            cashReserve: [],
            lening: [],
            totaalVermogen: [],
            roi: [],
            portfolioReeel: [],
            cashReserveReeel: [],
            totaalVermogenReeel: [],
            roiReeel: [],
            monthlyData: []
        };
    }
    
    // Export state
    exportState() {
        return {
            inputs: this.stateManager.getInputs(),
            results: this.results,
            data: this.data,
            timestamp: new Date().toISOString()
        };
    }
}