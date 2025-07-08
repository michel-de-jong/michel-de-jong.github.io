// Core Calculator Logic for ROI Calculator - IMPROVED VERSION WITH ADVANCED TAX CALCULATIONS

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
            
            // Belasting configuratie
            belastingType: document.getElementById('belastingType').value,
            priveSubType: document.getElementById('priveSubType') ? document.getElementById('priveSubType').value : 'box1',
            box1Tarief: parseFloat(document.getElementById('box1Tarief')?.value) || Config.defaults.box1Tarief,
            box3Rendement: parseFloat(document.getElementById('box3Rendement')?.value) || Config.defaults.box3Rendement,
            box3Tarief: parseFloat(document.getElementById('box3Tarief')?.value) || Config.defaults.box3Tarief,
            box3Vrijstelling: parseFloat(document.getElementById('box3Vrijstelling')?.value) || Config.defaults.box3Vrijstelling
        };
        
        return this.inputs;
    }
    
    // Main calculation method
    calculate(customInputs = null) {
        // Use custom inputs if provided (for scenarios), otherwise get from form
        const inputsToUse = customInputs || this.getInputValues();
        
        // Store inputs
        if (!customInputs) {
            this.inputs = inputsToUse;
        }
        
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
            // Calculate monthly return (gross)
            const bruttoOpbrengst = portfolioWaarde * (maandRendement / 100);
            
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
            
            // Calculate tax based on type and month
            let belasting = 0;
            
            if (month > 0) {
                // Get current total wealth for box 3 calculations
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
            
            // Net result after tax and before other costs
            const nettoOpbrengst = month > 0 ? bruttoOpbrengst - belasting : 0;
            
            // Total monthly outflow
            const totaleUitgaven = month > 0 ? actualPayment + maandKosten : 0;
            
            // Net result after all costs
            const nettoResultaat = month > 0 ? nettoOpbrengst - totaleUitgaven : 0;
            
            // Store monthly data for waterfall
            if (month > 0) {
                this.data.monthlyData.push({
                    month: month,
                    bruttoOpbrengst: bruttoOpbrengst,
                    belasting: belasting,
                    nettoOpbrengst: nettoOpbrengst,
                    rente: maandRente,
                    aflossing: principalPayment,
                    kosten: maandKosten,
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
                    
                    // Check reinvestment threshold
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
        this.calculateFinalResults(inputsToUse);
        
        return this.data;
    }
    
    // Calculate tax based on regime - COMPREHENSIVE TAX CALCULATION
    calculateTax(bruttoOpbrengst, maandRente, maandKosten, huidigVermogen, inputs, month) {
        const { belastingType, priveSubType, herinvestering } = inputs;
        
        if (belastingType === 'vpb') {
            return this.calculateVPBTax(bruttoOpbrengst, maandRente, maandKosten, herinvestering);
        } else if (belastingType === 'prive') {
            if (priveSubType === 'box1') {
                return this.calculateBox1Tax(bruttoOpbrengst, maandRente, maandKosten, inputs, herinvestering);
            } else if (priveSubType === 'box3') {
                return this.calculateBox3Tax(huidigVermogen, inputs, month);
            }
        }
        
        return 0;
    }
    
    // VPB Calculation - Belasting over winst na aftrek kosten
    calculateVPBTax(bruttoOpbrengst, maandRente, maandKosten, herinvestering) {
        // Belastbare winst = bruto rendement - aftrekbare kosten
        const belastbareWinst = Math.max(0, bruttoOpbrengst - maandRente - maandKosten);
        
        // Voor VPB: alleen belasting over uitgekeerde winst (niet herinvesteerde deel)
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        // 25.8% VPB tarief (zou progressief kunnen zijn voor kleinere bedragen)
        return uitgekeerdeDeel * Config.tax.VPB_RATE;
    }
    
    // Box 1 Calculation - Progressieve inkomstenbelasting
    calculateBox1Tax(bruttoOpbrengst, maandRente, maandKosten, inputs, herinvestering) {
        // Voor box 1: beperkte aftrekbaarheid van rente
        // Hier nemen we aan dat alleen 'zakelijke' rente aftrekbaar is
        const aftrekbareRente = maandRente * 0.5; // Assumptie: 50% aftrekbaar
        
        const belastbareWinst = Math.max(0, bruttoOpbrengst - aftrekbareRente - maandKosten);
        
        // Box 1 is alleen over uitgekeerde winst
        const uitgekeerdeDeel = belastbareWinst * ((100 - herinvestering) / 100);
        
        // Gebruik het opgegeven tarief (kan progressief worden gemaakt)
        const tariefDecimaal = inputs.box1Tarief / 100;
        return uitgekeerdeDeel * tariefDecimaal;
    }
    
    // Box 3 Calculation - Vermogensbelasting op fictief rendement
    calculateBox3Tax(huidigVermogen, inputs, month) {
        // Box 3 wordt jaarlijks berekend, niet maandelijks
        // Alleen berekenen in december (maand 12, 24, 36, etc.)
        if (month % 12 !== 0) {
            return 0;
        }
        
        // Vermogen boven heffingsvrije voet
        const belastbaarVermogen = Math.max(0, huidigVermogen - inputs.box3Vrijstelling);
        
        if (belastbaarVermogen <= 0) {
            return 0;
        }
        
        // Fictief rendement berekenen (kan progressief zijn)
        let fictiefRendement = 0;
        
        // Simpele berekening met opgegeven percentage
        fictiefRendement = belastbaarVermogen * (inputs.box3Rendement / 100);
        
        // Voor realistische berekening zou je de schijven kunnen gebruiken:
        // Config.tax.BOX3_RENDEMENT_BRACKETS
        
        // Belasting over fictief rendement
        const jaarlijkseBelasting = fictiefRendement * (inputs.box3Tarief / 100);
        
        // Verdeel over 12 maanden
        return jaarlijkseBelasting / 12;
    }
    
    // Calculate final results and KPIs
    calculateFinalResults(inputsToUse) {
        const { startKapitaal, lening, looptijd, inflatie } = inputsToUse;
        
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
                    { label: 'Start Kapitaal', value: this.inputs.startKapitaal, type: 'start' },
                    { label: 'Lening', value: this.inputs.lening, type: 'positive' },
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
                acc.bruttoOpbrengst += month.bruttoOpbrengst;
                acc.belasting += month.belasting;
                acc.rente += month.rente;
                acc.aflossing += month.aflossing;
                acc.kosten += month.kosten;
                return acc;
            }, { bruttoOpbrengst: 0, belasting: 0, rente: 0, aflossing: 0, kosten: 0 });
            
            const startValue = year > 0 && this.data.totaalVermogen[year - 1] !== undefined
                ? this.data.totaalVermogen[year - 1]
                : this.inputs.startKapitaal;
            
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
    }
    
    // Calculate scenario - FIXED VERSION
    calculateScenario(overrides) {
        // Get current inputs
        const baseInputs = this.getInputValues();
        
        // Create scenario inputs by merging base with overrides
        const scenarioInputs = { ...baseInputs, ...overrides };
        
        // Store current state
        const originalData = Utils.deepClone(this.data);
        const originalResults = Utils.deepClone(this.results);
        
        // Calculate with scenario inputs
        this.calculate(scenarioInputs);
        const scenarioROI = this.results.finalROI;
        
        // Restore original state
        this.data = originalData;
        this.results = originalResults;
        
        return scenarioROI;
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
        
        const baseROI = this.results.finalROI;
        
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
    
    // Monte Carlo simulation - FIXED VERSION  
    runMonteCarlo(numSimulations, volatility, renteVolatility, kostenVolatility) {
        const results = [];
        const baseInputs = this.getInputValues();
        
        // Store current state
        const originalData = Utils.deepClone(this.data);
        const originalResults = Utils.deepClone(this.results);
        
        for (let i = 0; i < numSimulations; i++) {
            // Generate random variations using normal distribution
            const rendementVariation = Utils.randomNormal() * volatility;
            const renteVariation = Utils.randomNormal() * renteVolatility;
            const kostenVariation = Utils.randomNormal() * kostenVolatility;
            
            // Create scenario inputs with variations
            const scenarioInputs = {
                ...baseInputs,
                rendement: baseInputs.rendement + (rendementVariation * 100),
                renteLening: Math.max(0, baseInputs.renteLening + (renteVariation * 100)),
                vasteKosten: Math.max(0, baseInputs.vasteKosten * (1 + kostenVariation))
            };
            
            // Calculate this scenario
            this.calculate(scenarioInputs);
            
            results.push({
                simulation: i + 1,
                roi: this.results.finalROI,
                finalValue: this.results.finalVermogen,
                inputs: { 
                    rendement: scenarioInputs.rendement, 
                    rente: scenarioInputs.renteLening, 
                    kosten: scenarioInputs.vasteKosten 
                }
            });
        }
        
        // Restore original state and recalculate
        this.data = originalData;
        this.results = originalResults;
        this.calculate(baseInputs);
        
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
            lossProb: (results.filter(r => r.roi < 0).length / numSimulations) * 100,
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