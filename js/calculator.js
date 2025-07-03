// Core Calculator Logic for ROI Calculator

class ROICalculator {
    constructor() {
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
        
        this.inputs = {};
        this.results = {};
    }
    
    // Get input values from form
    getInputValues() {
        this.inputs = {
            startKapitaal: parseFloat(document.getElementById('startKapitaal').value) || 0,
            lening: parseFloat(document.getElementById('lening').value) || 0,
            renteLening: parseFloat(document.getElementById('renteLening').value) || 0,
            looptijd: parseInt(document.getElementById('looptijd').value) || 10,
            leningLooptijd: parseInt(document.getElementById('leningLooptijd').value) || 10,
            rendementType: document.getElementById('rendementType').value,
            rendement: parseFloat(document.getElementById('rendement').value) || 0,
            aflossingsType: document.getElementById('aflossingsType').value,
            herinvestering: parseFloat(document.getElementById('herinvestering').value) || 0,
            vasteKosten: parseFloat(document.getElementById('vasteKosten').value) || 0,
            herinvesteringDrempel: parseFloat(document.getElementById('herinvesteringDrempel').value) || 0,
            inflatie: parseFloat(document.getElementById('inflatie').value) || 0,
            showRealValues: document.getElementById('inflatieToggle').checked
        };
        
        return this.inputs;
    }
    
    // Main calculation method
    calculate() {
        this.getInputValues();
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
            inflatie
        } = this.inputs;
        
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
        
        // Calculate monthly payment based on type
        let maandAflossing = 0;
        
        if (aflossingsType === 'annuitair' && loanMonths > 0) {
            maandAflossing = Utils.calculateAnnuity(lening, renteLening, loanMonths);
        } else if (aflossingsType === 'lineair' && loanMonths > 0) {
            maandAflossing = lening / loanMonths;
        }
        
        // Month by month simulation
        for (let month = 0; month <= totalMonths; month++) {
            // Calculate monthly return
            const maandOpbrengst = portfolioWaarde * (maandRendement / 100);
            
            // Calculate interest and payment only if loan is still active
            let maandRente = 0;
            let actualPayment = 0;
            
            if (month < loanMonths && leningBedrag > 0) {
                maandRente = leningBedrag * (renteLening / 100 / 12);
                
                if (aflossingsType === 'annuitair') {
                    actualPayment = maandAflossing;
                } else if (aflossingsType === 'lineair') {
                    actualPayment = maandAflossing + maandRente;
                } else if (aflossingsType === 'aflossingsvrij') {
                    actualPayment = maandRente;
                }
                
                // Ensure we don't pay more than the remaining loan
                if (aflossingsType !== 'aflossingsvrij') {
                    const principalPayment = actualPayment - maandRente;
                    if (principalPayment > leningBedrag) {
                        actualPayment = leningBedrag + maandRente;
                    }
                }
            }
            
            // Net result before reinvestment
            const nettoResultaat = maandOpbrengst - actualPayment - maandKosten;
            
            // Store monthly data for waterfall
            if (month > 0) {
                this.data.monthlyData.push({
                    month: month,
                    opbrengst: maandOpbrengst,
                    rente: maandRente,
                    aflossing: actualPayment - maandRente,
                    kosten: maandKosten,
                    netto: nettoResultaat,
                    portfolio: portfolioWaarde,
                    cashReserve: cashReserve,
                    lening: leningBedrag
                });
            }
            
            // Handle negative returns
            if (nettoResultaat < 0) {
                // First use cash reserve
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
                
                // Check reinvestment threshold
                if (herinvesteringBedrag >= herinvesteringDrempel) {
                    portfolioWaarde += herinvesteringBedrag;
                    cashReserve += nettoResultaat - herinvesteringBedrag;
                } else {
                    cashReserve += nettoResultaat;
                }
            }
            
            // Update loan amount
            if (month < loanMonths && aflossingsType !== 'aflossingsvrij' && leningBedrag > 0) {
                const principalPayment = actualPayment - maandRente;
                leningBedrag = Math.max(0, leningBedrag - principalPayment);
            }
            
            // Store yearly data
            if (month % 12 === 0) {
                const jaar = month / 12;
                const inflatieFactor = Math.pow(1 + inflatie / 100, jaar);
                
                this.data.jaren.push(jaar);
                this.data.portfolio.push(portfolioWaarde);
                this.data.cashReserve.push(cashReserve);
                this.data.lening.push(leningBedrag);
                this.data.totaalVermogen.push(portfolioWaarde + cashReserve - leningBedrag);
                
                // Calculate real values (inflation adjusted)
                this.data.portfolioReeel.push(portfolioWaarde / inflatieFactor);
                this.data.cashReserveReeel.push(cashReserve / inflatieFactor);
                this.data.totaalVermogenReeel.push((portfolioWaarde + cashReserve - leningBedrag) / inflatieFactor);
                
                const roi = ((portfolioWaarde + cashReserve - leningBedrag - startKapitaal) / startKapitaal) * 100;
                const roiReeel = (((portfolioWaarde + cashReserve - leningBedrag) / inflatieFactor - startKapitaal) / startKapitaal) * 100;
                
                this.data.roi.push(roi);
                this.data.roiReeel.push(roiReeel);
            }
        }
        
