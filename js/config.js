// Configuration file for ROI Calculator
const Config = {
    // Default Values
    defaults: {
        startKapitaal: 10000,
        lening: 10000,
        renteLening: 5,
        looptijd: 10,
        leningLooptijd: 5,
        rendementType: 'maandelijks',
        rendement: 5,
        aflossingsType: 'annuitair',
        herinvestering: 100,
        vasteKosten: 0,
        herinvesteringDrempel: 0,
        inflatie: 2.5,
        inflatieToggle: false,
        belastingType: 'zakelijk',
        box3Vrijstelling: 57000,
        box3ForfaitairRendement: 5.53,
        box3Tarief: 31
    },
    
    // Tax Configuration
    tax: {
        VPB_RATE: 0.258, // 25.8% Dutch corporate tax
        BOX3_VRIJSTELLING: 57000, // 2024 exemption amount
        BOX3_FORFAITAIR_RENDEMENT: 5.53, // 2024 forfait return rate
        BOX3_TARIEF: 31, // 2024 Box 3 tax rate
        BOX3_HOOGVERMOGEN_DREMPEL: 1000000, // High wealth threshold
        BOX3_HOOGVERMOGEN_RENDEMENT: 6.17 // Higher forfait rate for wealth > 1M
    },
    
    // Chart Configuration
    charts: {
        defaultHeight: 400,
        tallHeight: 500,
        colors: {
            primary: '#1e3c72',
            secondary: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            purple: '#6f42c1',
            orange: '#fd7e14'
        },
        gradients: {
            purple: ['#667eea', '#764ba2'],
            green: ['#11998e', '#38ef7d'],
            blue: ['#2193b0', '#6dd5ed'],
            orange: ['#f093fb', '#f5576c'],
            yellow: ['#f7971e', '#ffd200']
        }
    },
    
    // Monte Carlo Configuration
    monteCarlo: {
        defaultSimulations: 10000,
        minSimulations: 1000,
        maxSimulations: 100000,
        histogramBins: 50
    },
    
    // Export Configuration
    export: {
        excelFilename: 'ROI_Analyse',
        pdfFilename: 'ROI_Rapport',
        imageFormat: 'png',
        dateFormat: 'nl-NL'
    },
    
    // Validation Rules
    validation: {
        startKapitaal: { min: 0, max: null, step: 1000 },
        lening: { min: 0, max: null, step: 1000 },
        renteLening: { min: 0, max: 20, step: 0.1 },
        looptijd: { min: 1, max: 50, step: 1 },
        leningLooptijd: { min: 1, max: 50, step: 1 },
        rendement: { min: -10, max: 50, step: 0.1 },
        herinvestering: { min: 0, max: 100, step: 5 },
        vasteKosten: { min: 0, max: null, step: 100 },
        herinvesteringDrempel: { min: 0, max: null, step: 100 },
        inflatie: { min: 0, max: 10, step: 0.1 },
        box3Vrijstelling: { min: 0, max: null, step: 1000 },
        box3ForfaitairRendement: { min: 0, max: 20, step: 0.01 },
        box3Tarief: { min: 0, max: 50, step: 0.1 }
    },
    
    // Locale Configuration
    locale: {
        language: 'nl-NL',
        currency: 'EUR',
        numberFormat: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        },
        percentFormat: {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    },
    
    // Storage Configuration
    storage: {
        prefix: 'roi_calculator_',
        scenariosKey: 'saved_scenarios',
        settingsKey: 'user_settings',
        maxScenarios: 50
    },
    
    // API Endpoints (if needed in future)
    api: {
        baseUrl: '',
        endpoints: {
            save: '/api/scenarios/save',
            load: '/api/scenarios/load',
            export: '/api/export'
        }
    },
    
    // Feature Flags
    features: {
        enableAutoSave: true,
        enableCloudSync: false,
        enableAdvancedCharts: true,
        enableExportOptions: true,
        enableDarkMode: true
    },
    
    // Performance Settings
    performance: {
        debounceDelay: 300,
        throttleDelay: 100,
        maxChartDataPoints: 1000,
        enableWebWorkers: false
    }
};

// Freeze configuration to prevent modifications
Object.freeze(Config);
Object.freeze(Config.defaults);
Object.freeze(Config.tax);
Object.freeze(Config.charts);
Object.freeze(Config.monteCarlo);
Object.freeze(Config.export);
Object.freeze(Config.validation);
Object.freeze(Config.locale);
Object.freeze(Config.storage);
Object.freeze(Config.api);
Object.freeze(Config.features);
Object.freeze(Config.performance);
