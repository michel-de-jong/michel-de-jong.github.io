/**
 * Global Configuration for ROI Calculator
 */
export const Config = {
    // Application metadata
    app: {
        name: 'ROI Calculator Pro',
        version: '2.0.0',
        author: 'Your Company',
        year: 2024
    },
    
    // Default calculation parameters
    defaults: {
        // Basic parameters
        startKapitaal: 100000,
        maandelijksInleg: 1000,
        jaarlijksRendement: 8,
        jaren: 10,
        
        // Tax parameters
        belastingType: 'vpb',
        vpbRate: 25.8,
        box3Vrijstelling: 57000,
        
        // Inflation
        inflatie: 2,
        
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
            smallBusinessRate: 0.19 // 19%
        },
        box3: {
            vrijstelling: {
                single: 57000,
                couple: 114000
            },
            brackets: [
                { limit: 71650, rate: 0.0036 }, // 0.36%
                { limit: 1020750, rate: 0.0151 }, // 1.51%
                { limit: Infinity, rate: 0.0152 } // 1.52%
            ],
            forfaitairRendement: 0.0636 // 6.36%
        },
        box1: {
            brackets: [
                { limit: 10656, rate: 0.0928 },
                { limit: 23317, rate: 0.3693 },
                { limit: 73031, rate: 0.3693 },
                { limit: Infinity, rate: 0.495 }
            ],
            arbeidskorting: {
                max: 5977,
                threshold: 10741,
                phaseoutRate: 0.06510
            }
        }
    },
    
    // Monte Carlo simulation settings
    monteCarlo: {
        defaultRuns: 1000,
        minRuns: 100,
        maxRuns: 10000,
        confidenceIntervals: [0.05, 0.25, 0.5, 0.75, 0.95],
        histogramBins: 20,
        
        // Risk levels for volatility
        riskProfiles: {
            conservative: {
                volatility: 10,
                label: 'Conservatief'
            },
            moderate: {
                volatility: 15,
                label: 'Gematigd'
            },
            aggressive: {
                volatility: 25,
                label: 'Agressief'
            },
            veryAggressive: {
                volatility: 35,
                label: 'Zeer Agressief'
            }
        }
    },
    
    // Scenario analysis
    scenarios: {
        bestCase: {
            factor: 1.5,
            label: 'Best Case',
            icon: '🚀'
        },
        baseCase: {
            factor: 1.0,
            label: 'Base Case',
            icon: '📊'
        },
        worstCase: {
            factor: 0.5,
            label: 'Worst Case',
            icon: '⚠️'
        }
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
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            }
        }
    },
    
    // Export configurations
    export: {
        pdf: {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        },
        excel: {
            creator: 'ROI Calculator Pro',
            defaultDateFormat: 'dd/mm/yyyy'
        },
        csv: {
            delimiter: ',',
            encoding: 'utf-8'
        }
    },
    
    // UI settings
    ui: {
        animations: true,
        animationDuration: 300,
        toastDuration: 3000,
        
        // Breakpoints for responsive design
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            wide: 1440
        },
        
        // Theme colors (CSS variables)
        theme: {
            primary: '#1e3c72',
            secondary: '#2a5298',
            accent: '#7e8ce0',
            background: '#f8f9fa',
            text: '#333333',
            border: '#dee2e6'
        }
    },
    
    // Performance settings
    performance: {
        debounceDelay: 300,
        maxDataPoints: 1000,
        chartUpdateThrottle: 100,
        
        // LocalStorage settings
        storage: {
            prefix: 'roi_calculator_',
            maxScenarios: 50,
            maxPortfolios: 20,
            compressionEnabled: true
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