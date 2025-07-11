// Calculation Utilities
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function calculateAnnuity(principal, rate, months) {
    if (rate === 0) return principal / months;
    const r = rate / 12 / 100;
    return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function calculateLinearPayment(principal, rate, months, currentMonth) {
    const monthlyPrincipal = principal / months;
    const remainingPrincipal = principal - (monthlyPrincipal * currentMonth);
    const monthlyInterest = remainingPrincipal * (rate / 100 / 12);
    return monthlyPrincipal + monthlyInterest;
}

export function randomNormal() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const statistics = {
    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    
    percentile(arr, p) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    },
    
    standardDeviation(arr) {
        const avg = this.mean(arr);
        const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(this.mean(squareDiffs));
    }
};
