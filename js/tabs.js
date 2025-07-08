// Tab Management - Updated to load templates from external files

class TabManager {
    constructor() {
        this.templates = {};
        this.loadedTabs = new Set();
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
        return `
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
            'export'
        ];
    }
}

// Create global tab manager instance
window.tabManager = new TabManager();

// For backward compatibility, export empty TabTemplates object
window.TabTemplates = {};

// The TabStyles can remain as they are CSS strings
const TabStyles = `
    /* Note: Tab-specific styles have been moved to separate CSS files */
    /* This is kept for backward compatibility */
`;

// Add minimal styles if not already present
if (!document.getElementById('tab-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tab-styles';
    styleSheet.textContent = TabStyles;
    document.head.appendChild(styleSheet);
}