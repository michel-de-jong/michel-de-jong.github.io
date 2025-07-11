// Export Feature Module
import { formatNumber, getCurrentDateString, getISODateString } from '../utils/format-utils.js';

export class ExportFeature {
    constructor(calculator, chartManager) {
        this.calculator = calculator;
        this.chartManager = chartManager;
    }
    
    setupListeners(stateManager) {
        this.stateManager = stateManager;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }
    
    attachEventListeners() {
        // Export buttons
        const exportButtons = {
            'exportExcelBtn': () => this.exportToExcel(),
            'exportPDFBtn': () => this.exportToPDF(),
            'exportChartsBtn': () => this.exportCharts()
        };
        
        Object.entries(exportButtons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }
    
    activate() {
        // No special activation needed for export
    }
    
    // Export to Excel
    async exportToExcel() {
        try {
            const wb = XLSX.utils.book_new();
            
            // Sheet 1: Overview
            const overviewData = this.createOverviewSheet();
            const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, ws1, 'Overzicht');
            
            // Sheet 2: Yearly Data
            const yearlyData = this.createYearlyDataSheet();
            const ws2 = XLSX.utils.aoa_to_sheet(yearlyData);
            XLSX.utils.book_append_sheet(wb, ws2, 'Jaarlijkse Data');
            
            // Sheet 3: Monthly Cashflow
            const monthlyData = this.createMonthlyDataSheet();
            if (monthlyData.length > 1) {
                const ws3 = XLSX.utils.aoa_to_sheet(monthlyData);
                XLSX.utils.book_append_sheet(wb, ws3, 'Maandelijkse Cashflow');
            }
            
            // Sheet 4: Scenarios (if available)
            const scenarioData = this.createScenarioSheet();
            if (scenarioData) {
                const ws4 = XLSX.utils.aoa_to_sheet(scenarioData);
                XLSX.utils.book_append_sheet(wb, ws4, 'Scenario Analyse');
            }
            
            // Sheet 5: Monte Carlo (if available)
            const monteCarloData = this.createMonteCarloSheet();
            if (monteCarloData) {
                const ws5 = XLSX.utils.aoa_to_sheet(monteCarloData);
                XLSX.utils.book_append_sheet(wb, ws5, 'Monte Carlo');
            }
            
            // Save file
            const filename = `ROI_Analyse_${getISODateString()}.xlsx`;
            XLSX.writeFile(wb, filename);
            
            this.showSuccess('Excel bestand succesvol gedownload!');
            
        } catch (error) {
            console.error('Excel export error:', error);
            this.showError('Er is een fout opgetreden bij het exporteren naar Excel.');
        }
    }
    
    createOverviewSheet() {
        const inputs = this.stateManager.getInputs();
        const results = this.calculator.results;
        
        const belastingInfo = inputs.belastingType === 'prive' 
            ? `${inputs.belastingType} (${inputs.priveSubType})`
            : inputs.belastingType;
        
        return [
            ['ROI Calculator Export', getCurrentDateString()],
            [],
            ['INVOERGEGEVENS'],
            ['Parameter', 'Waarde', 'Eenheid'],
            ['Startkapitaal', inputs.startKapitaal, 'EUR'],
            ['Lening', inputs.lening, 'EUR'],
            ['Rente Lening', inputs.renteLening, '%'],
            ['Looptijd Investering', inputs.looptijd, 'jaar'],
            ['Looptijd Lening', inputs.leningLooptijd, 'jaar'],
            ['Rendement Type', inputs.rendementType, ''],
            ['Verwacht Rendement', inputs.rendement, '%'],
            ['Aflossingstype', inputs.aflossingsType, ''],
            ['Herinvestering', inputs.herinvestering, '%'],
            ['Vaste Kosten', inputs.vasteKosten, 'EUR/jaar'],
            ['Herinvestering Drempel', inputs.herinvesteringDrempel, 'EUR'],
            ['Inflatie', inputs.inflatie, '%'],
            ['Belasting Type', belastingInfo, ''],
            [],
            ['RESULTATEN'],
            ['Metric', 'Nominaal', 'Reëel'],
            ['Totaal Vermogen', results.finalVermogen, results.finalVermogenReeel],
            ['ROI', results.finalROI + '%', results.finalROIReeel + '%'],
            ['Cash Reserve', results.finalCashReserve, results.finalCashReserveReeel],
            ['Leverage Factor', results.leverageFactor + 'x', ''],
            ['Koopkrachtverlies', results.koopkrachtVerlies, '']
        ];
    }
    
