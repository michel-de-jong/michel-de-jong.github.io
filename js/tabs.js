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
    `