// Tab Content Templates and Management - ENHANCED VISUAL DESIGN

const TabTemplates = {
    scenarios: `
        <section id="scenarios" class="tab-pane" role="tabpanel">
            <h2>📊 Scenario Analyse</h2>
            <p class="tab-description">Vergelijk verschillende scenario's en analyseer de impact van veranderingen in uw parameters</p>
            
            <div class="scenario-comparison">
                <div class="scenario-grid">
                    <div class="scenario-card best-case">
                        <div class="scenario-header">
                            <span class="scenario-icon">🌟</span>
                            <h3>Best Case</h3>
                        </div>
                        <div class="scenario-body">
                            <div class="form-group">
                                <label for="bestCaseRendement">
                                    <span class="label-icon">📈</span>
                                    Rendement (%)
                                </label>
                                <input type="number" id="bestCaseRendement" value="1.2" step="0.1" class="scenario-input">
                                <div class="input-help">Optimistisch scenario</div>
                            </div>
                            <div class="form-group">
                                <label for="bestCaseKosten">
                                    <span class="label-icon">💰</span>
                                    Vaste Kosten (€)
                                </label>
                                <input type="number" id="bestCaseKosten" value="4000" step="100" class="scenario-input">
                                <div class="input-help">Lagere kosten verwacht</div>
                            </div>
                            <div class="scenario-result">
                                <div class="result-label">Verwachte ROI</div>
                                <div class="kpi-value scenario-roi" id="bestCaseROI">ROI: 0%</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scenario-card base-case">
                        <div class="scenario-header">
                            <span class="scenario-icon">📊</span>
                            <h3>Base Case</h3>
                        </div>
                        <div class="scenario-body">
                            <div class="form-group">
                                <label for="baseCaseRendement">
                                    <span class="label-icon">📈</span>
                                    Rendement (%)
                                </label>
                                <input type="number" id="baseCaseRendement" value="0.8" step="0.1" class="scenario-input">
                                <div class="input-help">Realistisch scenario</div>
                            </div>
                            <div class="form-group">
                                <label for="baseCaseKosten">
                                    <span class="label-icon">💰</span>
                                    Vaste Kosten (€)
                                </label>
                                <input type="number" id="baseCaseKosten" value="5000" step="100" class="scenario-input">
                                <div class="input-help">Verwachte kosten</div>
                            </div>
                            <div class="scenario-result">
                                <div class="result-label">Verwachte ROI</div>
                                <div class="kpi-value scenario-roi" id="baseCaseROI">ROI: 0%</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scenario-card worst-case">
                        <div class="scenario-header">
                            <span class="scenario-icon">⚠️</span>
                            <h3>Worst Case</h3>
                        </div>
                        <div class="scenario-body">
                            <div class="form-group">
                                <label for="worstCaseRendement">
                                    <span class="label-icon">📈</span>
                                    Rendement (%)
                                </label>
                                <input type="number" id="worstCaseRendement" value="0.3" step="0.1" class="scenario-input">
                                <div class="input-help">Pessimistisch scenario</div>
                            </div>
                            <div class="form-group">
                                <label for="worstCaseKosten">
                                    <span class="label-icon">💰</span>
                                    Vaste Kosten (€)
                                </label>
                                <input type="number" id="worstCaseKosten" value="6000" step="100" class="scenario-input">
                                <div class="input-help">Hogere kosten risico</div>
                            </div>
                            <div class="scenario-result">
                                <div class="result-label">Verwachte ROI</div>
                                <div class="kpi-value scenario-roi" id="worstCaseROI">ROI: 0%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="scenario-visualization">
                <div class="chart-container mt-4">
                    <canvas id="scenarioChart"></canvas>
                </div>
            </div>
            
            <div class="stress-test-section">
                <h3 class="section-header">
                    <span class="header-icon">🔬</span>
                    Stress Test Analyse
                </h3>
                <p class="section-description">Test de robuustheid van uw investering onder verschillende negatieve scenario's</p>
                
                <button class="btn btn-primary btn-lg" id="runStressTestBtn">
                    <span class="btn-icon">▶️</span>
                    Start Stress Test
                </button>
                
                <div id="stressTestResults" class="stress-test-results"></div>
            </div>
        </section>
    `,
    
    montecarlo: `
        <section id="montecarlo" class="tab-pane" role="tabpanel">
            <h2>🎲 Monte Carlo Simulatie</h2>
            <p class="tab-description">Geavanceerde probabilistische analyse met duizenden scenario's voor diepgaand risico-inzicht</p>
            
            <div class="monte-carlo-controls">
                <h3 class="control-header">
                    <span class="header-icon">⚙️</span>
                    Simulatie Parameters
                </h3>
                
                <div class="parameter-grid">
                    <div class="parameter-card">
                        <div class="parameter-header">
                            <span class="param-icon">🔢</span>
                            <label for="mcSimulations">Aantal Simulaties</label>
                        </div>
                        <div class="parameter-body">
                            <input type="number" id="mcSimulations" value="10000" min="1000" max="100000" step="1000">
                            <div class="parameter-scale">
                                <span>1K</span>
                                <div class="scale-bar">
                                    <div class="scale-fill" style="width: 10%"></div>
                                </div>
                                <span>100K</span>
                            </div>
                            <div class="parameter-help">Meer simulaties = nauwkeuriger resultaat</div>
                        </div>
                    </div>
                    
                    <div class="parameter-card">
                        <div class="parameter-header">
                            <span class="param-icon">📊</span>
                            <label for="mcVolatility">Rendement Volatiliteit (%)</label>
                        </div>
                        <div class="parameter-body">
                            <input type="number" id="mcVolatility" value="3" min="0" max="20" step="0.5">
                            <div class="volatility-indicator">
                                <div class="volatility-bar low"></div>
                                <div class="volatility-bar medium active"></div>
                                <div class="volatility-bar high"></div>
                            </div>
                            <div class="parameter-help">Standaarddeviatie van het rendement</div>
                        </div>
                    </div>
                    
                    <div class="parameter-card">
                        <div class="parameter-header">
                            <span class="param-icon">💸</span>
                            <label for="mcRenteVolatility">Rente Volatiliteit (%)</label>
                        </div>
                        <div class="parameter-body">
                            <input type="number" id="mcRenteVolatility" value="1" min="0" max="5" step="0.1">
                            <div class="volatility-indicator">
                                <div class="volatility-bar low active"></div>
                                <div class="volatility-bar medium"></div>
                                <div class="volatility-bar high"></div>
                            </div>
                            <div class="parameter-help">Variatie in rentetarieven</div>
                        </div>
                    </div>
                    
                    <div class="parameter-card">
                        <div class="parameter-header">
                            <span class="param-icon">📉</span>
                            <label for="mcKostenVolatility">Kosten Volatiliteit (%)</label>
                        </div>
                        <div class="parameter-body">
                            <input type="number" id="mcKostenVolatility" value="10" min="0" max="50" step="5">
                            <div class="volatility-indicator">
                                <div class="volatility-bar low"></div>
                                <div class="volatility-bar medium active"></div>
                                <div class="volatility-bar high"></div>
                            </div>
                            <div class="parameter-help">Variatie in vaste kosten</div>
                        </div>
                    </div>
                </div>
                
                <div class="simulation-action">
                    <button class="btn btn-primary btn-xl" id="runMonteCarloBtn">
                        <span class="btn-icon">🎲</span>
                        Start Monte Carlo Simulatie
                    </button>
                </div>
            </div>
            
            <div class="loading" id="mcLoading">
                <div class="loading-animation">
                    <div class="dice-animation">
                        <span class="dice">🎲</span>
                        <span class="dice">🎲</span>
                        <span class="dice">🎲</span>
                    </div>
                </div>
                <p>Simulatie wordt uitgevoerd... <span class="progress">0%</span></p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            
            <div class="simulation-results" id="mcResults" style="display: none;">
                <h3 class="results-header">
                    <span class="header-icon">📊</span>
                    Simulatie Resultaten
                </h3>
                
                <div class="results-grid">
                    <div class="result-card primary">
                        <div class="result-icon">📊</div>
                        <h4>Mediaan ROI (P50)</h4>
                        <div class="result-value" id="mcMedianROI">0%</div>
                        <div class="result-description">Meest waarschijnlijke uitkomst</div>
                    </div>
                    
                    <div class="result-card info">
                        <div class="result-icon">🎯</div>
                        <h4>95% Confidence Interval</h4>
                        <div class="result-value" id="mcConfidence">0% - 0%</div>
                        <div class="result-description">Waarschijnlijke range (P5-P95)</div>
                    </div>
                    
                    <div class="result-card warning">
                        <div class="result-icon">⚠️</div>
                        <h4>Kans op Verlies</h4>
                        <div class="result-value" id="mcLossProb">0%</div>
                        <div class="result-description">Percentage negatieve uitkomsten</div>
                    </div>
                    
                    <div class="result-card danger">
                        <div class="result-icon">📉</div>
                        <h4>Value at Risk (5%)</h4>
                        <div class="result-value" id="mcVaR">€ 0</div>
                        <div class="result-description">Maximum verlies in 95% gevallen</div>
                    </div>
                </div>
            </div>
            
            <div class="monte-carlo-charts">
                <div class="chart-container mt-4" style="display: none;" id="mcChartContainer">
                    <h4 class="chart-title">ROI Distributie over Simulaties</h4>
                    <canvas id="monteCarloChart"></canvas>
                </div>
                
                <div class="chart-container mt-4" style="display: none;" id="mcDistContainer">
                    <h4 class="chart-title">Waarschijnlijkheidsverdeling</h4>
                    <canvas id="distributionChart"></canvas>
                </div>
            </div>
        </section>
    `,
    
    waterfall: `
        <section id="waterfall" class="tab-pane" role="tabpanel">
            <h2>💧 Cashflow Waterfall Analyse</h2>
            <p class="tab-description">Gedetailleerd overzicht van alle geldstromen per periode met visuele breakdown</p>
            
            <div class="waterfall-controls">
                <div class="period-selector-group">
                    <label for="waterfallPeriod">
                        <span class="label-icon">📅</span>
                        Selecteer Periode:
                    </label>
                    <select id="waterfallPeriod" class="period-select">
                        <!-- Dynamically populated -->
                    </select>
                    <button class="btn btn-sm btn-secondary" id="comparePeriodsBtn">
                        <span class="btn-icon">📊</span>
                        Vergelijk Periodes
                    </button>
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
                                    <th>% van Totaal</th>
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
                <h3>💡 Inzichten & Aanbevelingen</h3>
                <div id="waterfallInsights" class="insights-grid">
                    <!-- Dynamically populated insights -->
                </div>
            </div>
            
            <div class="mobile-table-hint mt-2">
                💡 Tip: Swipe de tabel horizontaal om alle kolommen te zien
            </div>
        </section>
    `,
    
    portfolio: `
        <section id="portfolio" class="tab-pane" role="tabpanel">
            <h2>🏦 Multi-Asset Portfolio Builder</h2>
            <p class="tab-description">Bouw een gediversifieerde portfolio met verschillende assets en analyseer risico/rendement verhoudingen</p>
            
            <div class="portfolio-builder">
                <h3 class="section-header">
                    <span class="header-icon">📊</span>
                    Portfolio Samenstelling
                </h3>
                
                <div id="assetList" class="asset-list">
                    <div class="asset-row">
                        <div class="asset-field">
                            <label>Asset Naam</label>
                            <input type="text" placeholder="Bijv. Aandelen" class="asset-name">
                        </div>
                        <div class="asset-field">
                            <label>Bedrag (€)</label>
                            <input type="number" placeholder="100000" class="asset-amount" min="0" step="1000">
                        </div>
                        <div class="asset-field">
                            <label>Rendement %</label>
                            <input type="number" placeholder="7.5" class="asset-return" step="0.1">
                        </div>
                        <div class="asset-field">
                            <label>Risico %</label>
                            <input type="number" placeholder="15" class="asset-risk" min="0" max="100" step="1">
                        </div>
                        <button class="btn-remove" data-action="remove">×</button>
                    </div>
                </div>
                
                <div class="portfolio-controls mt-3">
                    <button class="btn btn-secondary" id="addAssetBtn">
                        <span class="btn-icon">➕</span>
                        Asset Toevoegen
                    </button>
                    <button class="btn btn-success" id="calculatePortfolioBtn">
                        <span class="btn-icon">📊</span>
                        Portfolio Berekenen
                    </button>
                </div>
            </div>
            
            <div class="portfolio-metrics">
                <h3 class="section-header">
                    <span class="header-icon">📈</span>
                    Portfolio Prestaties
                </h3>
                
                <div class="kpi-grid mt-4">
                    <div class="kpi-card">
                        <div class="kpi-icon">💰</div>
                        <div class="kpi-label">Portfolio Waarde</div>
                        <div class="kpi-value" id="portfolioWaarde">€ 0</div>
                    </div>
                    <div class="kpi-card green">
                        <div class="kpi-icon">📈</div>
                        <div class="kpi-label">Gewogen Rendement</div>
                        <div class="kpi-value" id="portfolioRendement">0%</div>
                    </div>
                    <div class="kpi-card orange">
                        <div class="kpi-icon">⚠️</div>
                        <div class="kpi-label">Portfolio Risico</div>
                        <div class="kpi-value" id="portfolioRisico">0%</div>
                    </div>
                </div>
            </div>
            
            <div class="portfolio-visualization">
                <h3 class="section-header">
                    <span class="header-icon">🎯</span>
                    Asset Verdeling
                </h3>
                
                <div class="chart-container mt-4">
                    <canvas id="portfolioChart"></canvas>
                </div>
            </div>
        </section>
    `,
    
    saved: `
        <section id="saved" class="tab-pane" role="tabpanel">
            <h2>💾 Opgeslagen Scenario's</h2>
            <p class="tab-description">Beheer en vergelijk uw opgeslagen investeringsscenario's</p>
            
            <div class="saved-controls">
                <button class="btn btn-primary btn-lg" id="saveScenarioBtn">
                    <span class="btn-icon">💾</span>
                    Huidig Scenario Opslaan
                </button>
            </div>
            
            <div class="saved-scenarios-container">
                <h3 class="section-header">
                    <span class="header-icon">📋</span>
                    Scenario Overzicht
                </h3>
                
                <div id="savedScenariosList" class="saved-scenarios-list">
                    <!-- Saved scenarios will be listed here -->
                </div>
            </div>
            
            <div class="saved-scenarios-help">
                <div class="help-card">
                    <h4>💡 Tips voor Scenario Beheer</h4>
                    <ul>
                        <li>Sla interessante combinaties van parameters op voor later vergelijken</li>
                        <li>Gebruik verschillende scenario's voor presentaties aan stakeholders</li>
                        <li>Maximum van 50 scenario's worden bewaard</li>
                        <li>Data wordt lokaal in uw browser opgeslagen</li>
                    </ul>
                </div>
            </div>
        </section>
    `,
    
    export: `
        <section id="export" class="tab-pane" role="tabpanel">
            <h2>📤 Export Functies</h2>
            <p class="tab-description">Exporteer uw analyses naar verschillende formaten voor rapportage en presentaties</p>
            
            <div class="export-grid">
                <div class="export-card excel">
                    <div class="export-icon">📊</div>
                    <h3>Excel Export</h3>
                    <p>Download complete analyse als Excel bestand met alle data, berekeningen en grafieken</p>
                    <div class="export-features">
                        <span class="feature">✓ Alle berekeningen</span>
                        <span class="feature">✓ Jaarlijkse data</span>
                        <span class="feature">✓ Scenario's</span>
                    </div>
                    <button class="btn btn-success btn-lg" id="exportExcelBtn">
                        <span class="btn-icon">📥</span>
                        Excel Downloaden
                    </button>
                </div>
                
                <div class="export-card pdf">
                    <div class="export-icon">📄</div>
                    <h3>PDF Rapport</h3>
                    <p>Genereer professioneel PDF rapport met executive summary en belangrijkste inzichten</p>
                    <div class="export-features">
                        <span class="feature">✓ Executive summary</span>
                        <span class="feature">✓ Grafieken</span>
                        <span class="feature">✓ Professionele opmaak</span>
                    </div>
                    <button class="btn btn-danger btn-lg" id="exportPDFBtn">
                        <span class="btn-icon">📄</span>
                        PDF Genereren
                    </button>
                </div>
                
                <div class="export-card images">
                    <div class="export-icon">🖼️</div>
                    <h3>Grafiek Export</h3>
                    <p>Download alle grafieken als hoge resolutie PNG afbeeldingen voor presentaties</p>
                    <div class="export-features">
                        <span class="feature">✓ Hoge resolutie</span>
                        <span class="feature">✓ Transparante achtergrond</span>
                        <span class="feature">✓ Presentatie-klaar</span>
                    </div>
                    <button class="btn btn-primary btn-lg" id="exportChartsBtn">
                        <span class="btn-icon">🖼️</span>
                        Grafieken Downloaden
                    </button>
                </div>
            </div>
            
            <div class="export-info">
                <h3 class="info-header">
                    <span class="header-icon">ℹ️</span>
                    Export Informatie
                </h3>
                
                <div class="info-grid">
                    <div class="info-card">
                        <h4>📊 Excel Bestand</h4>
                        <p>Het Excel bestand bevat:</p>
                        <ul>
                            <li>Alle invoerparameters en instellingen</li>
                            <li>Jaarlijkse vermogensontwikkeling</li>
                            <li>Maandelijkse cashflow data</li>
                            <li>Scenario vergelijkingen</li>
                            <li>Monte Carlo resultaten</li>
                        </ul>
                    </div>
                    
                    <div class="info-card">
                        <h4>📄 PDF Rapport</h4>
                        <p>Het PDF rapport bevat:</p>
                        <ul>
                            <li>Executive summary met key metrics</li>
                            <li>Grafische weergave van resultaten</li>
                            <li>Risico analyse overzicht</li>
                            <li>Professionele rapportage layout</li>
                            <li>Print-vriendelijk formaat</li>
                        </ul>
                    </div>
                    
                    <div class="info-card">
                        <h4>🖼️ Afbeeldingen</h4>
                        <p>De grafiek export bevat:</p>
                        <ul>
                            <li>PNG bestanden in hoge resolutie</li>
                            <li>Alle actieve grafieken en charts</li>
                            <li>Transparante achtergrond optie</li>
                            <li>Direct bruikbaar in presentaties</li>
                            <li>Optimaal voor PowerPoint/Keynote</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    `
};

