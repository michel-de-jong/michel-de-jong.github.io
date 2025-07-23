// KPI Display Module
import { formatNumber } from '../utils/format-utils.js';

export class KPIDisplay {
    constructor() {
        this.kpiElements = {
            totaalVermogen: document.getElementById('kpiTotaalVermogen'),
            totaalVermogenReeel: document.getElementById('kpiTotaalVermogenReeel'),
            roi: document.getElementById('kpiROI'),
            roiReeel: document.getElementById('kpiROIReeel'),
            leverage: document.getElementById('kpiLeverage'),
            cashReserve: document.getElementById('kpiCashReserve'),
            cashReserveReeel: document.getElementById('kpiCashReserveReeel'),
            koopkracht: document.getElementById('kpiKoopkracht')
        };
    }
    
    initialize() {
        // Verify all KPI elements are found
        const missingElements = Object.entries(this.kpiElements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.warn('Missing KPI elements:', missingElements);
        }
        
        // Set initial state
        this.setLoading(false);
    }

    update(results, showRealValues = false) {
        // Update nominal values
        if (this.kpiElements.totaalVermogen) {
            this.kpiElements.totaalVermogen.textContent = formatNumber(results.finalVermogen);
        }
        
        if (this.kpiElements.roi) {
            this.kpiElements.roi.textContent = results.finalROI.toFixed(1) + '%';
        }
        
        if (this.kpiElements.leverage) {
            this.kpiElements.leverage.textContent = results.leverageFactor.toFixed(1) + 'x';
        }
        
        if (this.kpiElements.cashReserve) {
            this.kpiElements.cashReserve.textContent = formatNumber(results.finalCashReserve);
        }
        
        if (this.kpiElements.koopkracht) {
            this.kpiElements.koopkracht.textContent = formatNumber(results.koopkrachtVerlies);
        }
        
        // Update real values (subtitles)
        if (showRealValues) {
            this.showRealValues(results);
        } else {
            this.hideRealValues();
        }
    }
    
    showRealValues(results) {
        if (this.kpiElements.totaalVermogenReeel) {
            this.kpiElements.totaalVermogenReeel.textContent = 
                `Reëel: ${formatNumber(results.finalVermogenReeel)}`;
        }
        
        if (this.kpiElements.roiReeel) {
            this.kpiElements.roiReeel.textContent = 
                `Reëel: ${results.finalROIReeel.toFixed(1)}%`;
        }
        
        if (this.kpiElements.cashReserveReeel) {
            this.kpiElements.cashReserveReeel.textContent = 
                `Reëel: ${formatNumber(results.finalCashReserveReeel)}`;
        }
    }
    
    hideRealValues() {
        if (this.kpiElements.totaalVermogenReeel) {
            this.kpiElements.totaalVermogenReeel.textContent = '';
        }
        
        if (this.kpiElements.roiReeel) {
            this.kpiElements.roiReeel.textContent = '';
        }
        
        if (this.kpiElements.cashReserveReeel) {
            this.kpiElements.cashReserveReeel.textContent = '';
        }
    }
    
    setLoading(isLoading) {
        Object.values(this.kpiElements).forEach(element => {
            if (element) {
                element.classList.toggle('loading', isLoading);
                if (isLoading) {
                    element.textContent = '...';
                }
            }
        });
    }
}
