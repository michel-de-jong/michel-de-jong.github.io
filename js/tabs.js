// Tab Content Templates and Management - IMPROVED FOR MOBILE

const TabTemplates = {
    scenarios: `
        <section id="scenarios" class="tab-pane" role="tabpanel">
            <h2>Scenario Analyse</h2>
            <p>Vergelijk verschillende scenario's en voer stress tests uit</p>
            
            <div class="scenario-grid">
                <div class="scenario-card">
                    <h3>Best Case</h3>
                    <div class="form-group">
                        <label for="bestCaseRendement">Rendement (%)</label>
                        <input type="number" id="bestCaseRendement" value="1.2" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="bestCaseKosten">Vaste Kosten (€)</label>
                        <input type="number" id="bestCaseKosten" value="4000" step="100">
                    </div>
                    <div class="kpi-value" id="bestCaseROI">ROI: 0%</div>
                </div>
                
                <div class="scenario-card">
                    <h3>Base Case</h3>
                    <div class="form-group">
                        <label for="baseCaseRendement">Rendement (%)</label>
                        <input type="number" id="baseCaseRendement" value="0.8" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="baseCaseKosten">Vaste Kosten (€)</label>
                        <input type="number" id="baseCaseKosten" value="5000" step="100">
                    </div>
                    <div class="kpi-value" id="baseCaseROI">ROI: 0%</div>
                </div>
                
                <div class="scenario-card">
                    <h3>Worst Case</h3>
                    <div class="form-group">
                        <label for="worstCaseRendement">Rendement (%)</label>
                        <input type="number" id="worstCaseRendement" value="0.3" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="worstCaseKosten">Vaste Kosten (€)</label>
                        <input type="number" id="worstCaseKosten" value="6000" step="100">
                    </div>
                    <div class="kpi-value" id="worstCaseROI">ROI: 0%</div>
                </div>
            </div>
            
            <div class="chart-container mt-4">
                <canvas id="scenarioChart"></canvas>
            </div>
            
            <h3 class="mt-4">Stress Test</h3>
            <button class="btn btn-primary" id="runStressTestBtn">Run Stress Test</button>
            <div id="stressTestResults" class="mt-3"></div>
        </section>
    `,
    
    montecarlo: `
        <section id="montecarlo" class="tab-pane" role="tabpanel">
            <h2>Monte Carlo Simulatie</h2>
            <p>Probabilistische analyse met duizenden scenario's voor risico-inzicht</p>
            
            <div class="monte-carlo-controls">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="mcSimulations">Aantal Simulaties</label>
                        <div class="input-wrapper">
                            <input type="number" id="mcSimulations" value="10000" min="1000" max="100000" step="1000">
                            <span class="tooltip-icon">?</span>
                            <span class="tooltip">Meer simulaties = nauwkeuriger resultaat maar langere rekentijd</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="mcVolatility">Rendement Volatiliteit (%)</label>
                        <div class="input-wrapper">
                            <input type="number" id="mcVolatility" value="3" min="0" max="20" step="0.5">
                            <span class="tooltip-icon">?</span>
                            <span class="tooltip">Standaarddeviatie van het rendement (hoger = meer risico)</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="mcRenteVolatility">Rente Volatiliteit (%)</label>
                        <div class="input-wrapper">
                            <input type="number" id="mcRenteVolatility" value="1" min="0" max="5" step="0.1">
                            <span class="tooltip-icon">?</span>
                            <span class="tooltip">Variatie in rentetarieven over tijd</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="mcKostenVolatility">Kosten Volatiliteit (%)</label>
                        <div class="input-wrapper">
                            <input type="number" id="mcKostenVolatility" value="10" min="0" max="50" step="5">
                            <span class="tooltip-icon">?</span>
                            <span class="tooltip">Variatie in vaste kosten (percentage van basis)</span>
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary" id="runMonteCarloBtn">
                    <span>🎲</span> Start Monte Carlo Simulatie
                </button>
            </div>
            
            <div class="loading" id="mcLoading">
                <div class="spinner"></div>
                <p>Simulatie wordt uitgevoerd...</p>
            </div>
            
            <div class="simulation-results" id="mcResults" style="display: none;">
                <div class="result-card">
                    <h4>Mediaan ROI (P50)</h4>
                    <div class="result-value" id="mcMedianROI">0%</div>
                </div>
                <div class="result-card">
                    <h4>95% Confidence (P5-P95)</h4>
                    <div class="result-value" id="mcConfidence">0% - 0%</div>
                </div>
                <div class="result-card">
                    <h4>Kans op Verlies</h4>
                    <div class="result-value" id="mcLossProb">0%</div>
                </div>
                <div class="result-card">
                    <h4>Value at Risk (5%)</h4>
                    <div class="result-value" id="mcVaR">€ 0</div>
                </div>
            </div>
            
            <div class="chart-container mt-4" style="display: none;" id="mcChartContainer">
                <canvas id="monteCarloChart"></canvas>
            </div>
            
            <div class="chart-container mt-4" style="display: none;" id="mcDistContainer">
                <canvas id="distributionChart"></canvas>
            </div>
        </section>
    `,
    
    waterfall: `
        <section id="waterfall" class="tab-pane" role="tabpanel">
            <h2>💧 Cashflow Waterfall Analyse</h2>
            <p>Gedetailleerd overzicht van alle geldstromen per periode</p>
            
            <div class="waterfall-controls">
                <div class="period-selector-group">
                    <label for="waterfallPeriod">📅 Selecteer Periode:</label>
                    <select id="waterfallPeriod" class="period-select">
                        <!-- Dynamically populated -->
                    </select>
                    <button class="btn btn-sm btn-secondary" id="comparePeriodsBtn">📊 Vergelijk Periodes</button>
                </div>
                
                <div class="view-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="waterfallViewToggle" aria-label="Toon percentages">
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Toon als percentages</span>
                </div>
            </div>
            
            <div class="waterfall-summary">
                <div class="summary-card positive">
                    <div class="summary-icon">📈</div>
                    <div class="summary-content">
                        <div class="summary-label">Totale Inkomsten</div>
                        <div class="summary-value" id="wfTotaleInkomsten">€ 0</div>
                        <div class="summary-detail" id="wfInkomstenDetail">Bruto: € 0 | Belasting: € 0</div>
                    </div>
                </div>
                
                <div class="summary-card negative">
                    <div class="summary-icon">📉</div>
                    <div class="summary-content">
                        <div class="summary-label">Totale Uitgaven</div>
                        <div class="summary-value" id="wfTotaleUitgaven">€ 0</div>
                        <div class="summary-detail" id="wfUitgavenDetail">Rente: € 0 | Aflossing: € 0 | Kosten: € 0</div>
                    </div>
                </div>
                
                <div class="summary-card primary">
                    <div class="summary-icon">💰</div>
                    <div class="summary-content">
                        <div class="summary-label">Netto Cashflow</div>
                        <div class="summary-value" id="wfNettoCashflow">€ 0</div>
                        <div class="summary-detail" id="wfCashflowDetail">0% van bruto inkomsten</div>
                    </div>
                </div>
                
                <div class="summary-card info">
                    <div class="summary-icon">📊</div>
                    <div class="summary-content">
                        <div class="summary-label">Effectief Belastingtarief</div>
                        <div class="summary-value" id="wfBelastingTarief">0%</div>
                        <div class="summary-detail" id="wfBelastingDetail">Op bruto rendement</div>
                    </div>
                </div>
            </div>
            
            <div class="chart-container tall mt-4">
                <canvas id="waterfallChart"></canvas>
            </div>
            
            <div class="waterfall-analysis mt-4">
                <h3>📊 Cashflow Breakdown</h3>
                <div class="analysis-tabs">
                    <button class="analysis-tab active" data-analysis="components">Componenten</button>
                    <button class="analysis-tab" data-analysis="trends">Trends</button>
                    <button class="analysis-tab" data-analysis="ratios">Ratio's</button>
                </div>
                
                <div class="analysis-content" id="analysisContent">
                    <div class="table-wrapper">
                        <table class="cashflow-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Bedrag</th>
                                    <th>% van Bruto</th>
                                    <th>% van Netto</th>
                                    <th>Impact</th>
                                </tr>
                            </thead>
                            <tbody id="waterfallTableBody">
                                <!-- Dynamically populated -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="waterfall-insights mt-4">
                <h3>💡 Inzichten</h3>
                <div id="waterfallInsights" class="insights-grid">
                    <!-- Dynamically populated insights -->
                </div>
            </div>
            
            <div class="mobile-table-hint mt-2" style="font-size: 12px; color: #6c757d;">
                💡 Tip: Swipe de tabel horizontaal om alle kolommen te zien
            </div>
        </section>
    `,
    
    portfolio: `
        <section id="portfolio" class="tab-pane" role="tabpanel">
            <h2>Multi-Asset Portfolio Builder</h2>
            <p>Bouw een gediversifieerde portfolio met verschillende assets</p>
            
            <div id="assetList">
                <div class="asset-row">
                    <input type="text" placeholder="Asset naam" class="asset-name">
                    <input type="number" placeholder="Bedrag (€)" class="asset-amount" min="0" step="1000">
                    <input type="number" placeholder="Rendement %" class="asset-return" step="0.1">
                    <input type="number" placeholder="Risico %" class="asset-risk" min="0" max="100" step="1">
                    <button class="btn-remove" data-action="remove">×</button>
                </div>
            </div>
            
            <div class="portfolio-controls mt-3">
                <button class="btn btn-primary" id="addAssetBtn">+ Asset Toevoegen</button>
                <button class="btn btn-success" id="calculatePortfolioBtn">Portfolio Berekenen</button>
            </div>
            
            <div class="kpi-grid mt-4">
                <div class="kpi-card">
                    <div class="kpi-label">Portfolio Waarde</div>
                    <div class="kpi-value" id="portfolioWaarde">€ 0</div>
                </div>
                <div class="kpi-card green">
                    <div class="kpi-label">Gewogen Rendement</div>
                    <div class="kpi-value" id="portfolioRendement">0%</div>
                </div>
                <div class="kpi-card orange">
                    <div class="kpi-label">Portfolio Risico</div>
                    <div class="kpi-value" id="portfolioRisico">0%</div>
                </div>
            </div>
            
            <div class="chart-container mt-4">
                <canvas id="portfolioChart"></canvas>
            </div>
        </section>
    `,
    
    saved: `
        <section id="saved" class="tab-pane" role="tabpanel">
            <h2>Opgeslagen Scenario's</h2>
            <p>Beheer en vergelijk uw opgeslagen scenario's</p>
            
            <button class="btn btn-primary" id="saveScenarioBtn">📋 Huidig Scenario Opslaan</button>
            
            <div id="savedScenariosList" class="mt-4">
                <!-- Saved scenarios will be listed here -->
            </div>
            
            <div class="saved-scenarios-help mt-4" style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px;">
                <h4 style="margin-bottom: 10px;">💡 Tips voor Scenario Beheer:</h4>
                <ul style="margin-left: 20px; line-height: 1.6;">
                    <li>Sla interessante combinaties van parameters op voor later vergelijken</li>
                    <li>Gebruik verschillende scenario's voor presentaties aan stakeholders</li>
                    <li>Maximum van 50 scenario's worden bewaard</li>
                    <li>Data wordt lokaal in uw browser opgeslagen</li>
                </ul>
            </div>
        </section>
    `,
    
    export: `
        <section id="export" class="tab-pane" role="tabpanel">
            <h2>Export Functies</h2>
            <p>Exporteer uw analyses naar verschillende formaten</p>
            
            <div class="export-grid">
                <div class="export-card">
                    <div class="export-icon">📊</div>
                    <h3>Excel Export</h3>
                    <p>Download complete analyse als Excel bestand met alle data en berekeningen</p>
                    <button class="btn btn-success" id="exportExcelBtn">📥 Excel Downloaden</button>
                </div>
                
                <div class="export-card">
                    <div class="export-icon">📄</div>
                    <h3>PDF Rapport</h3>
                    <p>Genereer professioneel PDF rapport met samenvatting en grafieken</p>
                    <button class="btn btn-danger" id="exportPDFBtn">📄 PDF Genereren</button>
                </div>
                
                <div class="export-card">
                    <div class="export-icon">🖼️</div>
                    <h3>Grafiek Export</h3>
                    <p>Download alle grafieken als PNG afbeeldingen voor presentaties</p>
                    <button class="btn btn-primary" id="exportChartsBtn">🖼️ Grafieken Downloaden</button>
                </div>
            </div>
            
            <div class="export-info mt-4" style="background: #e3f2fd; padding: 20px; border-radius: 8px;">
                <h4 style="color: #1976d2; margin-bottom: 15px;">📋 Export Informatie</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; font-size: 14px;">
                    <div>
                        <strong>Excel Bestand bevat:</strong>
                        <ul style="margin-left: 15px; margin-top: 5px;">
                            <li>Alle invoerparameters</li>
                            <li>Jaarlijkse vermogensontwikkeling</li>
                            <li>Maandelijkse cashflow data</li>
                            <li>Scenario vergelijkingen</li>
                        </ul>
                    </div>
                    <div>
                        <strong>PDF Rapport bevat:</strong>
                        <ul style="margin-left: 15px; margin-top: 5px;">
                            <li>Executive summary</li>
                            <li>Key performance indicators</li>
                            <li>Grafieken en visualisaties</li>
                            <li>Professionele opmaak</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Afbeelding Export:</strong>
                        <ul style="margin-left: 15px; margin-top: 5px;">
                            <li>Hoge resolutie PNG bestanden</li>
                            <li>Alle actieve grafieken</li>
                            <li>Klaar voor presentaties</li>
                            <li>Transparante achtergrond</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    `
};

