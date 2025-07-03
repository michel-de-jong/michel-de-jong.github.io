// Tab Content Templates and Management

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
            <h2>Cashflow Waterfall Analyse</h2>
            <p>Gedetailleerd overzicht van alle geldstromen per periode</p>
            
            <div class="cashflow-period-selector">
                <label for="waterfallPeriod">Selecteer Periode:</label>
                <select id="waterfallPeriod">
                    <option value="jaar1">Jaar 1</option>
                    <option value="jaar5">Jaar 5</option>
                    <option value="jaar10">Jaar 10</option>
                    <option value="totaal">Totaal Overzicht</option>
                </select>
            </div>
            
            <div class="kpi-grid mt-3">
                <div class="kpi-card green">
                    <div class="kpi-label">Totale Inkomsten</div>
                    <div class="kpi-value" id="wfInkomsten">€ 0</div>
                </div>
                <div class="kpi-card orange">
                    <div class="kpi-label">Totale Uitgaven</div>
                    <div class="kpi-value" id="wfUitgaven">€ 0</div>
                </div>
                <div class="kpi-card blue">
                    <div class="kpi-label">Netto Cashflow</div>
                    <div class="kpi-value" id="wfNetto">€ 0</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Cash Conversie</div>
                    <div class="kpi-value" id="wfConversie">0%</div>
                </div>
            </div>
            
            <div class="chart-container tall mt-4">
                <canvas id="waterfallChart"></canvas>
            </div>
            
            <table class="cashflow-table mt-4">
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Bedrag</th>
                        <th>% van Totaal</th>
                        <th>Cumulatief</th>
                    </tr>
                </thead>
                <tbody id="waterfallTableBody">
                    <!-- Dynamically populated -->
                </tbody>
            </table>
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
            
            <button class="btn btn-primary" id="addAssetBtn">+ Asset Toevoegen</button>
            <button class="btn btn-success" id="calculatePortfolioBtn">Portfolio Berekenen</button>
            
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
            
            <button class="btn btn-primary" id="saveScenarioBtn">Huidig Scenario Opslaan</button>
            
            <div id="savedScenariosList" class="mt-4">
                <!-- Saved scenarios will be listed here -->
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
                    <p>Download complete analyse als Excel bestand</p>
                    <button class="btn btn-success" id="exportExcelBtn">Excel Downloaden</button>
                </div>
                
                <div class="export-card">
                    <div class="export-icon">📄</div>
                    <h3>PDF Rapport</h3>
                    <p>Genereer professioneel PDF rapport</p>
                    <button class="btn btn-danger" id="exportPDFBtn">PDF Genereren</button>
                </div>
                
                <div class="export-card">
                    <div class="export-icon">🖼️</div>
                    <h3>Grafiek Export</h3>
                    <p>Download grafieken als PNG afbeeldingen</p>
                    <button class="btn btn-primary" id="exportChartsBtn">Grafieken Downloaden</button>
                </div>
            </div>
        </section>
    `
};

// Add CSS for tab-specific styles
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
    
    /* Waterfall Specific */
    .cashflow-period-selector {
        margin-bottom: 20px;
    }
    
    .cashflow-table {
        width: 100%;
        margin-top: 30px;
        border-collapse: collapse;
    }
    
    .cashflow-table th,
    .cashflow-table td {
        padding: 12px;
        text-align: right;
        border-bottom: 1px solid #dee2e6;
    }
    
    .cashflow-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
    }
    
    .cashflow-table tr:hover {
        background: #f8f9fa;
    }
    
    /* Portfolio Builder */
    .asset-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
    }
    
    .asset-row input {
        padding: 8px;
    }
    
    .btn-remove {
        background: #dc3545;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
    }
    
    .btn-remove:hover {
        background: #c82333;
    }
    
    /* Export Grid */
    .export-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 30px;
    }
    
    .export-card {
        background: #f8f9fa;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        transition: all 0.3s;
    }
    
    .export-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .export-icon {
        font-size: 48px;
        margin-bottom: 15px;
    }
    
    /* Saved Scenarios */
    .saved-scenario {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .scenario-info {
        flex: 1;
    }
    
    .scenario-actions {
        display: flex;
        gap: 10px;
    }
`;

// Add styles to document
if (!document.getElementById('tab-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tab-styles';
    styleSheet.textContent = TabStyles;
    document.head.appendChild(styleSheet);
}