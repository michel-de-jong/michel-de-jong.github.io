// Historical Data Service - Handles fetching data from various APIs
export class HistoricalDataService {
    constructor() {
        // API configurations
        this.apiConfigs = {
            yahoofinance: {
                // Note: Yahoo Finance API requires proxy or server-side implementation
                // This is a placeholder for demonstration
                baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart/',
                cors: true,
                rateLimit: 2000
            },
            alphavantage: {
                baseUrl: 'https://www.alphavantage.co/query',
                apiKey: 'demo', // User should provide their own API key
                rateLimit: 500
            },
            ecb: {
                // European Central Bank Statistical Data Warehouse
                baseUrl: 'https://sdw-wsrest.ecb.europa.eu/service/data',
                rateLimit: 1000
            },
            cbs: {
                // CBS Open Data StatLine - Dutch statistics
                baseUrl: 'https://opendata.cbs.nl/ODataApi/odata/83131NED',
                rateLimit: 1000
            }
        };
        
        // Cache to avoid repeated API calls
        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }
    
    /**
     * Fetch data from specified source
     * @param {string} source - Data source identifier
     * @param {object} params - Request parameters
     * @returns {Promise<array>} Processed data array
     */
    async fetchData(source, params) {
        // Check cache first
        const cacheKey = this.getCacheKey(source, params);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        let data;
        
        switch(source) {
            case 'yahoofinance':
                data = await this.fetchYahooFinance(params);
                break;
                
            case 'alphavantage':
                data = await this.fetchAlphaVantage(params);
                break;
                
            case 'ecb':
                data = await this.fetchECBData(params);
                break;
                
            case 'cbs':
                data = await this.fetchCBSData(params);
                break;
                
            default:
                throw new Error(`Unknown data source: ${source}`);
        }
        
        // Cache the results
        this.setCache(cacheKey, data);
        
        return data;
    }
    
    /**
     * Fetch data from Yahoo Finance
     * Note: This requires a proxy server due to CORS restrictions
     */
    async fetchYahooFinance(params) {
        const { symbol, startDate, endDate } = params;
        
        // Convert dates to timestamps
        const period1 = Math.floor(new Date(startDate).getTime() / 1000);
        const period2 = Math.floor(new Date(endDate).getTime() / 1000);
        
        // Note: Direct API calls to Yahoo Finance are blocked by CORS
        // In production, you would need a proxy server or use a different service
        
        // For demonstration, we'll return sample data
        console.warn('Yahoo Finance API requires server-side implementation due to CORS.');
        
        // Generate sample data for demonstration
        return this.generateSampleStockData(symbol, startDate, endDate);
    }
    
    /**
     * Fetch data from Alpha Vantage
     */
    async fetchAlphaVantage(params) {
        const { symbol, startDate, endDate } = params;
        const config = this.apiConfigs.alphavantage;
        
        // Check if user has set their API key
        const apiKey = this.getAlphaVantageAPIKey();
        if (!apiKey || apiKey === 'demo') {
            console.warn('Please set your Alpha Vantage API key for real data.');
            return this.generateSampleStockData(symbol, startDate, endDate);
        }
        
        try {
            const url = `${config.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Alpha Vantage API error: ${response.status}`);
            }
            
            const json = await response.json();
            
            if (json['Error Message']) {
                throw new Error(json['Error Message']);
            }
            
            if (json['Note']) {
                throw new Error('API call frequency limit reached. Please try again later.');
            }
            
            // Process the data
            const timeSeries = json['Time Series (Daily)'];
            if (!timeSeries) {
                throw new Error('No data returned from Alpha Vantage');
            }
            
            const data = [];
            for (const [date, values] of Object.entries(timeSeries)) {
                const dataDate = new Date(date);
                if (dataDate >= new Date(startDate) && dataDate <= new Date(endDate)) {
                    data.push({
                        date: date,
                        open: parseFloat(values['1. open']),
                        high: parseFloat(values['2. high']),
                        low: parseFloat(values['3. low']),
                        close: parseFloat(values['4. close']),
                        volume: parseInt(values['5. volume']),
                        symbol: symbol
                    });
                }
            }
            
            // Sort by date ascending
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Add return calculations
            for (let i = 1; i < data.length; i++) {
                data[i].return = ((data[i].close - data[i-1].close) / data[i-1].close) * 100;
            }
            
