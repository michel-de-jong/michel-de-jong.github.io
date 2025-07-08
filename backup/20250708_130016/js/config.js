// Configuration file for ROI Calculator - IMPROVED VERSION WITH ENHANCED TAX CONFIG
const Config = {
    // Default Values - THESE WILL BE USED TO POPULATE INPUT FIELDS
    defaults: {
        startKapitaal: 50000,
        lening: 100000,
        renteLening: 8,
        looptijd: 10,
        leningLooptijd: 10,
        rendementType: 'maandelijks',
        rendement: 3,
        aflossingsType: 'annuitair',
        herinvestering: 80,
        vasteKosten: 2500,
        herinvesteringDrempel: 1000,
        inflatie: 2.5,
        belastingType: 'vpb',
        
        // Privé Belasting Defaults
        priveSubType: 'box1',
        box1Tarief: 37.07,              // Gemiddeld tarief box 1 (2024)
        box3Rendement: 6.04,            // Fictief rendement box 3 (2024)
        box3Tarief: 31,                 // Tarief box 3 (2024)
        box3Vrijstelling: 57000         // Heffingsvrije voet box 3 (2024, alleenstaanden)
    },
    
    // Tax Configuration - COMPREHENSIVE DUTCH TAX SYSTEM
    tax: {
        // VPB - Vennootschapsbelasting (Corporate Tax)
        VPB_RATE: 0.258,               // 25.8% (2024)
        VPB_LOW_RATE: 0.19,            // 19% tot €200.000 (2024)
        VPB_LOW_THRESHOLD: 200000,     // Grens lage tarief
        
        // Box 1 - Inkomstenbelasting tarieven (2024)
        BOX1_BRACKETS: [
            { min: 0, max: 37149, rate: 0.3693 },
            { min: 37149, max: 73031, rate: 0.3693 },
            { min: 73031, max: Infinity, rate: 0.495 }
        ],
        
        // Box 3 - Vermogensbelasting (2024)
        BOX3_RENDEMENT_BRACKETS: [
            { min: 0, max: 57000, rate: 0 },           // Heffingsvrije voet
            { min: 57000, max: 114000, rate: 0.0604 }, // 6.04%
            { min: 114000, max: Infinity, rate: 0.0651 } // 6.51%
        ],
        BOX3_BELASTING_TARIEF: 0.31,   // 31% over fictief rendement
        
        // Default tarieven voor snelle berekening
        DEFAULT_BOX1_RATE: 0.3707,     // Gemiddeld tarief
        DEFAULT_BOX3_RATE: 0.31,
        DEFAULT_BOX3_RENDEMENT: 0.0604
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
        box1Tarief: { min: 0, max: 60, step: 0.1 },
        box3Rendement: { min: 0, max: 20, step: 0.1 },
        box3Tarief: { min: 0, max: 50, step: 0.1 },
        box3Vrijstelling: { min: 0, max: null, step: 1000 }
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
        enableDarkMode: true,
        enableAdvancedTax: true
    },
    
    // Performance Settings
    performance: {
        debounceDelay: 300,
        throttleDelay: 100,
        maxChartDataPoints: 1000,
        enableWebWorkers: false
    },
    
    // Tax Information for UI
    taxInfo: {
        vpb: {
            name: 'Vennootschapsbelasting',
            description: 'Voor holdings en BV\'s - 25.8% over winst',
            features: ['Rente aftrekbaar', 'Winst na aftrek kosten', 'Geen belasting over herinvestering']
        },
        box1: {
            name: 'Box 1 - Inkomstenbelasting',
            description: 'Voor particulieren - progressief tarief over winst',
            features: ['Beperkt aftrekbare rente', 'Progressieve tarieven', 'Winst is direct belastbaar']
        },
        box3: {
            name: 'Box 3 - Vermogensbelasting',
            description: 'Forfaitair rendement - 31% over fictief rendement',
            features: ['Onafhankelijk van daadwerkelijk rendement', 'Gebaseerd op vermogen 1 januari', 'Heffingsvrije voet €57.000']
        }
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
Object.freeze(Config.taxInfo);