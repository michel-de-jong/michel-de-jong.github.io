// FX Risk Analysis Module - Advanced currency risk calculations and hedging strategies
export class FXRiskAnalysis {
    constructor(currencyService) {
        this.currencyService = currencyService;
        
        // Risk metrics configuration
        this.config = {
            confidenceLevels: [0.90, 0.95, 0.99],
            timeHorizons: [1, 7, 30, 90, 365], // days
            volatilityWindow: 30, // days for volatility calculation
            correlationWindow: 90, // days for correlation calculation
            stressTestScenarios: {
                mild: 0.05,      // 5% move
                moderate: 0.10,  // 10% move
                severe: 0.20,    // 20% move
                extreme: 0.30    // 30% move
            }
        };
        
        // Hedging instruments
        this.hedgingInstruments = {
            forward: {
                name: 'Forward Contract',
                description: 'Lock in exchange rate for future date',
                costBasis: 'spread'
            },
            option: {
                name: 'Currency Option',
                description: 'Right but not obligation to exchange',
                costBasis: 'premium'
            },
            swap: {
                name: 'Currency Swap',
                description: 'Exchange cash flows in different currencies',
                costBasis: 'spread'
            },
            natural: {
                name: 'Natural Hedge',
                description: 'Match revenues and costs in same currency',
                costBasis: 'opportunity'
            }
        };
    }
    
    /**
     * Analyze currency exposure for a portfolio
     */
    async analyzePortfolioExposure(portfolio, baseCurrency) {
        const exposures = new Map();
        const totalValueBase = await this.calculateTotalPortfolioValue(portfolio, baseCurrency);
        
        // Calculate exposure by currency
        for (const asset of portfolio) {
            const currency = asset.currency || baseCurrency;
            const valueInBase = await this.currencyService.convert(
                asset.value,
                currency,
                baseCurrency
            );
            
            if (exposures.has(currency)) {
                exposures.get(currency).value += valueInBase;
                exposures.get(currency).assets.push(asset);
            } else {
                exposures.set(currency, {
                    value: valueInBase,
                    assets: [asset],
                    percentage: 0
                });
            }
        }
        
        // Calculate percentages and risk metrics
        const exposureAnalysis = [];
        
        for (const [currency, exposure] of exposures) {
            exposure.percentage = (exposure.value / totalValueBase) * 100;
            
            if (currency !== baseCurrency) {
                // Get historical data for risk calculations
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                    .toISOString().split('T')[0];
                
                const historicalRates = await this.currencyService.getHistoricalRates(
                    currency,
                    baseCurrency,
                    startDate,
                    endDate
                );
                
                // Calculate risk metrics
                const volatility = this.currencyService.calculateVolatility(historicalRates);
                const var95 = this.currencyService.calculateVaR(
                    exposure.value,
                    volatility,
                    0.95,
                    30 // 30-day VaR
                );
                
                exposureAnalysis.push({
                    currency,
                    value: exposure.value,
                    percentage: exposure.percentage,
                    assets: exposure.assets,
                    riskMetrics: {
                        volatility,
                        var95,
                        var95Percentage: (var95 / exposure.value) * 100,
                        sharpeRatio: await this.calculateCurrencySharpe(
                            currency,
                            baseCurrency,
                            historicalRates
                        )
                    }
                });
            } else {
                exposureAnalysis.push({
                    currency,
                    value: exposure.value,
                    percentage: exposure.percentage,
                    assets: exposure.assets,
                    riskMetrics: {
                        volatility: 0,
                        var95: 0,
                        var95Percentage: 0,
                        sharpeRatio: 0
                    }
                });
            }
        }
        
        return {
            totalValue: totalValueBase,
            baseCurrency,
            exposures: exposureAnalysis,
            diversificationIndex: this.calculateDiversificationIndex(exposureAnalysis),
            aggregateRisk: await this.calculateAggregateRisk(exposureAnalysis, baseCurrency)
        };
    }
    