// Add CSS for tab-specific styles - ENHANCED VISUAL DESIGN
const TabStyles = `
    /* General Tab Enhancements */
    .tab-description {
        color: #6c757d;
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 1.6;
    }
    
    .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-color);
        margin-bottom: 20px;
        font-size: 1.3em;
    }
    
    .header-icon {
        font-size: 1.2em;
    }
    
    .section-description {
        color: #6c757d;
        margin-bottom: 20px;
        font-size: 14px;
    }
    
    /* Enhanced Scenario Cards */
    .scenario-comparison {
        margin-bottom: 40px;
    }
    
    .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 25px;
        margin-top: 20px;
    }
    
    .scenario-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        border: 2px solid transparent;
        transition: all 0.3s ease;
        overflow: hidden;
    }
    
    .scenario-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .scenario-card.best-case {
        border-color: #28a745;
    }
    
    .scenario-card.base-case {
        border-color: #ffc107;
    }
    
    .scenario-card.worst-case {
        border-color: #dc3545;
    }
    
    .scenario-header {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .scenario-icon {
        font-size: 32px;
    }
    
    .scenario-header h3 {
        margin: 0;
        color: var(--primary-color);
        font-size: 1.2em;
    }
    
    .scenario-body {
        padding: 25px;
    }
    
    .scenario-input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    
    .scenario-input:focus {
        border-color: var(--primary-color);
        outline: none;
        box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
    }
    
    .input-help {
        font-size: 12px;
        color: #6c757d;
        margin-top: 5px;
    }
    
    .label-icon {
        margin-right: 5px;
    }
    
    .scenario-result {
        margin-top: 25px;
        padding: 20px;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-radius: 10px;
        text-align: center;
    }
    
    .result-label {
        font-size: 14px;
        color: #495057;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .scenario-roi {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
    }
    
    .scenario-roi.excellent {
        color: #00c851;
    }
    
    .scenario-roi.good {
        color: #28a745;
    }
    
    .scenario-roi.moderate {
        color: #ffc107;
    }
    
    .scenario-roi.poor {
        color: #dc3545;
    }
    
    /* Enhanced Stress Test Section */
    .stress-test-section {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        padding: 30px;
        border-radius: 12px;
        margin-top: 40px;
    }
    
    .btn-lg {
        padding: 14px 28px;
        font-size: 16px;
    }
    
    .btn-xl {
        padding: 18px 36px;
        font-size: 18px;
    }
    
    .btn-icon {
        margin-right: 8px;
        font-size: 1.1em;
    }
    
    .stress-test-results {
        margin-top: 30px;
    }
    
    .stress-test-summary {
        background: #e3f2fd;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
    }
    
    .stress-test-result {
        background: white;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border-left: 4px solid transparent;
        transition: all 0.3s ease;
    }
    
    .stress-test-result.severe {
        border-left-color: #dc3545;
    }
    
    .stress-test-result.moderate {
        border-left-color: #ffc107;
    }
    
    .stress-test-result.mild {
        border-left-color: #fd7e14;
    }
    
    .stress-test-result.positive {
        border-left-color: #28a745;
    }
    
    .stress-test-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .stress-test-icon {
        font-size: 24px;
    }
    
    .stress-test-metrics {
        display: flex;
        gap: 30px;
        margin-bottom: 15px;
    }
    
    .metric {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .metric .label {
        color: #6c757d;
        font-size: 14px;
    }
    
    .metric .value {
        font-weight: 600;
        font-size: 16px;
    }
    
    /* Enhanced Monte Carlo Design */
    .monte-carlo-controls {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .control-header {
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-color);
    }
    
    .parameter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .parameter-card {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        padding: 20px;
        transition: all 0.3s ease;
    }
    
    .parameter-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transform: translateY(-2px);
    }
    
    .parameter-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .param-icon {
        font-size: 24px;
    }
    
    .parameter-body input {
        width: 100%;
        padding: 10px;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-size: 16px;
        margin-bottom: 10px;
    }
    
    .parameter-scale {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 10px;
    }
    
    .scale-bar {
        flex: 1;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
    }
    
    .scale-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
    }
    
    .volatility-indicator {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
    }
    
    .volatility-bar {
        flex: 1;
        height: 20px;
        background: #e9ecef;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .volatility-bar.active {
        background: var(--primary-color);
    }
    
    .volatility-bar.low.active {
        background: #28a745;
    }
    
    .volatility-bar.medium.active {
        background: #ffc107;
    }
    
    .volatility-bar.high.active {
        background: #dc3545;
    }
    
    .parameter-help {
        font-size: 12px;
        color: #6c757d;
    }
    
    .simulation-action {
        text-align: center;
    }
    
    /* Enhanced Loading Animation */
    .loading {
        text-align: center;
        padding: 60px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        margin: 20px 0;
    }
    
    .loading-animation {
        margin-bottom: 20px;
    }
    
    .dice-animation {
        display: flex;
        justify-content: center;
        gap: 15px;
    }
    
    .dice {
        font-size: 48px;
        animation: rollDice 1s ease-in-out infinite;
    }
    
    .dice:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .dice:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes rollDice {
        0%, 100% {
            transform: rotateZ(0deg);
        }
        50% {
            transform: rotateZ(360deg);
        }
    }
    
    .progress {
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .progress-bar {
        width: 100%;
        max-width: 400px;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        margin: 15px auto 0;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
        width: 0%;
        transition: width 0.3s ease;
    }
    
    /* Enhanced Results Display */
    .simulation-results {
        margin-top: 40px;
    }
    
    .results-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 25px;
        color: var(--primary-color);
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }
    
    .result-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        text-align: center;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .result-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .result-card.primary {
        border-color: var(--primary-color);
    }
    
    .result-card.info {
        border-color: var(--info-color);
    }
    
    .result-card.warning {
        border-color: var(--warning-color);
    }
    
    .result-card.danger {
        border-color: var(--danger-color);
    }
    
    .result-icon {
        font-size: 36px;
        margin-bottom: 15px;
    }
    
    .result-card h4 {
        color: #495057;
        margin-bottom: 15px;
        font-size: 16px;
    }
    
    .result-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 10px;
        color: var(--primary-color);
    }
    
    .result-value.excellent {
        color: #00c851;
    }
    
    .result-value.good {
        color: #28a745;
    }
    
    .result-value.moderate {
        color: #ffc107;
    }
    
    .result-value.poor {
        color: #dc3545;
    }
    
    .result-description {
        font-size: 13px;
        color: #6c757d;
    }
    
    .monte-carlo-charts {
        margin-top: 40px;
    }
    
    .chart-title {
        color: #495057;
        margin-bottom: 15px;
        font-size: 16px;
        text-align: center;
    }
    
    /* Enhanced Waterfall Styles */
    .waterfall-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;
        padding: 25px;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
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
        display: flex;
        align-items: center;
        gap: 8px;
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
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .insight-card {
        padding: 20px;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-radius: 10px;
        border-left: 4px solid #1976d2;
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
        font-size: 13px;
        color: #6c757d;
    }
    
    /* Enhanced Portfolio Builder */
    .portfolio-builder {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 30px;
    }
    
    .asset-list {
        margin-top: 20px;
    }
    
    .asset-row {
        display: grid;
        grid-template-columns: 2fr 1.5fr 1fr 1fr auto;
        gap: 15px;
        align-items: end;
        margin-bottom: 15px;
        padding: 20px;
        background: white;
        border-radius: 10px;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
    }
    
    .asset-row:hover {
        border-color: var(--primary-color);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .asset-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .asset-field label {
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
    }
    
    .asset-row input {
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 6px;
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
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s;
        min-width: 40px;
        align-self: center;
    }
    
    .btn-remove:hover {
        background: #c82333;
        transform: scale(1.1);
    }
    
    .portfolio-controls {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-top: 20px;
    }
    
    .portfolio-metrics {
        margin-top: 40px;
    }
    
    .portfolio-metrics .kpi-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 25px;
    }
    
    .kpi-icon {
        font-size: 36px;
        margin-bottom: 10px;
    }
    
    .portfolio-visualization {
        margin-top: 40px;
    }
    
    /* Enhanced Saved Scenarios */
    .saved-controls {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .saved-scenarios-container {
        margin-top: 40px;
    }
    
    .saved-scenarios-list {
        margin-top: 20px;
    }
    
    .saved-scenario {
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .saved-scenario:hover {
        border-color: var(--primary-color);
        transform: translateX(5px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
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
    
    .saved-scenarios-help {
        margin-top: 40px;
    }
    
    .help-card {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        padding: 25px;
        border-radius: 12px;
        border-left: 4px solid #1976d2;
    }
    
    .help-card h4 {
        color: #1976d2;
        margin-bottom: 15px;
    }
    
    .help-card ul {
        margin-left: 20px;
        color: #495057;
    }
    
    .help-card li {
        margin-bottom: 8px;
        line-height: 1.6;
    }
    
    /* Enhanced Export Cards */
    .export-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 30px;
        margin-top: 30px;
    }
    
    .export-card {
        background: white;
        padding: 35px;
        border-radius: 12px;
        text-align: center;
        transition: all 0.3s ease;
        border: 2px solid transparent;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .export-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .export-card.excel::before {
        background: linear-gradient(90deg, #28a745, #20c997);
    }
    
    .export-card.pdf::before {
        background: linear-gradient(90deg, #dc3545, #e91e63);
    }
    
    .export-card.images::before {
        background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
    }
    
    .export-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .export-card:hover::before {
        opacity: 1;
    }
    
    .export-icon {
        font-size: 64px;
        margin-bottom: 20px;
        display: block;
    }
    
    .export-card h3 {
        color: var(--primary-color);
        margin-bottom: 15px;
        font-size: 1.4em;
    }
    
    .export-card p {
        color: #6c757d;
        margin-bottom: 25px;
        line-height: 1.6;
    }
    
    .export-features {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-bottom: 25px;
    }
    
    .feature {
        background: #e3f2fd;
        color: #1976d2;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 13px;
    }
    
    .export-info {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        padding: 30px;
        border-radius: 12px;
        margin-top: 40px;
        border-left: 4px solid #1976d2;
    }
    
    .info-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #1976d2;
        margin-bottom: 25px;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 25px;
    }
    
    .info-card {
        background: white;
        padding: 25px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .info-card h4 {
        color: #495057;
        margin-bottom: 15px;
        font-size: 1.1em;
    }
    
    .info-card p {
        color: #6c757d;
        margin-bottom: 15px;
        font-size: 14px;
    }
    
    .info-card ul {
        margin-left: 20px;
        color: #495057;
        font-size: 14px;
    }
    
    .info-card li {
        margin-bottom: 8px;
        line-height: 1.5;
    }
    
    /* Trends and Ratios Styling */
    .trends-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .trend-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .trend-card h4 {
        color: var(--primary-color);
        margin-bottom: 15px;
    }
    
    .trend-stats {
        margin-top: 15px;
    }
    
    .trend-stats div {
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
        font-size: 14px;
        color: #495057;
    }
    
    .trend-stats div:last-child {
        border-bottom: none;
    }
    
    .ratios-analysis {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
    }
    
    .ratios-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
    }
    
    .ratio-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    
    .ratio-label {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .ratio-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 8px;
    }
    
    .ratio-description {
        font-size: 11px;
        color: #6c757d;
        line-height: 1.4;
    }
    
    /* Mobile Responsive Improvements */
    @media (max-width: 768px) {
        .scenario-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .scenario-card {
            margin-bottom: 0;
        }
        
        .parameter-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .results-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .result-value {
            font-size: 24px;
        }
        
        .export-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .export-icon {
            font-size: 48px;
        }
        
        .asset-row {
            grid-template-columns: 1fr;
            gap: 10px;
        }
        
        .asset-field {
            width: 100%;
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
        }
        
        .scenario-actions {
            width: 100%;
            justify-content: space-between;
        }
        
        .scenario-actions .btn {
            flex: 1;
            margin: 0 5px;
        }
        
        .waterfall-controls {
            flex-direction: column;
            gap: 15px;
            padding: 20px;
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
        
        .info-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .btn-lg {
            padding: 12px 20px;
            font-size: 15px;
        }
        
        .btn-xl {
            padding: 14px 24px;
            font-size: 16px;
        }
        
        .dice {
            font-size: 36px;
        }
        
        .analysis-tabs {
            flex-wrap: wrap;
        }
        
        .analysis-tab {
            padding: 8px 15px;
            font-size: 14px;
        }
    }
    
    @media (max-width: 480px) {
        .tab-description {
            font-size: 14px;
        }
        
        .section-header {
            font-size: 1.1em;
        }
        
        .result-card h4 {
            font-size: 14px;
        }
        
        .result-value {
            font-size: 20px;
        }
        
        .export-card {
            padding: 25px;
        }
        
        .export-card h3 {
            font-size: 1.2em;
        }
        
        .ratios-grid {
            grid-template-columns: 1fr;
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
