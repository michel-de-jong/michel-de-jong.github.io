// Currency Formatting Utilities

/**
 * Format amount with currency symbol and proper formatting
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO currency code (EUR, USD, etc.)
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'EUR', options = {}) {
    const defaultOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    try {
        // Use Intl.NumberFormat for proper currency formatting
        const formatter = new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currencyCode,
            ...formatOptions
        });
        
        return formatter.format(amount);
    } catch (error) {
        // Fallback for unsupported currencies
        const symbol = getCurrencySymbol(currencyCode);
        const formattedAmount = formatNumber(amount, formatOptions);
        return `${symbol} ${formattedAmount}`;
    }
}

/**
 * Format currency amount without symbol
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO currency code
 * @returns {string} Formatted number string
 */
export function formatCurrencyAmount(amount, currencyCode = 'EUR') {
    try {
        const formatter = new Intl.NumberFormat('nl-NL', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        });
        
        return formatter.format(amount);
    } catch (error) {
        return formatNumber(amount);
    }
}

/**
 * Get currency symbol
 * @param {string} currencyCode - ISO currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode) {
    const symbols = {
        EUR: '€',
        USD: '$',
        GBP: '£',
        JPY: '¥',
        CHF: 'CHF',
        CNY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
        SGD: 'S$',
        HKD: 'HK$',
        NZD: 'NZ$',
        ZAR: 'R',
        BRL: 'R$',
        MXN: '$',
        INR: '₹',
        RUB: '₽',
        KRW: '₩'
    };
    
    return symbols[currencyCode] || currencyCode;
}

/**
 * Format exchange rate
 * @param {number} rate - Exchange rate
 * @param {string} fromCurrency - From currency code
 * @param {string} toCurrency - To currency code
 * @returns {string} Formatted exchange rate string
 */
export function formatExchangeRate(rate, fromCurrency, toCurrency) {
    const formattedRate = rate.toFixed(4);
    return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
}

/**
 * Format percentage with currency context
 * @param {number} value - Percentage value
 * @param {object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export function formatCurrencyPercentage(value, options = {}) {
    const defaultOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        showSign: false
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    const formatted = Math.abs(value).toFixed(formatOptions.maximumFractionDigits);
    
    if (formatOptions.showSign && value !== 0) {
        return value > 0 ? `+${formatted}%` : `-${formatted}%`;
    }
    
    return `${formatted}%`;
}

/**
 * Parse currency amount from string
 * @param {string} value - Currency string to parse
 * @returns {number} Parsed amount
 */
export function parseCurrencyAmount(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    // Remove currency symbols and spaces
    let cleaned = value.toString()
        .replace(/[€$£¥₹₽₩]/g, '')
        .replace(/\s/g, '')
        .replace(/CHF|C\$|A\$|kr|S\$|HK\$|NZ\$|R\$|R/g, '');
    
    // Handle different decimal separators
    if (cleaned.includes(',') && cleaned.includes('.')) {
        // Both separators present - assume comma is thousands separator
        cleaned = cleaned.replace(/,/g, '');
    } else if (cleaned.includes(',')) {
        // Only comma present - check if it's decimal separator
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            // Likely decimal separator
            cleaned = cleaned.replace(',', '.');
        } else {
            // Likely thousands separator
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    
    return parseFloat(cleaned) || 0;
}

/**
 * Format large currency amounts with abbreviations
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Abbreviated currency string
 */
export function formatLargeCurrency(amount, currencyCode = 'EUR') {
    const symbol = getCurrencySymbol(currencyCode);
    
    if (Math.abs(amount) >= 1e9) {
        return `${symbol} ${(amount / 1e9).toFixed(1)}B`;
    } else if (Math.abs(amount) >= 1e6) {
        return `${symbol} ${(amount / 1e6).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 1e3) {
        return `${symbol} ${(amount / 1e3).toFixed(1)}K`;
    }
    
    return formatCurrency(amount, currencyCode);
}

/**
 * Compare currency amounts with precision
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @param {number} precision - Decimal places for comparison
 * @returns {number} -1 if amount1 < amount2, 0 if equal, 1 if amount1 > amount2
 */
export function compareCurrencyAmounts(amount1, amount2, precision = 2) {
    const factor = Math.pow(10, precision);
    const rounded1 = Math.round(amount1 * factor) / factor;
    const rounded2 = Math.round(amount2 * factor) / factor;
    
    if (rounded1 < rounded2) return -1;
    if (rounded1 > rounded2) return 1;
    return 0;
}

/**
 * Validate currency code
 * @param {string} currencyCode - Currency code to validate
 * @returns {boolean} True if valid ISO currency code
 */
export function isValidCurrencyCode(currencyCode) {
    // Basic validation - 3 uppercase letters
    if (!/^[A-Z]{3}$/.test(currencyCode)) return false;
    
    // List of common valid currency codes
    const validCodes = [
        'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CNY', 'CAD', 'AUD',
        'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'NZD', 'ZAR', 'BRL',
        'MXN', 'INR', 'RUB', 'KRW', 'IDR', 'MYR', 'PHP', 'THB',
        'VND', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'ISK'
    ];
    
    return validCodes.includes(currencyCode);
}

/**
 * Format number helper (imported from format-utils)
 */
function formatNumber(value, options = {}) {
    const {
        minimumFractionDigits = 0,
        maximumFractionDigits = 0,
        useGrouping = true
    } = options;
    
    try {
        return new Intl.NumberFormat('nl-NL', {
            minimumFractionDigits,
            maximumFractionDigits,
            useGrouping
        }).format(value);
    } catch (error) {
        // Fallback formatting
        return value.toFixed(maximumFractionDigits)
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
}