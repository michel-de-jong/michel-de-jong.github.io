// Currency Service - Handles exchange rates and currency conversions
export class CurrencyService {
    constructor() {
        // Available currencies for the application
        this.supportedCurrencies = [
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
            { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
            { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
            { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
            { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
            { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
            { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
            { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
        ];
        
        // API configurations for exchange rates
        this.apiConfigs = {
            ecb: {
                baseUrl: 'https://api.exchangerate-api.com/v4/latest/',
                fallbackUrl: 'https://api.frankfurter.app/latest'
            },
            cache: {
                duration: 3600000, // 1 hour in milliseconds
                key: 'roi_calculator_fx_rates'
            }
        };
        
        // Exchange rate cache
        this.ratesCache = new Map();
        this.lastFetchTime = null;
        
        // Base currency (default EUR for European users)
        this.baseCurrency = 'EUR';
        
        // Historical rates for backtesting
        this.historicalRates = new Map();
    }
    
    /**
     * Initialize currency service with saved preferences
     */
    async initialize() {
        // Load saved base currency preference
        const savedBaseCurrency = localStorage.getItem('roi_calculator_base_currency');
        if (savedBaseCurrency && this.isSupported(savedBaseCurrency)) {
            this.baseCurrency = savedBaseCurrency;
        }
        
        // Load cached rates
        this.loadCachedRates();
        
        // Fetch fresh rates if cache is stale
        if (this.isCacheStale()) {
            await this.fetchLatestRates();
        }
    }
    
    /**
     * Get list of supported currencies
     */
    getSupportedCurrencies() {
        return [...this.supportedCurrencies];
    }
    
    /**
     * Check if currency is supported
     */
    isSupported(currencyCode) {
        return this.supportedCurrencies.some(c => c.code === currencyCode);
    }
    
    /**
     * Get currency details
     */
    getCurrencyDetails(currencyCode) {
        return this.supportedCurrencies.find(c => c.code === currencyCode);
    }
    
    /**
     * Set base currency
     */
    setBaseCurrency(currencyCode) {
        if (!this.isSupported(currencyCode)) {
            throw new Error(`Currency ${currencyCode} is not supported`);
        }
        
        this.baseCurrency = currencyCode;
        localStorage.setItem('roi_calculator_base_currency', currencyCode);
    }
    
    /**
     * Get current base currency
     */
    getBaseCurrency() {
        return this.baseCurrency;
    }
    
    /**
     * Fetch latest exchange rates
     */
    async fetchLatestRates(base = null) {
        const fetchBase = base || this.baseCurrency;
        
        try {
            // Try primary API
            let response = await fetch(`${this.apiConfigs.ecb.baseUrl}${fetchBase}`);
            
            if (!response.ok) {
                // Fallback to secondary API
                response = await fetch(`${this.apiConfigs.ecb.fallbackUrl}?from=${fetchBase}`);
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            
            const data = await response.json();
            const rates = data.rates || {};
            
            // Store in cache
            this.ratesCache.set(fetchBase, {
                rates: rates,
                timestamp: Date.now(),
                date: data.date || new Date().toISOString().split('T')[0]
            });
            
            this.lastFetchTime = Date.now();
            this.saveCachedRates();
            
            return rates;
            
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            
            // Return cached rates if available
            const cached = this.ratesCache.get(fetchBase);
            if (cached) {
                return cached.rates;
            }
            
            // Return default rates as last resort
            return this.getDefaultRates(fetchBase);
        }
    }
    
    /**
     * Get exchange rate between two currencies
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        
        // Ensure we have rates for the base currency
        let rates = this.ratesCache.get(fromCurrency)?.rates;
        
        if (!rates || this.isCacheStale()) {
            rates = await this.fetchLatestRates(fromCurrency);
        }
        
        if (rates[toCurrency]) {
            return rates[toCurrency];
        }
        
        // If direct rate not available, calculate through EUR
        if (fromCurrency !== 'EUR' && toCurrency !== 'EUR') {
            const fromToEur = await this.getExchangeRate(fromCurrency, 'EUR');
            const eurToTarget = await this.getExchangeRate('EUR', toCurrency);
            return fromToEur * eurToTarget;
        }
        
        throw new Error(`Cannot find exchange rate from ${fromCurrency} to ${toCurrency}`);
    }
    
    /**
     * Convert amount between currencies
     */
    async convert(amount, fromCurrency, toCurrency) {
        const rate = await this.getExchangeRate(fromCurrency, toCurrency);
        return amount * rate;
    }
    
    /**
     * Get historical exchange rates for a date range
     */
    async getHistoricalRates(fromCurrency, toCurrency, startDate, endDate) {
        const cacheKey = `${fromCurrency}_${toCurrency}_${startDate}_${endDate}`;
        
        // Check cache first
        if (this.historicalRates.has(cacheKey)) {
            return this.historicalRates.get(cacheKey);
        }
        
        try {
            // Fetch from frankfurter.app which provides historical data
            const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=${fromCurrency}&to=${toCurrency}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch historical rates');
            }
            
            const data = await response.json();
            const rates = [];
            
            // Process the rates object
            for (const [date, rateData] of Object.entries(data.rates)) {
                rates.push({
                    date: date,
                    rate: rateData[toCurrency],
                    from: fromCurrency,
                    to: toCurrency
                });
            }
            
            // Cache the results
            this.historicalRates.set(cacheKey, rates);
            
            return rates;
            
        } catch (error) {
            console.error('Error fetching historical rates:', error);
            
            // Generate sample historical data for demonstration
            return this.generateSampleHistoricalRates(
                fromCurrency, 
                toCurrency, 
                startDate, 
                endDate
            );
        }
    }
    
    /**
     * Calculate currency volatility
     */
    calculateVolatility(historicalRates) {
        if (historicalRates.length < 2) {
            return 0;
        }
        
        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < historicalRates.length; i++) {
            const dailyReturn = (historicalRates[i].rate - historicalRates[i-1].rate) / 
                               historicalRates[i-1].rate;
            returns.push(dailyReturn);
        }
        
        // Calculate mean return
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        
        // Calculate variance
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / 
                        (returns.length - 1);
        
        // Return annualized volatility (assuming 252 trading days)
        return Math.sqrt(variance * 252) * 100; // Return as percentage
    }
    
    /**
     * Calculate Value at Risk (VaR) for currency exposure
     */
    calculateVaR(exposure, volatility, confidenceLevel = 0.95, timeHorizon = 1) {
        // Z-scores for common confidence levels
        const zScores = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        
        const zScore = zScores[confidenceLevel] || 1.96;
        
        // VaR = exposure * volatility * z-score * sqrt(time)
        const dailyVolatility = volatility / Math.sqrt(252);
        const var95 = exposure * (dailyVolatility / 100) * zScore * Math.sqrt(timeHorizon);
        
        return var95;
    }
    
    /**
     * Calculate currency correlation matrix
     */
    async calculateCorrelationMatrix(currencies, startDate, endDate) {
        const matrix = {};
        
        for (const currency1 of currencies) {
            matrix[currency1] = {};
            
            for (const currency2 of currencies) {
                if (currency1 === currency2) {
                    matrix[currency1][currency2] = 1.0;
                } else {
                    const correlation = await this.calculatePairCorrelation(
                        currency1, 
                        currency2, 
                        startDate, 
                        endDate
                    );
                    matrix[currency1][currency2] = correlation;
                }
            }
        }
        
        return matrix;
    }
    
    /**
     * Calculate correlation between two currency pairs
     */
    async calculatePairCorrelation(currency1, currency2, startDate, endDate) {
        try {
            const rates1 = await this.getHistoricalRates('EUR', currency1, startDate, endDate);
            const rates2 = await this.getHistoricalRates('EUR', currency2, startDate, endDate);
            
            // Align the data by date
            const alignedData = this.alignTimeSeriesData(rates1, rates2);
            
            if (alignedData.length < 2) {
                return 0;
            }
            
            // Calculate returns
            const returns1 = this.calculateReturns(alignedData.map(d => d.rate1));
            const returns2 = this.calculateReturns(alignedData.map(d => d.rate2));
            
            // Calculate correlation
            return this.calculateCorrelation(returns1, returns2);
            
        } catch (error) {
            console.error('Error calculating pair correlation:', error);
            return 0;
        }
    }
    
    /**
     * Helper functions
     */
    
    isCacheStale() {
        if (!this.lastFetchTime) return true;
        
        const now = Date.now();
        const cacheAge = now - this.lastFetchTime;
        
        return cacheAge > this.apiConfigs.cache.duration;
    }
    
    loadCachedRates() {
        const cached = localStorage.getItem(this.apiConfigs.cache.key);
        if (!cached) return;
        
        try {
            const data = JSON.parse(cached);
            this.ratesCache = new Map(data.rates);
            this.lastFetchTime = data.lastFetchTime;
        } catch (error) {
            console.error('Error loading cached rates:', error);
        }
    }
    
    saveCachedRates() {
        const data = {
            rates: Array.from(this.ratesCache.entries()),
            lastFetchTime: this.lastFetchTime
        };
        
        localStorage.setItem(this.apiConfigs.cache.key, JSON.stringify(data));
    }
    
    getDefaultRates(base) {
        // Default rates for offline functionality (approximate as of 2024)
        const defaultRates = {
            EUR: { USD: 1.08, GBP: 0.86, JPY: 162, CHF: 0.96 },
            USD: { EUR: 0.93, GBP: 0.80, JPY: 150, CHF: 0.89 },
            GBP: { EUR: 1.16, USD: 1.25, JPY: 188, CHF: 1.12 },
            JPY: { EUR: 0.0062, USD: 0.0067, GBP: 0.0053, CHF: 0.0059 },
            CHF: { EUR: 1.04, USD: 1.12, GBP: 0.89, JPY: 169 }
        };
        
        return defaultRates[base] || {};
    }
    
    generateSampleHistoricalRates(fromCurrency, toCurrency, startDate, endDate) {
        const rates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Starting rate (approximate)
        let baseRate = 1.0;
        try {
            const currentRates = this.getDefaultRates(fromCurrency);
            baseRate = currentRates[toCurrency] || 1.0;
        } catch (e) {
            baseRate = 1.0;
        }
        
        let currentRate = baseRate;
        const volatility = 0.01; // 1% daily volatility
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            
            // Random walk
            const change = (Math.random() - 0.5) * volatility * 2;
            currentRate = currentRate * (1 + change);
            
            rates.push({
                date: d.toISOString().split('T')[0],
                rate: currentRate,
                from: fromCurrency,
                to: toCurrency
            });
        }
        
        return rates;
    }
    
    alignTimeSeriesData(series1, series2) {
        const aligned = [];
        const map2 = new Map(series2.map(item => [item.date, item]));
        
        for (const item1 of series1) {
            const item2 = map2.get(item1.date);
            if (item2) {
                aligned.push({
                    date: item1.date,
                    rate1: item1.rate,
                    rate2: item2.rate
                });
            }
        }
        
        return aligned;
    }
    
    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        return returns;
    }
    
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            numerator += dx * dy;
            denomX += dx * dx;
            denomY += dy * dy;
        }
        
        if (denomX === 0 || denomY === 0) return 0;
        
        return numerator / Math.sqrt(denomX * denomY);
    }
}