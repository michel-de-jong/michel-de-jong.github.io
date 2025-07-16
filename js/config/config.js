// Configuration file for ROI Calculator with Currency Support

export const Config = {
    // Application metadata
    app: {
        name: 'ROI Calculator Pro',
        version: '2.0.0',
        author: 'Financial Tools BV',
        language: 'nl-NL',
        features: {
            currency: true,
            fxRisk: true,
            hedging: true
        }
    },
    
    // Default input values
    defaults: {
        // Basic inputs
        startKapitaal: 100000,
        lening: 0,
        renteLening: 5,
        looptijd: 10,
        rendement: 8,
        rendementsType: 'maandelijks',
        vasteKosten: 1000,
        
        // Tax settings
        belastingType: 'zakelijk',
        vpbTarief: 25.8,  // 2024 VPB rate
        priveSubType: 'box3',
        box1Tarief: 49.5,
        box3Tarief: 36,
        box3Rendement: 6.04,
        
        // Advanced settings
        inflatiePercentage: 2.5,
        inflatieToggle: false,
        herinvesterenToggle: true,
        
        // Monte Carlo settings
        mcIterations: 10000,
        mcVolatility: 3,
        mcConfidenceLevel: 95,
        
        // Currency settings
        baseCurrency: 'EUR',
        enableCurrencyConversion: true,
        autoFetchRates: true,
        riskTolerance: 'moderate'
    },
    
    // Tax configurations
    tax: {
        vpb: {
            rate: 25.8,
            description: 'Vennootschapsbelasting 2024'
        },
        box1: {
            brackets: [
                { limit: 73031, rate: 36.97 },
                { limit: Infinity, rate: 49.5 }
            ],
            description: 'Inkomstenbelasting Box 1 2024'
        },
        box3: {
            rate: 36,
            assumedReturn: 6.04,
            exemption: 57000, // Per person 2024
            description: 'Vermogensbelasting Box 3 2024'
        }
    },
    
    // Currency configurations
    currency: {
        // Default supported currencies
        defaultCurrencies: ['EUR', 'USD', 'GBP', 'JPY', 'CHF'],
        
        // Exchange rate API settings
        exchangeRateAPIs: {
            primary: {
                name: 'ExchangeRate-API',
                endpoint: 'https://api.exchangerate-api.com/v4/latest/',
                rateLimit: 1500, // requests per month (free tier)
                requiresAuth: false
            },
            secondary: {
                name: 'Frankfurter',
                endpoint: 'https://api.frankfurter.app/',
                rateLimit: null, // No rate limit
                requiresAuth: false
            }
        },
        
        // FX Risk parameters
        fxRisk: {
            defaultVolatilityWindow: 30, // days
            defaultConfidenceLevels: [0.90, 0.95, 0.99],
            defaultTimeHorizons: [1, 7, 30, 90, 365], // days
            correlationWindow: 90 // days
        },
        
        // Hedging configurations
        hedging: {
            instruments: {
                forward: {
                    typicalCost: 0.01, // 1% of notional
                    coverage: 1.0
                },
                option: {
                    typicalCost: 0.03, // 3% of notional (varies with volatility)
                    coverage: 0.9
                },
                swap: {
                    typicalCost: 0.005, // 0.5% of notional
                    coverage: 1.0
                },
                natural: {
                    typicalCost: 0.02, // 2% opportunity cost
                    coverage: 0.7
                }
            },
            
            // Risk tolerance thresholds
            riskToleranceThresholds: {
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
            compress: true,
            
            // PDF metadata
            properties: {
                title: 'ROI Calculator Report',
                subject: 'Investment Analysis with Currency Risk',
                author: 'ROI Calculator Pro',
                keywords: 'investment, ROI, currency, risk analysis',
                creator: 'ROI Calculator Pro v2.0'
            }
        },
        
        excel: {
            defaultFilename: 'roi_analysis_{date}.xlsx',
            includeCharts: true,
            includeCurrencyAnalysis: true
        }
    },
    
    // Monte Carlo simulation settings
    monteCarlo: {
        iterations: {
            min: 1000,
            max: 100000,
            default: 10000,
            step: 1000
        },
        
        volatility: {
            min: 1,
            max: 50,
            default: 15,
            step: 1
        },
        
        // Currency volatility adjustments
        currencyVolatilityMultiplier: 1.2, // Currency adds 20% more volatility
        
        confidenceLevels: [90, 95, 99]
    },
    
    // Historical data settings
    historical: {
        sources: {
            stocks: ['Alpha Vantage', 'Yahoo Finance'],
            forex: ['ECB', 'Frankfurter', 'ExchangeRate-API'],
            rates: ['ECB', 'FRED'],
            inflation: ['CBS', 'Eurostat']
        },
        
        defaultPeriod: 365, // days
        maxPeriod: 3650, // 10 years
        
        cacheDuration: 3600000 // 1 hour
    },
    
    // UI Settings
    ui: {
        animations: true,
        tooltips: true,
        
        // Number formatting
        numberFormat: {
            currency: {
                style: 'currency',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            percentage: {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            number: {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        },
        
        // Loading states
        loadingMessages: {
            fetchingRates: 'Fetching exchange rates...',
            analyzingRisk: 'Analyzing FX risk...',
            calculatingHedge: 'Calculating optimal hedge...',
            runningStressTest: 'Running stress test scenarios...'
        }
    },
    
    // Validation rules
    validation: {
        amounts: {
            min: 0,
            max: 1e12 // 1 trillion
        },
        
        percentages: {
            min: -100,
            max: 1000
        },
        
        periods: {
            min: 1,
            max: 100
        },
        
        // Currency specific validations
        currency: {
            minExposure: 100, // Minimum amount for FX analysis
            maxCurrencies: 20 // Maximum currencies in portfolio
        }
    },
    
    // Feature flags
    features: {
        currencyConversion: true,
        fxRiskAnalysis: true,
        hedgingStrategies: true,
        stressTesting: true,
        correlationAnalysis: true,
        historicalBacktesting: true,
        
        // Experimental features
        experimental: {
            aiRecommendations: false,
            optionsValuation: false,
            realTimeAlerts: false
        }
    },
    
    // API keys (should be stored securely in production)
    apiKeys: {
        alphaVantage: process.env.ALPHA_VANTAGE_KEY || 'demo',
        exchangeRateAPI: process.env.EXCHANGE_RATE_API_KEY || null
    }
};