        // Calculate final results
        this.calculateFinalResults();
        
        return this.data;
    }
    
    // Calculate final results and KPIs
    calculateFinalResults() {
        const { startKapitaal, lening, looptijd, inflatie } = this.inputs;
        
        const lastIndex = this.data.jaren.length - 1;
        const finalPortfolio = this.data.portfolio[lastIndex];
        const finalCashReserve = this.data.cashReserve[lastIndex];
        const finalLening = this.data.lening[lastIndex];
        
        const finalVermogen = finalPortfolio + finalCashReserve - finalLening;
        const finalROI = ((finalVermogen - startKapitaal) / startKapitaal) * 100;
        const leverageFactor = (startKapitaal + lening) / startKapitaal;
        
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
            finalCashReserveReeel: finalCashReserve / inflatieFactor
        };
        
        return this.results;
    }
    
    // Reset calculation data
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
    
    // Get waterfall data for specific period
    getWaterfallData(period) {
        if (period === 'totaal') {
            // Aggregate all data
            const totals = this.data.monthlyData.reduce((acc, month) => {
                acc.opbrengst += month.opbrengst;
                acc.rente += month.rente;
                acc.aflossing += month.aflossing;
                acc.kosten += month.kosten;
                return acc;
            }, { opbrengst: 0, rente: 0, aflossing: 0, kosten: 0 });
            
            return {
                data: [
                    { label: 'Start Kapitaal', value: this.inputs.startKapitaal, type: 'start' },
                    { label: 'Lening', value: this.inputs.lening, type: 'positive' },
                    { label: 'Rendement', value: totals.opbrengst, type: 'positive' },
                    { label: 'Rente Kosten', value: -totals.rente, type: 'negative' },
                    { label: 'Aflossingen', value: -totals.aflossing, type: 'negative' },
                    { label: 'Vaste Kosten', value: -totals.kosten, type: 'negative' },
                    { label: 'Eindwaarde', value: 0, type: 'total' }
                ],
                totals
            };
        } else {
            // Get specific year data
            const year = parseInt(period.replace('jaar', ''));
            const startMonth = (year - 1) * 12;
            const endMonth = Math.min(year * 12, this.data.monthlyData.length);
            
            const yearData = this.data.monthlyData.slice(startMonth, endMonth);
            const yearTotals = yearData.reduce((acc, month) => {
                acc.opbrengst += month.opbrengst;
                acc.rente += month.rente;
                acc.aflossing += month.aflossing;
                acc.kosten += month.kosten;
                return acc;
            }, { opbrengst: 0, rente: 0, aflossing: 0, kosten: 0 });
            
            const startValue = startMonth > 0 
                ? this.data.monthlyData[startMonth - 1].portfolio + this.data.monthlyData[startMonth - 1].cashReserve - this.data.monthlyData[startMonth - 1].lening
                : this.inputs.startKapitaal;
            
            return {
                data: [
                    { label: 'Begin Saldo', value: startValue, type: 'start' },
                    { label: 'Rendement', value: yearTotals.opbrengst, type: 'positive' },
                    { label: 'Rente Kosten', value: -yearTotals.rente, type: 'negative' },
                    { label: 'Aflossingen', value: -yearTotals.aflossing, type: 'negative' },
                    { label: 'Vaste Kosten', value: -yearTotals.kosten, type: 'negative' },
                    { label: 'Eind Saldo', value: 0, type: 'total' }
                ],
                totals: yearTotals
            };
        }
    }
    
    // Calculate scenario
    calculateScenario(overrides) {
        const originalInputs = { ...this.inputs };
        Object.assign(this.inputs, overrides);
        
        const result = this.calculate();
        const roi = this.results.finalROI;
        
        // Restore original inputs
        this.inputs = originalInputs;
        
        return roi;
    }
    
    // Run stress test
    runStressTest() {
        const scenarios = [
            { name: 'Rente stijging +2%', change: { renteLening: this.inputs.renteLening + 2 } },
            { name: 'Rendement daling -30%', change: { rendement: this.inputs.rendement * 0.7 } },
            { name: 'Kosten stijging +50%', change: { vasteKosten: this.inputs.vasteKosten * 1.5 } },
            { name: 'Inflatie piek +5%', change: { inflatie: this.inputs.inflatie + 5 } },
            { name: 'Gecombineerd negatief', change: { 
                renteLening: this.inputs.renteLening + 1.5,
                rendement: this.inputs.rendement * 0.8,
                vasteKosten: this.inputs.vasteKosten * 1.3
            }}
        ];
        
        const results = scenarios.map(scenario => ({
            name: scenario.name,
            roi: this.calculateScenario(scenario.change),
            impact: this.calculateScenario(scenario.change) - this.results.finalROI
        }));
        
        // Restore original calculation
        this.calculate();
        
        return results;
    }
    
    // Monte Carlo simulation
    runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility) {
        const results = [];
        const baseInputs = { ...this.inputs };
        
        for (let i = 0; i < numSimulations; i++) {
            // Generate random variations using normal distribution
            const rendement = baseInputs.rendement + (Utils.randomNormal() * volatility * baseInputs.rendement);
            const rente = Math.max(0, baseInputs.renteLening + (Utils.randomNormal() * renteVolatility * baseInputs.renteLening));
            const kosten = Math.max(0, baseInputs.vasteKosten + (Utils.randomNormal() * kostenVolatility));
            
            // Apply variations
            this.inputs.rendement = rendement;
            this.inputs.renteLening = rente;
            this.inputs.vasteKosten = kosten;
            
            // Calculate
            this.calculate();
            
            results.push({
                simulation: i + 1,
                roi: this.results.finalROI,
                finalValue: this.results.finalVermogen,
                inputs: { rendement, rente, kosten }
            });
        }
        
        // Restore original inputs
        this.inputs = baseInputs;
        this.calculate();
        
        // Sort results for statistics
        results.sort((a, b) => a.roi - b.roi);
        
        // Calculate statistics
        const stats = {
            mean: Utils.statistics.mean(results.map(r => r.roi)),
            median: Utils.statistics.median(results.map(r => r.roi)),
            p5: Utils.statistics.percentile(results.map(r => r.roi), 5),
            p95: Utils.statistics.percentile(results.map(r => r.roi), 95),
            lossProb: results.filter(r => r.roi < 0).length / numSimulations * 100,
            vaR5: Utils.statistics.percentile(results.map(r => r.finalValue - baseInputs.startKapitaal), 5),
            results: results
        };
        
        return stats;
    }
    
    // Export current state
    exportState() {
        return {
            inputs: this.inputs,
            results: this.results,
            data: this.data,
            timestamp: new Date().toISOString()
        };
    }
    
    // Import state
    importState(state) {
        if (state.inputs) this.inputs = state.inputs;
        if (state.results) this.results = state.results;
        if (state.data) this.data = state.data;
    }
}

// Create global calculator instance
window.calculator = new ROICalculator();