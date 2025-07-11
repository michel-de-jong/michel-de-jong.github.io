// Format Utilities
export function formatNumber(num) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

export function formatPercentage(num) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(num / 100);
}

export function getCurrentDateString() {
    return new Date().toLocaleDateString('nl-NL');
}

export function getISODateString() {
    return new Date().toISOString().slice(0, 10);
}