            return data;
            
        } catch (error) {
            console.error('Alpha Vantage API error:', error);
            throw error;
        }
    }
    
    /**
     * Fetch interest rate data from ECB
     */
    async fetchECBData(params) {
        const { startDate, endDate } = params;
        
        try {
            // ECB key interest rates
            // FM.D.U2.EUR.4F.KR.MRR_FR.LEV
            const series = 'FM/D.U2.EUR.4F.KR.MRR_FR.LEV';
            const url = `${this.apiConfigs.ecb.baseUrl}/${series}?startPeriod=${startDate}&endPeriod=${endDate}&format=json`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`ECB API error: ${response.status}`);
            }
            
            const json = await response.json();
            
            // Process ECB data structure
            const observations = json.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations || {};
            const timePeriods = json.structure?.dimensions?.observation?.[0]?.values || [];
            
            const data = [];
            for (const [index, observation] of Object.entries(observations)) {
                const period = timePeriods[parseInt(index)];
                if (period) {
                    data.push({
                        date: period.id,
                        rate: observation[0],
                        description: 'ECB Main Refinancing Rate'
                    });
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('ECB API error:', error);
            // Return sample data for demonstration
            return this.generateSampleInterestRateData(startDate, endDate);
        }
    }
    
    /**
     * Fetch inflation data from CBS (Dutch statistics)
     */
    async fetchCBSData(params) {
        const { startDate, endDate } = params;
        
        try {
            // CBS API for CPI data
            // Table 83131NED - Consumer prices
            const url = `${this.apiConfigs.cbs.baseUrl}/Observations?$filter=Perioden ge '${startDate.substring(0, 4)}' and Perioden le '${endDate.substring(0, 4)}'&$select=Perioden,CPI_1`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`CBS API error: ${response.status}`);
            }
            
            const json = await response.json();
            const observations = json.value || [];
            
            const data = observations.map(obs => ({
                date: obs.Perioden,
                inflation: obs.CPI_1,
                description: 'Dutch CPI'
            }));
            
            return data;
            
        } catch (error) {
            console.error('CBS API error:', error);
            // Return sample data for demonstration
            return this.generateSampleInflationData(startDate, endDate);
        }
    }
    
    /**
     * Generate sample stock data for demonstration
     */
    generateSampleStockData(symbol, startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Starting price
        let price = 100;
        const volatility = 0.02; // 2% daily volatility
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            
            // Random walk
            const change = (Math.random() - 0.5) * volatility;
            price = price * (1 + change);
            
            data.push({
                date: d.toISOString().split('T')[0],
                open: price * (1 + (Math.random() - 0.5) * 0.01),
                high: price * (1 + Math.random() * 0.01),
                low: price * (1 - Math.random() * 0.01),
                close: price,
                volume: Math.floor(Math.random() * 1000000) + 500000,
                symbol: symbol,
                return: change * 100
            });
        }
        
        return data;
    }
    
    /**
     * Generate sample interest rate data
     */
    generateSampleInterestRateData(startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let rate = 2.5; // Starting at 2.5%
        
        // Monthly data
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
            // Small random changes
            rate += (Math.random() - 0.5) * 0.1;
            rate = Math.max(0, Math.min(5, rate)); // Keep between 0-5%
            
            data.push({
                date: d.toISOString().split('T')[0],
                rate: rate,
                description: 'Sample Interest Rate'
            });
        }
        
        return data;
    }
    
    /**
     * Generate sample inflation data
     */
    generateSampleInflationData(startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let inflation = 2.0; // Starting at 2%
        
        // Monthly data
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
            // Small random changes with upward bias
            inflation += (Math.random() - 0.4) * 0.2;
            inflation = Math.max(0, Math.min(10, inflation)); // Keep between 0-10%
            
            data.push({
                date: d.toISOString().split('T')[0],
                inflation: inflation,
                description: 'Sample Inflation Rate'
            });
        }
        
        return data;
    }
    
    /**
     * Get Alpha Vantage API key
     * In production, this should be stored securely
     */
    getAlphaVantageAPIKey() {
        // Check if user has set API key in localStorage
        const storedKey = localStorage.getItem('alphavantage_api_key');
        if (storedKey) return storedKey;
        
        // Prompt user to enter API key
        const apiKey = prompt('Voer uw Alpha Vantage API key in (gratis op alphavantage.co):');
        if (apiKey && apiKey !== 'demo') {
            localStorage.setItem('alphavantage_api_key', apiKey);
            return apiKey;
        }
        
        return 'demo';
    }
    
    /**
     * Cache management
     */
    getCacheKey(source, params) {
        return `${source}_${JSON.stringify(params)}`;
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Validate API response
     */
    validateResponse(response, source) {
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        // Add source-specific validation here
        return true;
    }
    
    /**
     * Format date for API requests
     */
    formatDateForAPI(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch(format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYYMMDD':
                return `${year}${month}${day}`;
            case 'YYYY-MM':
                return `${year}-${month}`;
            default:
                return date;
        }
    }
}
