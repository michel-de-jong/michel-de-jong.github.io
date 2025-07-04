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
            showRealValues: document.getElementById('inflatieToggle').checked,
            belastingType: document.getElementById('belastingType').value || 'zakelijk',
            vpbTarief: parseFloat(document.getElementById('vpbTarief').value) || 25.8,
            box3Tarief: parseFloat(document.getElementById('box3Tarief').value) || 36
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
        let totaalBelastingBetaald = 0;
        const totalMonths = looptijd * 12;
        const loanMonths = leningLooptijd * 12;
        const maandKosten = vasteKosten / 12;
        
        // Calculate monthly payment based on type
        let maandAflossing = 0;
        let maandelijkseAflossing = 0;
        
        if (lening > 0 && loanMonths > 0) {
            if (aflossingsType === 'annuitair') {
                maandAflossing = Utils.calculateAnnuity(lening, renteLening, loanMonths);
            } else if (aflossingsType === 'lineair') {
                maandelijkseAflossing = lening / loanMonths;
            }
        }
        
        // Month by month simulation
        for (let month = 0; month <= totalMonths; month++) {
            // Calculate monthly return
            const maandOpbrengst = portfolioWaarde * (maandRendement / 100);
            
            // Calculate interest and payment only if loan is still active
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
            
            // Net result before reinvestment
            const nettoResultaat = month > 0 ? maandOpbrengst - actualPayment - maandKosten : 0;
            
            // Store monthly data for waterfall
            if (month > 0) {
                this.data.monthlyData.push({
                    month: month,
                    opbrengst: maandOpbrengst,
                    rente: maandRente,
                    aflossing: principalPayment,
                    kosten: maandKosten,
                    belasting: 0, // Will be set below if applicable
                    netto: nettoResultaat,
                    portfolio: portfolioWaarde,
                    cashReserve: cashReserve,
                    lening: leningBedrag
                });
            }
            
            // Handle cash flows (skip month 0)
            if (month > 0) {
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
                    const cashFlowBedrag = nettoResultaat - herinvesteringBedrag;
                    
                    // Calculate tax on cash flow (not reinvested amount)
                    let belasting = 0;
                    if (cashFlowBedrag > 0) {
                        if (this.inputs.belastingType === 'zakelijk') {
                            // VPB over winst (na aftrek van rente)
                            // Use rate from config if available, otherwise use form value
                            const vpbRate = (Config.tax?.VPB_RATE || this.inputs.vpbTarief / 100);
                            belasting = cashFlowBedrag * vpbRate;
                        } else {
                            // Box 3 - forfaitair rendement
                            // Use rates from config if available
                            const box3Rate = (Config.tax?.BOX3_RATE || this.inputs.box3Tarief / 100);
                            const fictiefRendement = (Config.tax?.BOX3_FICTIEF || 0.0604);
                            const fictievRendementBedrag = (portfolioWaarde + cashReserve) * fictiefRendement / 12;
                            belasting = fictievRendementBedrag * box3Rate;
                        }
                        totaalBelastingBetaald += belasting;
                        
                        // Update monthly data with tax
                        if (month > 0 && this.data.monthlyData[month - 1]) {
                            this.data.monthlyData[month - 1].belasting = belasting;
                        }
                    }
                    
                    // Check reinvestment threshold
                    if (herinvesteringBedrag >= herinvesteringDrempel) {
                        portfolioWaarde += herinvesteringBedrag;
                        cashReserve += cashFlowBedrag - belasting;
                    } else {
                        cashReserve += nettoResultaat - belasting;
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
                
                // Calculate real values (inflation adjusted)
                this.data.portfolioReeel.push(portfolioWaarde / inflatieFactor);
                this.data.cashReserveReeel.push(cashReserve / inflatieFactor);
                this.data.totaalVermogenReeel.push(totaalVermogen / inflatieFactor);
                
                const roi = ((totaalVermogen - startKapitaal) / startKapitaal) * 100;
                const roiReeel = jaar > 0 ? (((totaalVermogen / inflatieFactor) - startKapitaal) / startKapitaal) * 100 : 0;
                
                this.data.roi.push(roi);
                this.data.roiReeel.push(roiReeel);
            }
        }
        
        // Calculate final results
        this.calculateFinalResults();
        
        // Store total tax paid
        this.results.totaalBelastingBetaald = totaalBelastingBetaald;
        
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
        if (this.data.monthlyData.length === 0) {
            return { data: [], totals: {} };
        }
        
        if (period === 'totaal') {
            // Aggregate all data
            const totals = this.data.monthlyData.reduce((acc, month) => {
                acc.opbrengst += month.opbrengst;
                acc.rente += month.rente;
                acc.aflossing += month.aflossing;
                acc.kosten += month.kosten;
                acc.belasting += month.belasting || 0;
                return acc;
            }, { opbrengst: 0, rente: 0, aflossing: 0, kosten: 0, belasting: 0 });
            
            const finalValue = this.data.totaalVermogen[this.data.totaalVermogen.length - 1];
            
            return {
                data: [
                    { label: 'Start Kapitaal', value: this.inputs.startKapitaal, type: 'start' },
                    { label: 'Lening', value: this.inputs.lening, type: 'positive' },
                    { label: 'Rendement', value: totals.opbrengst, type: 'positive' },
                    { label: 'Rente Kosten', value: -totals.rente, type: 'negative' },
                    { label: 'Aflossingen', value: -totals.aflossing, type: 'negative' },
                    { label: 'Vaste Kosten', value: -totals.kosten, type: 'negative' },
                    { label: 'Belasting', value: -totals.belasting, type: 'negative' },
                    { label: 'Eindwaarde', value: finalValue, type: 'total' }
                ],
                totals
            };
        } else {
            // Get specific year data
            const year = parseInt(period.replace('jaar', ''));
            const startMonth = (year - 1) * 12;
            const endMonth = Math.min(year * 12, this.data.monthlyData.length);
            
            if (startMonth >= this.data.monthlyData.length) {
                return { data: [], totals: {} };
            }
            
            const yearData = this.data.monthlyData.slice(startMonth, endMonth);
            const yearTotals = yearData.reduce((acc, month) => {
                acc.opbrengst += month.opbrengst;
                acc.rente += month.rente;
                acc.aflossing += month.aflossing;
                acc.kosten += month.kosten;
                acc.belasting += month.belasting || 0;
                return acc;
            }, { opbrengst: 0, rente: 0, aflossing: 0, kosten: 0, belasting: 0 });
            
            const startValue = year > 0 && this.data.totaalVermogen[year - 1] !== undefined
                ? this.data.totaalVermogen[year - 1]
                : this.inputs.startKapitaal;
            
            const endValue = this.data.totaalVermogen[year] || startValue;
            
            return {
                data: [
                    { label: 'Begin Saldo', value: startValue, type: 'start' },
                    { label: 'Rendement', value: yearTotals.opbrengst, type: 'positive' },
                    { label: 'Rente Kosten', value: -yearTotals.rente, type: 'negative' },
                    { label: 'Aflossingen', value: -yearTotals.aflossing, type: 'negative' },
                    { label: 'Vaste Kosten', value: -yearTotals.kosten, type: 'negative' },
                    { label: 'Belasting', value: -yearTotals.belasting, type: 'negative' },
                    { label: 'Eind Saldo', value: endValue, type: 'total' }
                ],
                totals: yearTotals
            };
        }
    }
    
    // Calculate scenario with specific overrides
    calculateScenario(overrides) {
        // Create a temporary calculator instance to avoid affecting the main calculation
        const tempCalc = new ROICalculator();
        
        // Get current form values
        const currentValues = this.getInputValues();
        
        // Apply overrides to the temporary calculator
        tempCalc.inputs = { ...currentValues, ...overrides };
        
        // Perform calculation with temporary values
        tempCalc.resetData();
        
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
        } = tempCalc.inputs;
        
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
                maandAflossing = Utils.calculateAnnuity(lening, renteLening, loanMonths);
            } else if (aflossingsType === 'lineair') {
                maandelijkseAflossing = lening / loanMonths;
            }
        }
        
        // Simulate months
        for (let month = 1; month <= totalMonths; month++) {
            const maandOpbrengst = portfolioWaarde * (maandRendement / 100);
            
            let maandRente = 0;
            let actualPayment = 0;
            let principalPayment = 0;
            
            if (month <= loanMonths && leningBedrag > 0) {
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
            
            const nettoResultaat = maandOpbrengst - actualPayment - maandKosten;
            
            if (nettoResultaat < 0) {
                if (cashReserve >= Math.abs(nettoResultaat)) {
                    cashReserve += nettoResultaat;
                } else {
                    const tekort = Math.abs(nettoResultaat) - cashReserve;
                    cashReserve = 0;
                    portfolioWaarde = Math.max(0, portfolioWaarde - tekort);
                }
            } else {
                const herinvesteringBedrag = nettoResultaat * (herinvestering / 100);
                
                if (herinvesteringBedrag >= herinvesteringDrempel) {
                    portfolioWaarde += herinvesteringBedrag;
                    cashReserve += nettoResultaat - herinvesteringBedrag;
                } else {
                    cashReserve += nettoResultaat;
                }
            }
            
            if (month <= loanMonths && leningBedrag > 0) {
                leningBedrag = Math.max(0, leningBedrag - principalPayment);
            }
        }
        
        // Calculate final ROI
        const finalVermogen = portfolioWaarde + cashReserve - leningBedrag;
        const finalROI = ((finalVermogen - startKapitaal) / startKapitaal) * 100;
        
        return finalROI;
    }
    
    // Run stress test
    runStressTest() {
        const baseROI = this.results.finalROI;
        
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
        
        const results = scenarios.map(scenario => {
            const roi = this.calculateScenario(scenario.change);
            return {
                name: scenario.name,
                roi: roi,
                impact: roi - baseROI
            };
        });
        
        return results;
    }
    
    // Monte Carlo simulation
    runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility) {
        const results = [];
        const baseInputs = this.getInputValues();
        
        for (let i = 0; i < numSimulations; i++) {
            // Generate random variations using normal distribution
            const rendementVariation = Utils.randomNormal() * volatility;
            const renteVariation = Utils.randomNormal() * renteVolatility;
            const kostenVariation = Utils.randomNormal() * kostenVolatility;
            
            // Apply variations - ensure they create realistic scenarios
            const simulationInputs = {
                rendement: baseInputs.rendement + rendementVariation,
                renteLening: Math.max(0, baseInputs.renteLening + renteVariation),
                vasteKosten: Math.max(0, baseInputs.vasteKosten * (1 + kostenVariation))
            };
            
            // Calculate ROI for this simulation
            const roi = this.calculateScenario(simulationInputs);
            
            // Calculate final value for VaR
            const tempCalc = new ROICalculator();
            tempCalc.inputs = { ...baseInputs, ...simulationInputs };
            tempCalc.calculate();
            const finalValue = tempCalc.results.finalVermogen || 0;
            
            results.push({
                simulation: i + 1,
                roi: roi,
                finalValue: finalValue,
                inputs: simulationInputs
            });
        }
        
        // Sort results for statistics
        results.sort((a, b) => a.roi - b.roi);
        
        // Calculate statistics
        const roiValues = results.map(r => r.roi);
        const finalValues = results.map(r => r.finalValue);
        
        const stats = {
            mean: Utils.statistics.mean(roiValues),
            median: Utils.statistics.median(roiValues),
            p5: Utils.statistics.percentile(roiValues, 5),
            p95: Utils.statistics.percentile(roiValues, 95),
            lossProb: (roiValues.filter(r => r < 0).length / numSimulations) * 100,
            vaR5: Utils.statistics.percentile(finalValues.map(v => v - baseInputs.startKapitaal), 5),
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