// Add CSS for tab-specific styles - ENHANCED WITH MOBILE IMPROVEMENTS
const TabStyles = `
    /* Scenario Cards */
    .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    
    .scenario-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        border: 2px solid transparent;
        transition: all 0.3s;
    }
    
    .scenario-card:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    .scenario-card h3 {
        margin-bottom: 15px;
        color: var(--primary-color);
    }
    
    /* Monte Carlo Specific */
    .monte-carlo-controls {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 30px;
    }
    
    .simulation-results {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 30px;
    }
    
    .result-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e9ecef;
        text-align: center;
        transition: transform 0.2s ease;
    }
    
    .result-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .result-card h4 {
        color: #495057;
        margin-bottom: 10px;
        font-size: 16px;
    }
    
    .result-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--primary-color);
    }
    
    /* Waterfall Specific - ENHANCED */
    .waterfall-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .period-selector-group {
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .period-selector-group label {
        font-weight: 600;
        color: #495057;
        font-size: 16px;
        margin: 0;
    }
    
    .period-select {
        padding: 10px 15px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        font-size: 15px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 200px;
    }
    
    .period-select:hover {
        border-color: var(--primary-color);
    }
    
    .period-select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
    }
    
    .view-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .waterfall-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .summary-card {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
    }
    
    .summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    
    .summary-card.positive {
        border-left: 4px solid var(--success-color);
    }
    
    .summary-card.negative {
        border-left: 4px solid var(--danger-color);
    }
    
    .summary-card.primary {
        border-left: 4px solid var(--primary-color);
    }
    
    .summary-card.info {
        border-left: 4px solid var(--info-color);
    }
    
    .summary-icon {
        font-size: 32px;
        line-height: 1;
        opacity: 0.8;
    }
    
    .summary-content {
        flex: 1;
    }
    
    .summary-label {
        font-size: 14px;
        color: #6c757d;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .summary-value {
        font-size: 24px;
        font-weight: 700;
        color: #212529;
        margin-bottom: 5px;
    }
    
    .summary-detail {
        font-size: 12px;
        color: #6c757d;
        line-height: 1.4;
    }
    
    .waterfall-analysis {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .analysis-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
    }
    
    .analysis-tab {
        padding: 10px 20px;
        background: none;
        border: none;
        font-size: 15px;
        color: #6c757d;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
    }
    
    .analysis-tab:hover {
        color: var(--primary-color);
    }
    
    .analysis-tab.active {
        color: var(--primary-color);
        font-weight: 600;
    }
    
    .analysis-tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--primary-color);
    }
    
    .waterfall-insights {
        margin-top: 30px;
    }
    
    .insights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .insight-card {
        padding: 15px;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-radius: 8px;
        border-left: 3px solid #1976d2;
        font-size: 14px;
        line-height: 1.6;
    }
    
    .insight-card.warning {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border-left-color: #f57c00;
    }
    
    .insight-card.success {
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border-left-color: #388e3c;
    }
    
    .insight-card.danger {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-left-color: #d32f2f;
    }
    
    .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin-top: 20px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        background: white;
    }
    
    .cashflow-table {
        width: 100%;
        min-width: 700px;
        margin: 0;
        border-collapse: collapse;
    }
    
    .cashflow-table th,
    .cashflow-table td {
        padding: 12px 15px;
        text-align: right;
        border-bottom: 1px solid #dee2e6;
        white-space: nowrap;
    }
    
    .cashflow-table th:first-child,
    .cashflow-table td:first-child {
        text-align: left;
        position: sticky;
        left: 0;
        background: white;
        min-width: 140px;
        z-index: 1;
        box-shadow: 2px 0 5px rgba(0,0,0,0.05);
        font-weight: 500;
    }
    
    .cashflow-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        position: sticky;
        top: 0;
        z-index: 2;
    }
    
    .cashflow-table th:first-child {
        z-index: 3;
        background: #f8f9fa;
    }
    
    .cashflow-table tr:hover {
        background: #f8f9fa;
    }
    
    .cashflow-table .positive {
        color: var(--success-color);
        font-weight: 600;
    }
    
    .cashflow-table .negative {
        color: var(--danger-color);
        font-weight: 600;
    }
    
    .impact-bar {
        display: inline-block;
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        width: 100px;
        position: relative;
        vertical-align: middle;
    }
    
    .impact-fill {
        height: 100%;
        transition: width 0.3s ease;
    }
    
    .impact-fill.positive {
        background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
    }
    
    .impact-fill.negative {
        background: linear-gradient(90deg, #dc3545 0%, #e91e63 100%);
    }
    
    .mobile-table-hint {
        text-align: center;
        font-style: italic;
    }
    
    /* Portfolio Builder - IMPROVED */
    .asset-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
    }
    
    .asset-row:hover {
        background: #e9ecef;
        transform: translateY(-1px);
    }
    
    .asset-row input {
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 5px;
        font-size: 14px;
    }
    
    .asset-row input:focus {
        border-color: var(--primary-color);
        outline: none;
        box-shadow: 0 0 0 2px rgba(30, 60, 114, 0.1);
    }
    
    .btn-remove {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: background-color 0.2s;
        min-width: 40px;
    }
    
    .btn-remove:hover {
        background: #c82333;
    }
    
    .portfolio-controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    /* Export Grid - ENHANCED */
    .export-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 25px;
        margin-top: 30px;
    }
    
    .export-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        transition: all 0.3s ease;
        border: 1px solid #dee2e6;
        position: relative;
        overflow: hidden;
    }
    
    .export-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--danger-color));
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .export-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        background: white;
    }
    
    .export-card:hover::before {
        opacity: 1;
    }
    
    .export-icon {
        font-size: 48px;
        margin-bottom: 15px;
        display: block;
    }
    
    .export-card h3 {
        color: var(--primary-color);
        margin-bottom: 10px;
    }
    
    .export-card p {
        color: #6c757d;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    
    .export-info {
        border-left: 4px solid #1976d2;
    }
    
    /* Saved Scenarios - IMPROVED */
    .saved-scenario {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
    }
    
    .saved-scenario:hover {
        background: #e3f2fd;
        border-color: var(--primary-color);
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .scenario-info {
        flex: 1;
    }
    
    .scenario-info strong {
        color: var(--primary-color);
        font-size: 16px;
        display: block;
        margin-bottom: 5px;
    }
    
    .scenario-info span {
        font-size: 14px;
        color: #6c757d;
        margin-right: 15px;
    }
    
    .scenario-actions {
        display: flex;
        gap: 10px;
    }
    
    .saved-scenarios-help ul {
        color: #495057;
    }
    
    .saved-scenarios-help li {
        margin-bottom: 5px;
    }
    
    /* Stress Test Results */
    .stress-test-result {
        background: #f8f9fa;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
        transition: all 0.3s ease;
    }
    
    .stress-test-result:hover {
        background: #e9ecef;
        transform: translateX(3px);
    }
    
    .stress-test-result strong {
        color: var(--primary-color);
    }
    
    /* Loading Animation */
    .loading {
        text-align: center;
        padding: 40px;
        background: #f8f9fa;
        border-radius: 10px;
        margin: 20px 0;
    }
    
    .loading p {
        margin-top: 15px;
        color: #6c757d;
        font-size: 14px;
    }
    
    /* Mobile Specific Improvements */
    @media (max-width: 768px) {
        .scenario-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .scenario-card {
            padding: 15px;
        }
        
        .monte-carlo-controls {
            padding: 15px;
        }
        
        .simulation-results {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
        }
        
        .result-card {
            padding: 15px;
        }
        
        .result-value {
            font-size: 18px;
        }
        
        .export-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .export-card {
            padding: 20px;
        }
        
        .export-icon {
            font-size: 36px;
        }
        
        .asset-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 12px;
        }
        
        .portfolio-controls {
            flex-direction: column;
        }
        
        .portfolio-controls .btn {
            width: 100%;
        }
        
        .saved-scenario {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
        }
        
        .scenario-actions {
            width: 100%;
            justify-content: space-between;
        }
        
        .scenario-actions .btn {
            flex: 1;
            margin: 0 5px;
        }
        
        .mobile-table-hint {
            display: block;
        }
        
        .waterfall-controls {
            flex-direction: column;
            gap: 15px;
        }
        
        .period-selector-group {
            width: 100%;
            flex-direction: column;
            gap: 10px;
        }
        
        .period-select {
            width: 100%;
        }
        
        .waterfall-summary {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .summary-icon {
            font-size: 24px;
        }
        
        .summary-value {
            font-size: 20px;
        }
        
        .analysis-tabs {
            flex-wrap: wrap;
        }
        
        .analysis-tab {
            padding: 8px 15px;
            font-size: 14px;
        }
        
        .cashflow-table {
            min-width: 500px;
        }
        
        .cashflow-table th,
        .cashflow-table td {
            padding: 10px 8px;
            font-size: 13px;
        }
    }
    
    @media (min-width: 769px) {
        .mobile-table-hint {
            display: none;
        }
    }
`;

// Add styles to document
if (!document.getElementById('tab-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tab-styles';
    styleSheet.textContent = TabStyles;
    document.head.appendChild(styleSheet);
}