    createYearlyDataSheet() {
        const data = this.calculator.data;
        const headers = ['Jaar', 'Portfolio', 'Cash Reserve', 'Lening', 'Totaal Vermogen', 
                        'ROI %', 'Portfolio Reëel', 'Cash Reserve Reëel', 'Totaal Vermogen Reëel', 'ROI Reëel %'];
        
        const rows = [headers];
        
        data.jaren.forEach((jaar, i) => {
            rows.push([
                jaar,
                data.portfolio[i],
                data.cashReserve[i],
                data.lening[i],
                data.totaalVermogen[i],
                data.roi[i],
                data.portfolioReeel[i],
                data.cashReserveReeel[i],
                data.totaalVermogenReeel[i],
                data.roiReeel[i]
            ]);
        });
        
        return rows;
    }
    
    createMonthlyDataSheet() {
        const monthlyData = this.calculator.data.monthlyData;
        if (!monthlyData || monthlyData.length === 0) {
            return [['Geen maandelijkse data beschikbaar']];
        }
        
        const headers = ['Maand', 'Bruto Opbrengst', 'Belasting', 'Netto Opbrengst', 
                        'Rente', 'Aflossing', 'Vaste Kosten', 'Netto Resultaat', 
                        'Portfolio', 'Cash Reserve', 'Lening'];
        
        const rows = [headers];
        
        monthlyData.forEach(month => {
            rows.push([
                month.month,
                month.bruttoOpbrengst,
                month.belasting,
                month.nettoOpbrengst,
                month.rente,
                month.aflossing,
                month.kosten,
                month.netto,
                month.portfolio,
                month.cashReserve,
                month.lening
            ]);
        });
        
        return rows;
    }
    
    createScenarioSheet() {
        // Check if scenarios feature exists and has data
        const scenariosFeature = window.app?.features?.scenarios;
        if (!scenariosFeature || !scenariosFeature.exportScenarioData) {
            return null;
        }
        
        const scenarioData = scenariosFeature.exportScenarioData();
        if (!scenarioData.scenarios) return null;
        
        const rows = [
            ['Scenario Analyse'],
            [],
            ['Scenario', 'Rendement %', 'Vaste Kosten', 'ROI %'],
            ['Best Case', scenarioData.scenarios.best.rendement, scenarioData.scenarios.best.kosten, scenarioData.scenarios.best.roi],
            ['Base Case', scenarioData.scenarios.base.rendement, scenarioData.scenarios.base.kosten, scenarioData.scenarios.base.roi],
            ['Worst Case', scenarioData.scenarios.worst.rendement, scenarioData.scenarios.worst.kosten, scenarioData.scenarios.worst.roi]
        ];
        
        if (scenarioData.stressTest) {
            rows.push([]);
            rows.push(['Stress Test Resultaten']);
            rows.push(['Scenario', 'ROI %', 'Impact %']);
            
            scenarioData.stressTest.forEach(test => {
                rows.push([test.name, test.roi, test.impact]);
            });
        }
        
        return rows;
    }
    
    createMonteCarloSheet() {
        // Check if Monte Carlo feature exists and has results
        const monteCarloFeature = window.app?.features?.monteCarlo;
        if (!monteCarloFeature || !monteCarloFeature.exportResults) {
            return null;
        }
        
        const mcData = monteCarloFeature.exportResults();
        if (!mcData) return null;
        
        return [
            ['Monte Carlo Simulatie Resultaten'],
            [],
            ['Statistiek', 'Waarde'],
            ['Aantal Simulaties', mcData.parameters.simulations],
            ['Rendement Volatiliteit', mcData.parameters.volatility + '%'],
            ['Rente Volatiliteit', mcData.parameters.renteVolatility + '%'],
            ['Kosten Volatiliteit', mcData.parameters.kostenVolatility + '%'],
            [],
            ['Resultaten'],
            ['Gemiddelde ROI', mcData.statistics.mean.toFixed(2) + '%'],
            ['Mediaan ROI', mcData.statistics.median.toFixed(2) + '%'],
            ['5e Percentiel', mcData.statistics.p5.toFixed(2) + '%'],
            ['95e Percentiel', mcData.statistics.p95.toFixed(2) + '%'],
            ['Kans op Verlies', mcData.statistics.lossProb.toFixed(2) + '%'],
            ['Value at Risk (5%)', mcData.statistics.vaR5]
        ];
    }
    
    // Export to PDF
    async exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Title page
            this.addTitlePage(pdf);
            
            // Executive summary
            pdf.addPage();
            this.addExecutiveSummary(pdf);
            
            // Input parameters
            pdf.addPage();
            this.addInputParameters(pdf);
            
            // Results analysis
            pdf.addPage();
            this.addResultsAnalysis(pdf);
            
            // Charts
            this.addChartPages(pdf);
            
            // Save
            const filename = `ROI_Rapport_${getISODateString()}.pdf`;
            pdf.save(filename);
            