    /**
     * Calculate optimal hedging strategy
     */
    async calculateOptimalHedge(exposure, constraints = {}) {
        const {
            maxCost = Infinity,
            minCoverage = 0.5,
            preferredInstruments = ['forward', 'option'],
            timeHorizon = 90
        } = constraints;
        
        const hedgingStrategies = [];
        
        // Analyze each hedging instrument
        for (const [type, instrument] of Object.entries(this.hedgingInstruments)) {
            if (!preferredInstruments.includes(type)) continue;
            
            const strategy = await this.evaluateHedgingStrategy(
                exposure,
                type,
                timeHorizon
            );
            
            if (strategy.cost <= maxCost && strategy.coverage >= minCoverage) {
                hedgingStrategies.push(strategy);
            }
        }
        
        // Sort by efficiency (coverage per unit cost)
        hedgingStrategies.sort((a, b) => {
            const efficiencyA = a.coverage / a.cost;
            const efficiencyB = b.coverage / b.cost;
            return efficiencyB - efficiencyA;
        });
        
        // Return optimal strategy and alternatives
        return {
            optimal: hedgingStrategies[0] || null,
            alternatives: hedgingStrategies.slice(1, 4),
            analysis: {
                unhedgedRisk: exposure.riskMetrics.var95,
                recommendedCoverage: this.calculateRecommendedCoverage(exposure),
                costBenefitRatio: hedgingStrategies[0] 
                    ? hedgingStrategies[0].riskReduction / hedgingStrategies[0].cost 
                    : 0
            }
        };
    }
    
    /**
     * Perform stress testing on currency positions
     */
    async performStressTest(portfolio, baseCurrency, scenarios = null) {
        const testScenarios = scenarios || this.config.stressTestScenarios;
        const results = [];
        
        // Get current portfolio value
        const currentValue = await this.calculateTotalPortfolioValue(portfolio, baseCurrency);
        
        // Get unique currencies in portfolio
        const currencies = new Set(
            portfolio.map(asset => asset.currency || baseCurrency)
                .filter(c => c !== baseCurrency)
        );
        
        // Test each scenario
        for (const [scenarioName, magnitude] of Object.entries(testScenarios)) {
            // Test currency appreciations
            const appreciationResults = await this.testScenarioDirection(
                portfolio,
                baseCurrency,
                currencies,
                magnitude,
                1 // appreciation
            );
            
            // Test currency depreciations
            const depreciationResults = await this.testScenarioDirection(
                portfolio,
                baseCurrency,
                currencies,
                magnitude,
                -1 // depreciation
            );
            
            results.push({
                scenario: scenarioName,
                magnitude: magnitude * 100,
                appreciation: {
                    ...appreciationResults,
                    percentageChange: ((appreciationResults.value - currentValue) / currentValue) * 100
                },
                depreciation: {
                    ...depreciationResults,
                    percentageChange: ((depreciationResults.value - currentValue) / currentValue) * 100
                }
            });
        }
        
        return {
            currentValue,
            baseCurrency,
            scenarios: results,
            worstCase: this.findWorstCase(results, currentValue),
            bestCase: this.findBestCase(results, currentValue),
            recommendations: this.generateStressTestRecommendations(results, currentValue)
        };
    }
    
