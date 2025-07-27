/**
 * Global Configuration for ROI Calculator
 */
export const Config = {
    // Application metadata
    app: {
        name: 'ROI Calculator Pro',
        version: '2.0.0',
        author: 'Michel de Jong',
        year: 2025
    },
    
    // Default calculation parameters - ALL values needed by the calculator
    defaults: {
        // Basic parameters
        startKapitaal: 100000,
        maandelijksInleg: 1000,
        jaarlijksRendement: 8,
        jaren: 10,
        
        // Extended parameters used in calculator
        lening: 50000,
        renteLening: 10,
        looptijd: 10,
        leningLooptijd: 10,
        rendementType: 'vast',
        rendement: 3,
        aflossingsType: 'lineair',
        herinvestering: 70,
        herinvesteringDrempel: 1000,
        vasteKosten: 2500,
        
        // Tax parameters
        belastingType: 'vpb',
        vpbRate: 25.8,
        priveSubType: 'box3',  // Default sub-type for private tax
        box1Tarief: 49.5,
        box3Rendement: 6.17,
        box3Tarief: 36,
        box3Vrijstelling: 57000,
        
        // Inflation
        inflatie: 2,
        inflatieToggle: false,
        
        // Leverage
        useLeverage: false,
        leveragePercentage: 50,
        rentePercentage: 4,
        
        // Risk management
        cashReserve: 10,
        maxLeverage: 70,
        
        // Monte Carlo
        monteCarloRuns: 1000,
        volatility: 15,
        mcVolatility: 3,  // Default Monte Carlo volatility
        
        // Currency
        baseCurrency: 'EUR'
    },
    
    // Tax configuration (2024 rates)
    tax: {
        // VPB (Vennootschapsbelasting) constants
        VPB_RATE: 0.258, // 25.8%
        VPB_LOW_RATE: 0.19, // 19%
        VPB_LOW_THRESHOLD: 395000, // 2024 threshold
        
        // Box 1 constants
        BOX1_BRACKETS: [
            { min: 0, max: 73031, rate: 0.3697 },
            { min: 73031, max: Infinity, rate: 0.495 }
        ],
        DEFAULT_BOX1_RATE: 0.495, // 49.5%
        
        // Box 3 constants
        BOX3_RENDEMENT_BRACKETS: [
            { min: 0, max: 71650, rate: 0.0036 }, // 0.36%
            { min: 71650, max: 1020750, rate: 0.0151 }, // 1.51%
            { min: 1020750, max: Infinity, rate: 0.0152 } // 1.52%
        ],
        BOX3_BELASTING_TARIEF: 0.36, // 36%
        DEFAULT_BOX3_RENDEMENT: 0.0604, // 6.04%
        
        // Legacy/alternative names for compatibility
        vpb: {
            rate: 0.258, // 25.8%
            smallBusinessThreshold: 395000,
            smallBusinessRate: 0.19
        },
        box1: {
            brackets: [
                { min: 0, max: 73031, rate: 0.3697 },
                { min: 73031, max: Infinity, rate: 0.495 }
            ],
            defaultRate: 0.495
        },
        box3: {
            rendementBrackets: [
                { min: 0, max: 71650, rate: 0.0036 },
                { min: 71650, max: 1020750, rate: 0.0151 },
                { min: 1020750, max: Infinity, rate: 0.0152 }
            ],
            belastingTarief: 0.36,
            defaultRendement: 0.0604
        }
    },
    
    // UI configuration
    ui: {
        animations: true,
        animationDuration: 300,
        numberFormat: 'nl-NL',
        currency: 'EUR',
        dateFormat: 'dd-MM-yyyy'
    },
    
    // Currency settings
    currency: {
        base: 'EUR',
        supported: ['EUR', 'USD', 'GBP', 'CHF', 'JPY'],
        display: {
            EUR: { symbol: '€', position: 'before' },
            USD: { symbol: '$', position: 'before' },
            GBP: { symbol: '£', position: 'before' },
            CHF: { symbol: 'CHF', position: 'after' },
            JPY: { symbol: '¥', position: 'before' }
        },
        
        // Exchange rate sources (for display only - not functional in offline version)
        exchangeRateAPI: null,
        
        // Risk profiles for currency exposure
        riskProfiles: {
            conservative: {
                maxCurrencyExposure: 10, // % of portfolio
                maxVolatility: 10, // annual %
                recommendedHedgeRatio: 0.8
            },
            moderate: {
                maxCurrencyExposure: 20,
                maxVolatility: 15,
                recommendedHedgeRatio: 0.6
            },
            aggressive: {
                maxCurrencyExposure: 30,
                maxVolatility: 20,
                recommendedHedgeRatio: 0.4
            }
        }
    },
    
    // Chart configurations
    charts: {
        colors: {
            primary: '#1e3c72',
            secondary: '#2a5298',
            accent: '#7e8ce0',
            positive: '#48d1cc',
            negative: '#e74c3c',
            warning: '#f39c12',
            danger: '#e74c3c',
            success: '#2ecc71',
            info: '#3498db',
            purple: '#9b59b6',
            orange: '#f39c12',
            
            // Currency specific colors
            currencyPalette: [
                '#1e3c72', '#2a5298', '#7e8ce0', '#36b3d1', 
                '#48d1cc', '#f39c12', '#e74c3c', '#9b59b6', 
                '#2ecc71', '#34495e'
            ]
        },
        
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    },
    
    // Validation rules
    validation: {
        amounts: {
            min: 0,
            max: 1000000000 // 1 billion
        },
        percentages: {
            min: -100,
            max: 100
        },
        years: {
            min: 1,
            max: 50
        },
        leverage: {
            min: 0,
            max: 90 // 90% max leverage
        },
        name: {
            minLength: 1,
            maxLength: 100
        }
    },
    
    // Feature flags
    features: {
        advancedTax: true,
        currencySupport: true,
        monteCarlo: true,
        scenarios: true,
        portfolio: true,
        export: true,
        historicalData: true,
        waterfall: true,
        darkMode: false // Future feature
    },
    
    // API endpoints (for future use)
    api: {
        baseURL: null,
        endpoints: {
            marketData: '/api/market-data',
            exchangeRates: '/api/exchange-rates',
            benchmarks: '/api/benchmarks'
        }
    },
    
    // Help and documentation
    help: {
        tooltips: true,
        onboarding: true,
        links: {
            documentation: '/docs',
            support: '/support',
            feedback: '/feedback'
        }
    },
    
    // Error messages
    errors: {
        validation: {
            required: 'Dit veld is verplicht',
            number: 'Voer een geldig getal in',
            positive: 'Waarde moet positief zijn',
            percentage: 'Voer een percentage tussen -100 en 100 in',
            maxValue: 'Waarde is te hoog',
            minValue: 'Waarde is te laag'
        },
        calculation: {
            general: 'Er is een fout opgetreden bij de berekening',
            leverage: 'Leverage percentage is te hoog',
            monteCarlo: 'Monte Carlo simulatie mislukt'
        },
        storage: {
            save: 'Kon data niet opslaan',
            load: 'Kon data niet laden',
            quota: 'Opslaglimiet bereikt'
        }
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(Config);