            this.showSuccess('PDF rapport succesvol gedownload!');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Er is een fout opgetreden bij het exporteren naar PDF.');
        }
    }
    
    addTitlePage(pdf) {
        // Logo or header area
        pdf.setFillColor(30, 60, 114);
        pdf.rect(0, 0, 210, 40, 'F');
        
        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(28);
        pdf.text('ROI Calculator Rapport', 105, 25, { align: 'center' });
        
        // Date
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.text(getCurrentDateString(), 105, 60, { align: 'center' });
        
        // Company info (if needed)
        pdf.setFontSize(12);
        pdf.text('Professionele Investeringsanalyse', 105, 80, { align: 'center' });
        
        // Key metrics box
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(2);
        pdf.rect(30, 100, 150, 80);
        
        const results = this.calculator.results;
        pdf.setFontSize(16);
        pdf.text('Belangrijkste Resultaten', 105, 115, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.text(`Totaal Vermogen: ${formatNumber(results.finalVermogen)}`, 40, 135);
        pdf.text(`ROI: ${results.finalROI.toFixed(1)}%`, 40, 150);
        pdf.text(`Leverage Factor: ${results.leverageFactor.toFixed(1)}x`, 40, 165);
    }
    
    addExecutiveSummary(pdf) {
        pdf.setFontSize(18);
        pdf.text('Executive Summary', 20, 20);
        
        pdf.setFontSize(11);
        let y = 40;
        
        const inputs = this.stateManager.getInputs();
        const results = this.calculator.results;
        
        // Summary text
        const summary = [
            `Deze analyse toont de verwachte prestaties van een investering met een startkapitaal van ${formatNumber(inputs.startKapitaal)}.`,
            `Met een verwacht rendement van ${inputs.rendement}% ${inputs.rendementType} en een investeringsperiode van ${inputs.looptijd} jaar,`,
            `resulteert dit in een totaal vermogen van ${formatNumber(results.finalVermogen)} en een ROI van ${results.finalROI.toFixed(1)}%.`,
            '',
            `Belangrijke aannames:`,
            `• Leverage: ${formatNumber(inputs.lening)} tegen ${inputs.renteLening}% rente`,
            `• Herinvestering: ${inputs.herinvestering}% van de winst`,
            `• Vaste kosten: ${formatNumber(inputs.vasteKosten)} per jaar`,
            `• Belastingregime: ${this.getTaxDescription(inputs)}`
        ];
        
        summary.forEach(line => {
            if (line) {
                pdf.text(line, 20, y);
            }
            y += 8;
        });
        
        // Risk assessment
        y = 140;
        pdf.setFontSize(14);
        pdf.text('Risico Beoordeling', 20, y);
        
        pdf.setFontSize(11);
        y += 15;
        
        const riskFactors = this.assessRisk(inputs, results);
        riskFactors.forEach(factor => {
            pdf.text(`• ${factor}`, 20, y);
            y += 8;
        });
    }
    
    addInputParameters(pdf) {
        pdf.setFontSize(18);
        pdf.text('Invoerparameters', 20, 20);
        
        const inputs = this.stateManager.getInputs();
        
        // Create table data
        const tableData = [
            ['Parameter', 'Waarde', 'Opmerking'],
            ['Startkapitaal', formatNumber(inputs.startKapitaal), 'Eigen vermogen'],
            ['Lening', formatNumber(inputs.lening), `${inputs.aflossingsType}`],
            ['Rente', `${inputs.renteLening}%`, 'Jaarlijks'],
            ['Looptijd', `${inputs.looptijd} jaar`, 'Investeringsperiode'],
            ['Rendement', `${inputs.rendement}%`, inputs.rendementType],
            ['Herinvestering', `${inputs.herinvestering}%`, 'Van de winst'],
            ['Belasting', this.getTaxDescription(inputs), '']
        ];
        
        // Simple table
        let y = 40;
        tableData.forEach((row, index) => {
            const isHeader = index === 0;
            pdf.setFontSize(isHeader ? 12 : 11);
            pdf.setFont(undefined, isHeader ? 'bold' : 'normal');
            
            pdf.text(row[0], 20, y);
            pdf.text(row[1], 80, y);
            pdf.text(row[2], 140, y);
            
            y += 10;
            
            if (isHeader) {
                pdf.line(20, y - 5, 190, y - 5);
                y += 5;
            }
        });
    }
    
    addResultsAnalysis(pdf) {
        pdf.setFontSize(18);
        pdf.text('Resultaten Analyse', 20, 20);
        
        const results = this.calculator.results;
        
        let y = 40;
        
        // Key results
        pdf.setFontSize(14);
        pdf.text('Financiële Resultaten', 20, y);
        
        y += 15;
        pdf.setFontSize(11);
        
        const resultItems = [
            `Eindvermogen (nominaal): ${formatNumber(results.finalVermogen)}`,
            `Eindvermogen (reëel): ${formatNumber(results.finalVermogenReeel)}`,
            `Return on Investment: ${results.finalROI.toFixed(1)}%`,
            `Cash Reserve: ${formatNumber(results.finalCashReserve)}`,
            `Koopkrachtverlies door inflatie: ${formatNumber(results.koopkrachtVerlies)}`
        ];
        
        resultItems.forEach(item => {
            pdf.text(item, 30, y);
            y += 10;
        });
        
        // Performance indicators
        y += 10;
        pdf.setFontSize(14);
        pdf.text('Prestatie Indicatoren', 20, y);
        
        y += 15;
        pdf.setFontSize(11);
        
        const indicators = this.calculatePerformanceIndicators();
        indicators.forEach(indicator => {
            pdf.text(`${indicator.name}: ${indicator.value}`, 30, y);
            y += 10;
        });
    }
    
    addChartPages(pdf) {
        // Add main chart if available
        if (this.chartManager.charts.main) {
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Vermogensontwikkeling', 105, 20, { align: 'center' });
            
            const chartImage = this.chartManager.charts.main.toBase64Image();
            pdf.addImage(chartImage, 'PNG', 20, 30, 170, 100);
        }
        
        // Add scenario chart if available
        if (this.chartManager.charts.scenario) {
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Scenario Vergelijking', 105, 20, { align: 'center' });
            
            const chartImage = this.chartManager.charts.scenario.toBase64Image();
            pdf.addImage(chartImage, 'PNG', 20, 30, 170, 100);
        }
    }
    
    // Export charts as images
    exportCharts() {
        try {
            let exported = 0;
            
            Object.entries(this.chartManager.charts).forEach(([name, chart]) => {
                if (chart) {
                    this.chartManager.exportChart(name);
                    exported++;
                }
            });
            
            if (exported > 0) {
                this.showSuccess(`${exported} grafieken succesvol geëxporteerd!`);
            } else {
                this.showError('Geen grafieken beschikbaar om te exporteren.');
            }
            
        } catch (error) {
            console.error('Chart export error:', error);
            this.showError('Er is een fout opgetreden bij het exporteren van grafieken.');
        }
    }
    
    // Helper methods
    getTaxDescription(inputs) {
        if (inputs.belastingType === 'vpb') {
            return 'VPB (25.8%)';
        } else if (inputs.belastingType === 'prive') {
            if (inputs.priveSubType === 'box1') {
                return `Box 1 (${inputs.box1Tarief}%)`;
            } else {
                return `Box 3 (${inputs.box3Tarief}% over ${inputs.box3Rendement}% fictief)`;
            }
        }
        return 'Onbekend';
    }
    
    assessRisk(inputs, results) {
        const risks = [];
        
        // Leverage risk
        const leverageRatio = inputs.lening / (inputs.startKapitaal + inputs.lening);
        if (leverageRatio > 0.7) {
            risks.push('Hoge leverage (>70%) verhoogt risico significant');
        }
        
        // Interest coverage
        const monthlyReturn = results.finalVermogen * (inputs.rendement / 100) / 12;
        const monthlyInterest = inputs.lening * (inputs.renteLening / 100) / 12;
        if (monthlyReturn < monthlyInterest * 2) {
            risks.push('Beperkte interest coverage kan problemen opleveren');
        }
        
        // ROI assessment
        if (results.finalROI < 0) {
            risks.push('Negatieve ROI verwacht - heroverweeg strategie');
        } else if (results.finalROI < 10) {
            risks.push('Lage ROI - mogelijk niet voldoende voor risico');
        }
        
        if (risks.length === 0) {
            risks.push('Risicoprofiel lijkt acceptabel binnen parameters');
        }
        
        return risks;
    }
    
    calculatePerformanceIndicators() {
        const inputs = this.stateManager.getInputs();
        const results = this.calculator.results;
        
        return [
            {
                name: 'CAGR (Compound Annual Growth Rate)',
                value: (Math.pow(results.finalVermogen / inputs.startKapitaal, 1 / inputs.looptijd) - 1) * 100 + '%'
            },
            {
                name: 'Sharpe Ratio (geschat)',
                value: ((results.finalROI / inputs.looptijd) / 15).toFixed(2) // Assuming 15% volatility
            },
            {
                name: 'Payback Period',
                value: (inputs.startKapitaal / (results.finalCashReserve / inputs.looptijd)).toFixed(1) + ' jaar'
            }
        ];
    }
    
    showSuccess(message) {
        // Could be replaced with a toast notification
        console.log('Success:', message);
        alert(message);
    }
    
    showError(message) {
        // Could be replaced with a toast notification
        console.error('Error:', message);
        alert(message);
    }
}