// Tab Manager Module
export class TabManager {
    constructor() {
        this.templates = {};
        this.loadedTabs = new Set();
        this.currentTab = 'calculator';
        this.listeners = [];
        this.tabElements = new Map();
    }
    
    /**
     * Load template from external file
     * @param {string} tabName - Name of the tab
     * @returns {Promise<string>} Template HTML
     */
    async loadTemplate(tabName) {
        if (this.templates[tabName]) {
            return this.templates[tabName];
        }
        
        try {
            const response = await fetch(`templates/${tabName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${tabName}`);
            }
            
            const html = await response.text();
            this.templates[tabName] = html;
            return html;
        } catch (error) {
            console.error(`Error loading template ${tabName}:`, error);
            return this.getFallbackTemplate(tabName);
        }
    }
    
    /**
     * Get fallback template if loading fails
     * @param {string} tabName - Name of the tab
     * @returns {string} Fallback HTML
     */
    getFallbackTemplate(tabName) {
        const templates = {
            scenarios: `
                <section id="scenarios" class="tab-pane" role="tabpanel">
                    <h2>📊 Scenario Analyse</h2>
                    <p>Template could not be loaded. Please check templates/scenarios.html</p>
                </section>
            `,
            montecarlo: `
                <section id="montecarlo" class="tab-pane" role="tabpanel">
                    <h2>🎲 Monte Carlo Simulatie</h2>
                    <p>Template could not be loaded. Please check templates/montecarlo.html</p>
                </section>
            `,
            waterfall: `
                <section id="waterfall" class="tab-pane" role="tabpanel">
                    <h2>💧 Cashflow Waterfall</h2>
                    <p>Template could not be loaded. Please check templates/waterfall.html</p>
                </section>
            `,
            portfolio: `
                <section id="portfolio" class="tab-pane" role="tabpanel">
                    <h2>🏦 Portfolio Builder</h2>
                    <p>Template could not be loaded. Please check templates/portfolio.html</p>
                </section>
            `,
            saved: `
                <section id="saved" class="tab-pane" role="tabpanel">
                    <h2>💾 Opgeslagen Scenario's</h2>
                    <p>Template could not be loaded. Please check templates/saved.html</p>
                </section>
            `,
            export: `
                <section id="export" class="tab-pane" role="tabpanel">
                    <h2>📤 Export Functies</h2>
                    <p>Template could not be loaded. Please check templates/export.html</p>
                </section>
            `,
            historical: `
                <section id="historical" class="tab-pane" role="tabpanel">
                    <h2>📊 Historische Prestaties</h2>
                    <p>Template could not be loaded. Please check templates/historical.html</p>
                </section>
            `
        };
        
        return templates[tabName] || `
            <section id="${tabName}" class="tab-pane" role="tabpanel">
                <h2>Error Loading Tab</h2>
                <p>Unable to load the ${tabName} tab. Please refresh the page.</p>
            </section>
        `;
    }
    
    /**
     * Initialize tab content
     * @param {string} tabName - Name of the tab
     * @param {HTMLElement} container - Container element
     */
    async initializeTab(tabName, container) {
        if (this.loadedTabs.has(tabName)) {
            return;
        }
        
        const template = await this.loadTemplate(tabName);
        const tabElement = document.getElementById(tabName);
        
        if (!tabElement) {
            container.insertAdjacentHTML('beforeend', template);
            this.loadedTabs.add(tabName);
        }
    }
    
    /**
     * Load all templates at startup
     */
    async initialize() {
        const container = document.getElementById('additionalTabs');
        if (!container) return;
        
        const tabs = this.getAvailableTabs();
        
        for (const tabName of tabs) {
            try {
                await this.initializeTab(tabName, container);
            } catch (error) {
                console.error(`Failed to load template ${tabName}:`, error);
            }
        }
        
        this.setupTabListeners();
    }
    
    /**
     * Setup tab navigation listeners
     */
    setupTabListeners() {
        document.querySelectorAll('.tab').forEach(tab => {
            const tabName = tab.dataset.tab;
            if (tabName) {
                this.tabElements.set(tabName, tab);
                tab.addEventListener('click', () => this.switchTab(tabName));
            }
        });
    }
    
    /**
     * Switch to a specific tab
     * @param {string} tabName - Name of the tab to switch to
     */
    switchTab(tabName) {
        if (!tabName || tabName === this.currentTab) return;
        
        // Update UI
        this.tabElements.forEach((element, name) => {
            element.classList.toggle('active', name === tabName);
            element.setAttribute('aria-selected', name === tabName);
        });
        
        // Update content visibility
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabName);
        });
        
        this.currentTab = tabName;
        
        // Notify listeners
        this.notifyListeners(tabName);
    }
    
    /**
     * Get list of available tabs
     * @returns {array} Tab names
     */
    getAvailableTabs() {
        return [
            'scenarios',
            'montecarlo',
            'waterfall',
            'portfolio',
            'saved',
            'export',
            'historical'
        ];
    }
    
    /**
     * Subscribe to tab changes
     * @param {function} callback - Function to call on tab change
     * @returns {function} Unsubscribe function
     */
    onTabChange(callback) {
        this.listeners.push(callback);
        
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    
    /**
     * Notify listeners of tab change
     * @param {string} tabName - Name of the new active tab
     */
    notifyListeners(tabName) {
        this.listeners.forEach(listener => {
            try {
                listener(tabName);
            } catch (error) {
                console.error('Error in tab change listener:', error);
            }
        });
    }
    
    /**
     * Get current active tab
     * @returns {string} Current tab name
     */
    getCurrentTab() {
        return this.currentTab;
    }
    
    /**
     * Check if a tab is loaded
     * @param {string} tabName - Name of the tab
     * @returns {boolean} Whether the tab is loaded
     */
    isTabLoaded(tabName) {
        return this.loadedTabs.has(tabName);
    }
    
    /**
     * Refresh a specific tab
     * @param {string} tabName - Name of the tab to refresh
     */
    async refreshTab(tabName) {
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            // Clear cached template
            delete this.templates[tabName];
            this.loadedTabs.delete(tabName);
            
            // Reload template
            const template = await this.loadTemplate(tabName);
            tabElement.outerHTML = template;
            this.loadedTabs.add(tabName);
            
            // Notify that tab has been refreshed
            if (this.currentTab === tabName) {
                this.notifyListeners(tabName);
            }
        }
    }
    
    /**
     * Enable/disable a tab
     * @param {string} tabName - Name of the tab
     * @param {boolean} enabled - Whether to enable or disable
     */
    setTabEnabled(tabName, enabled) {
        const tabElement = this.tabElements.get(tabName);
        if (tabElement) {
            tabElement.disabled = !enabled;
            tabElement.classList.toggle('disabled', !enabled);
        }
    }
    
    /**
     * Show loading state for a tab
     * @param {string} tabName - Name of the tab
     * @param {boolean} loading - Whether to show loading state
     */
    setTabLoading(tabName, loading) {
        const tabPane = document.getElementById(tabName);
        if (tabPane) {
            if (loading) {
                tabPane.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading ${tabName}...</p>
                    </div>
                `;
            }
        }
    }
}