    /**
     * Calculate currency risk attribution
     */
    async calculateRiskAttribution(portfolio, baseCurrency, historicalPeriod = 90) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - historicalPeriod * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];
        
        // Group assets by currency
        const currencyGroups = this.groupAssetsByCurrency(portfolio);
        const totalValue = await this.calculateTotalPortfolioValue(portfolio, baseCurrency);
        
        // Calculate risk contribution for each currency
        const riskContributions = [];
        let totalRisk = 0;
        
        for (const [currency, assets] of currencyGroups) {
            if (currency === baseCurrency) {
                // Base currency has no FX risk
                riskContributions.push({
                    currency,
                    value: assets.reduce((sum, a) => sum + a.value, 0),
                    fxRiskContribution: 0,
                    percentageOfTotal: 0
                });
                continue;
            }
            
            // Get historical rates and calculate volatility
            const historicalRates = await this.currencyService.getHistoricalRates(
                currency,
                baseCurrency,
                startDate,
                endDate
            );
            
            const volatility = this.currencyService.calculateVolatility(historicalRates);
            const groupValue = await this.convertGroupValue(assets, currency, baseCurrency);
            const groupWeight = groupValue / totalValue;
            
            // Calculate marginal VaR contribution
            const marginalVaR = groupValue * (volatility / 100) * 1.96; // 95% confidence
            const riskContribution = marginalVaR * groupWeight;
            
            totalRisk += riskContribution;
            
            riskContributions.push({
                currency,
                value: groupValue,
                weight: groupWeight * 100,
                volatility,
                marginalVaR,
                fxRiskContribution: riskContribution,
                percentageOfTotal: 0 // Will calculate after
            });
        }
        
        // Calculate percentage contributions
        riskContributions.forEach(contrib => {
            if (totalRisk > 0) {
                contrib.percentageOfTotal = (contrib.fxRiskContribution / totalRisk) * 100;
            }
        });
        
        // Sort by risk contribution
        riskContributions.sort((a, b) => b.fxRiskContribution - a.fxRiskContribution);
        
        return {
            totalPortfolioValue: totalValue,
            totalFXRisk: totalRisk,
            riskContributions,
            concentrationRisk: this.calculateConcentrationRisk(riskContributions),
            diversificationBenefit: this.calculateDiversificationBenefit(
                riskContributions,
                baseCurrency
            )
        };
    }
    
    /**
     * Generate hedging recommendations
     */
    async generateHedgingRecommendations(exposureAnalysis, riskTolerance = 'moderate') {
        const recommendations = [];
        
        // Define risk tolerance thresholds
        const toleranceThresholds = {
            conservative: { maxExposure: 10, maxVolatility: 10 },
            moderate: { maxExposure: 20, maxVolatility: 15 },
            aggressive: { maxExposure: 30, maxVolatility: 20 }
        };
        
        const threshold = toleranceThresholds[riskTolerance];
        
        // Analyze each currency exposure
        for (const exposure of exposureAnalysis.exposures) {
            if (exposure.currency === exposureAnalysis.baseCurrency) continue;
            
            const needsHedging = exposure.percentage > threshold.maxExposure ||
                               exposure.riskMetrics.volatility > threshold.maxVolatility;
            
            if (needsHedging) {
                const hedgeAmount = this.calculateOptimalHedgeAmount(
                    exposure,
                    threshold
                );
                
                const instruments = this.recommendHedgingInstruments(
                    exposure,
                    hedgeAmount
                );
                
                recommendations.push({
                    currency: exposure.currency,
                    currentExposure: exposure.value,
                    exposurePercentage: exposure.percentage,
                    recommendedHedge: hedgeAmount,
                    hedgePercentage: (hedgeAmount / exposure.value) * 100,
                    reason: this.getHedgingReason(exposure, threshold),
                    instruments,
                    priority: this.calculateHedgingPriority(exposure, threshold),
                    estimatedCost: await this.estimateHedgingCost(
                        hedgeAmount,
                        exposure.currency,
                        exposureAnalysis.baseCurrency
                    )
                });
            }
        }
        
        // Sort by priority
        recommendations.sort((a, b) => b.priority - a.priority);
        
        return {
            riskTolerance,
            recommendations,
            totalHedgingCost: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
            riskReduction: this.estimateTotalRiskReduction(recommendations, exposureAnalysis)
        };
    }
    
    /**
     * Helper methods
     */
    
    async calculateTotalPortfolioValue(portfolio, baseCurrency) {
        let total = 0;
        
        for (const asset of portfolio) {
            const assetCurrency = asset.currency || baseCurrency;
            const valueInBase = await this.currencyService.convert(
                asset.value,
                assetCurrency,
                baseCurrency
            );
            total += valueInBase;
        }
        
        return total;
    }
    
    calculateDiversificationIndex(exposures) {
        // Herfindahl-Hirschman Index (HHI) for concentration
        const hhi = exposures.reduce((sum, exp) => {
            return sum + Math.pow(exp.percentage / 100, 2);
        }, 0);
        
        // Convert to diversification index (1 - HHI)
        // Ranges from 0 (fully concentrated) to ~1 (fully diversified)
        return 1 - hhi;
    }
    
    async calculateAggregateRisk(exposures, baseCurrency) {
        // Calculate portfolio-level VaR considering correlations
        const currencies = exposures
            .map(e => e.currency)
            .filter(c => c !== baseCurrency);
        
        if (currencies.length === 0) return 0;
        
        // Get correlation matrix
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];
        
        const correlationMatrix = await this.currencyService.calculateCorrelationMatrix(
            currencies,
            startDate,
            endDate
        );
        
        // Calculate portfolio variance
        let portfolioVariance = 0;
        
        for (let i = 0; i < exposures.length; i++) {
            for (let j = 0; j < exposures.length; j++) {
                if (exposures[i].currency === baseCurrency || 
                    exposures[j].currency === baseCurrency) continue;
                
                const weight_i = exposures[i].percentage / 100;
                const weight_j = exposures[j].percentage / 100;
                const vol_i = exposures[i].riskMetrics.volatility / 100;
                const vol_j = exposures[j].riskMetrics.volatility / 100;
                const correlation = correlationMatrix[exposures[i].currency]?.[exposures[j].currency] || 0;
                
                portfolioVariance += weight_i * weight_j * vol_i * vol_j * correlation;
            }
        }
        
        // Portfolio VaR at 95% confidence
        const portfolioVolatility = Math.sqrt(portfolioVariance);
        const totalValue = exposures.reduce((sum, e) => sum + e.value, 0);
        
        return totalValue * portfolioVolatility * 1.96;
    }
    
    async calculateCurrencySharpe(currency, baseCurrency, historicalRates) {
        // Calculate returns
        const returns = [];
        for (let i = 1; i < historicalRates.length; i++) {
            const dailyReturn = (historicalRates[i].rate - historicalRates[i-1].rate) / 
                               historicalRates[i-1].rate;
            returns.push(dailyReturn);
        }
        
        // Calculate average return and standard deviation
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / 
                        (returns.length - 1);
        const stdDev = Math.sqrt(variance);
        
        // Annualized Sharpe ratio (assuming 0% risk-free rate for simplicity)
        const annualizedReturn = avgReturn * 252;
        const annualizedStdDev = stdDev * Math.sqrt(252);
        
        return stdDev > 0 ? annualizedReturn / annualizedStdDev : 0;
    }
    
    async evaluateHedgingStrategy(exposure, instrumentType, timeHorizon) {
        const instrument = this.hedgingInstruments[instrumentType];
        
        // Base cost estimation (simplified - in reality would use market data)
        let costBasis = 0;
        let coverage = 0;
        
        switch (instrumentType) {
            case 'forward':
                // Forward contracts typically cost 0.5-2% spread
                costBasis = exposure.value * 0.01;
                coverage = 1.0; // 100% coverage
                break;
                
            case 'option':
                // Options cost more but provide flexibility
                // Cost based on volatility and time
                const timeFactor = Math.sqrt(timeHorizon / 365);
                const volFactor = exposure.riskMetrics.volatility / 100;
                costBasis = exposure.value * volFactor * timeFactor * 0.05;
                coverage = 0.9; // 90% effective coverage
                break;
                
            case 'swap':
                // Swaps for longer-term hedging
                costBasis = exposure.value * 0.005 * (timeHorizon / 365);
                coverage = 1.0;
                break;
                
            case 'natural':
                // Natural hedging has opportunity cost
                costBasis = exposure.value * 0.02; // Opportunity cost
                coverage = 0.7; // Partial coverage typically
                break;
        }
        
        // Calculate risk reduction
        const hedgedValue = exposure.value * coverage;
        const residualRisk = exposure.riskMetrics.var95 * (1 - coverage);
        const riskReduction = exposure.riskMetrics.var95 - residualRisk;
        
        return {
            instrument: instrument.name,
            type: instrumentType,
            coverage,
            cost: costBasis,
            timeHorizon,
            hedgedValue,
            residualRisk,
            riskReduction,
            efficiency: riskReduction / costBasis
        };
    }
    
    calculateRecommendedCoverage(exposure) {
        // Based on volatility and exposure size
        const volFactor = Math.min(exposure.riskMetrics.volatility / 20, 1);
        const sizeFactor = Math.min(exposure.percentage / 25, 1);
        
        // Higher volatility and larger exposures need more coverage
        return 0.5 + (volFactor * 0.3) + (sizeFactor * 0.2);
    }
    
    groupAssetsByCurrency(portfolio) {
        const groups = new Map();
        
        for (const asset of portfolio) {
            const currency = asset.currency || 'EUR';
            
            if (groups.has(currency)) {
                groups.get(currency).push(asset);
            } else {
                groups.set(currency, [asset]);
            }
        }
        
        return groups;
    }
    
    async convertGroupValue(assets, fromCurrency, toCurrency) {
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        return await this.currencyService.convert(totalValue, fromCurrency, toCurrency);
    }
    
    calculateConcentrationRisk(riskContributions) {
        // Find the largest risk contributor
        const maxContribution = Math.max(
            ...riskContributions.map(c => c.percentageOfTotal)
        );
        
        // Concentration risk score (0-100)
        // > 50% from one currency is high concentration
        return Math.min(maxContribution * 2, 100);
    }
    
    calculateDiversificationBenefit(riskContributions, baseCurrency) {
        // Sum of individual risks
        const sumOfRisks = riskContributions
            .filter(c => c.currency !== baseCurrency)
            .reduce((sum, c) => sum + c.marginalVaR, 0);
        
        // Actual portfolio risk (considering correlations)
        const portfolioRisk = riskContributions
            .reduce((sum, c) => sum + c.fxRiskContribution, 0);
        
        // Diversification benefit as percentage
        return sumOfRisks > 0 ? ((sumOfRisks - portfolioRisk) / sumOfRisks) * 100 : 0;
    }
    
    async testScenarioDirection(portfolio, baseCurrency, currencies, magnitude, direction) {
        let scenarioValue = 0;
        const impactedAssets = [];
        
        for (const asset of portfolio) {
            const assetCurrency = asset.currency || baseCurrency;
            
            if (currencies.has(assetCurrency)) {
                // Apply shock to this currency
                const shockedRate = 1 + (magnitude * direction);
                const baseValue = await this.currencyService.convert(
                    asset.value,
                    assetCurrency,
                    baseCurrency
                );
                const shockedValue = baseValue * shockedRate;
                
                scenarioValue += shockedValue;
                impactedAssets.push({
                    asset: asset.name,
                    currency: assetCurrency,
                    originalValue: baseValue,
                    shockedValue,
                    impact: shockedValue - baseValue
                });
            } else {
                // No shock for base currency assets
                const value = assetCurrency === baseCurrency 
                    ? asset.value 
                    : await this.currencyService.convert(
                        asset.value,
                        assetCurrency,
                        baseCurrency
                    );
                scenarioValue += value;
            }
        }
        
        return {
            value: scenarioValue,
            impactedAssets,
            direction: direction > 0 ? 'appreciation' : 'depreciation'
        };
    }
    
    findWorstCase(results, currentValue) {
        let worstCase = null;
        let worstImpact = 0;
        
        for (const result of results) {
            const depreciationImpact = result.depreciation.value - currentValue;
            const appreciationImpact = result.appreciation.value - currentValue;
            
            if (depreciationImpact < worstImpact) {
                worstImpact = depreciationImpact;
                worstCase = {
                    scenario: result.scenario,
                    direction: 'depreciation',
                    ...result.depreciation
                };
            }
            
            if (appreciationImpact < worstImpact) {
                worstImpact = appreciationImpact;
                worstCase = {
                    scenario: result.scenario,
                    direction: 'appreciation',
                    ...result.appreciation
                };
            }
        }
        
        return worstCase;
    }
    
    findBestCase(results, currentValue) {
        let bestCase = null;
        let bestImpact = 0;
        
        for (const result of results) {
            const depreciationImpact = result.depreciation.value - currentValue;
            const appreciationImpact = result.appreciation.value - currentValue;
            
            if (appreciationImpact > bestImpact) {
                bestImpact = appreciationImpact;
                bestCase = {
                    scenario: result.scenario,
                    direction: 'appreciation',
                    ...result.appreciation
                };
            }
            
            if (depreciationImpact > bestImpact) {
                bestImpact = depreciationImpact;
                bestCase = {
                    scenario: result.scenario,
                    direction: 'depreciation',
                    ...result.depreciation
                };
            }
        }
        
        return bestCase;
    }
    
    generateStressTestRecommendations(results, currentValue) {
        const recommendations = [];
        
        // Find scenarios with significant negative impact
        for (const result of results) {
            const depLoss = (result.depreciation.value - currentValue) / currentValue;
            const appLoss = (result.appreciation.value - currentValue) / currentValue;
            
            if (depLoss < -0.05) { // More than 5% loss
                recommendations.push({
                    scenario: `${result.scenario} currency depreciation`,
                    impact: depLoss * 100,
                    recommendation: 'Consider hedging currency exposure to limit downside risk'
                });
            }
            
            if (appLoss < -0.05) {
                recommendations.push({
                    scenario: `${result.scenario} currency appreciation`,
                    impact: appLoss * 100,
                    recommendation: 'Review short currency positions or foreign liabilities'
                });
            }
        }
        
        // Add general recommendations based on overall risk profile
        const worstCaseImpact = Math.min(
            ...results.map(r => Math.min(
                r.depreciation.percentageChange,
                r.appreciation.percentageChange
            ))
        );
        
        if (worstCaseImpact < -15) {
            recommendations.push({
                scenario: 'Overall currency risk',
                impact: worstCaseImpact,
                recommendation: 'High currency risk detected. Implement comprehensive hedging strategy'
            });
        }
        
        return recommendations;
    }
    
    calculateOptimalHedgeAmount(exposure, threshold) {
        // Calculate how much to hedge based on excess exposure
        const excessExposure = Math.max(0, exposure.percentage - threshold.maxExposure);
        const excessVolatility = Math.max(0, exposure.riskMetrics.volatility - threshold.maxVolatility);
        
        // Weight both factors
        const exposureFactor = excessExposure / exposure.percentage;
        const volatilityFactor = excessVolatility / exposure.riskMetrics.volatility;
        
        // Use the higher factor to determine hedge amount
        const hedgeFactor = Math.max(exposureFactor, volatilityFactor * 0.7);
        
        return exposure.value * Math.min(hedgeFactor, 0.9); // Cap at 90% hedge
    }
    
    recommendHedgingInstruments(exposure, hedgeAmount) {
        const recommendations = [];
        const hedgeRatio = hedgeAmount / exposure.value;
        
        // Forward contracts for high hedge ratios and stable needs
        if (hedgeRatio > 0.7 && exposure.riskMetrics.volatility < 15) {
            recommendations.push({
                instrument: 'forward',
                suitability: 'high',
                reason: 'Best for high coverage needs with moderate volatility'
            });
        }
        
        // Options for volatile currencies or partial hedging
        if (exposure.riskMetrics.volatility > 12 || hedgeRatio < 0.5) {
            recommendations.push({
                instrument: 'option',
                suitability: 'high',
                reason: 'Provides flexibility in volatile markets'
            });
        }
        
        // Natural hedging if possible
        if (exposure.assets.some(a => a.type === 'revenue' || a.type === 'operations')) {
            recommendations.push({
                instrument: 'natural',
                suitability: 'medium',
                reason: 'Match revenues and costs in same currency'
            });
        }
        
        return recommendations;
    }
    
    getHedgingReason(exposure, threshold) {
        const reasons = [];
        
        if (exposure.percentage > threshold.maxExposure) {
            reasons.push(`Exposure (${exposure.percentage.toFixed(1)}%) exceeds threshold (${threshold.maxExposure}%)`);
        }
        
        if (exposure.riskMetrics.volatility > threshold.maxVolatility) {
            reasons.push(`Volatility (${exposure.riskMetrics.volatility.toFixed(1)}%) exceeds threshold (${threshold.maxVolatility}%)`);
        }
        
        return reasons.join('; ');
    }
    
    calculateHedgingPriority(exposure, threshold) {
        // Priority based on how much thresholds are exceeded
        const exposureExcess = Math.max(0, exposure.percentage - threshold.maxExposure) / threshold.maxExposure;
        const volatilityExcess = Math.max(0, exposure.riskMetrics.volatility - threshold.maxVolatility) / threshold.maxVolatility;
        
        // Also consider absolute exposure value
        const valueFactor = Math.log10(exposure.value) / 10;
        
        return (exposureExcess + volatilityExcess + valueFactor) * 100;
    }
    
    async estimateHedgingCost(hedgeAmount, fromCurrency, toCurrency) {
        // Simplified cost estimation
        // In practice, would use market quotes
        
        // Get current volatility for cost estimation
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];
        
        const historicalRates = await this.currencyService.getHistoricalRates(
            fromCurrency,
            toCurrency,
            startDate,
            endDate
        );
        
        const volatility = this.currencyService.calculateVolatility(historicalRates);
        
        // Cost as percentage of notional
        // Higher volatility = higher cost
        const costPercentage = 0.005 + (volatility / 100) * 0.02;
        
        return hedgeAmount * costPercentage;
    }
    
    estimateTotalRiskReduction(recommendations, exposureAnalysis) {
        let totalRiskReduction = 0;
        
        for (const rec of recommendations) {
            const exposure = exposureAnalysis.exposures.find(
                e => e.currency === rec.currency
            );
            
            if (exposure) {
                // Estimate VaR reduction from hedging
                const varReduction = exposure.riskMetrics.var95 * (rec.hedgePercentage / 100);
                totalRiskReduction += varReduction;
            }
        }
        
        // As percentage of total risk
        const totalRisk = exposureAnalysis.aggregateRisk;
        return totalRisk > 0 ? (totalRiskReduction / totalRisk) * 100 : 0;
    }
}