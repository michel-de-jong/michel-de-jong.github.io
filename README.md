# ROI Calculator Suite

A sophisticated client-side financial analysis application designed for Dutch investors and financial professionals to perform comprehensive Return on Investment calculations with advanced risk analysis, tax optimization, and portfolio management capabilities.

## 🚀 Key Features

### Core Financial Analysis
- **Advanced ROI Calculator** - Comprehensive calculations with leverage, reinvestment strategies, inflation adjustments, and Dutch tax integration
- **Monte Carlo Simulation** - Probabilistic risk analysis with 10,000+ iterations, Value at Risk (VaR) calculations, and statistical modeling
- **Scenario Analysis** - Compare best/base/worst case scenarios with stress testing and impact analysis
- **Cashflow Waterfall** - Detailed period-by-period financial flow breakdown and insights

### Portfolio & Risk Management
- **Multi-Asset Portfolio Builder** - Portfolio optimization with Sharpe ratios, asset allocation, and risk/return analysis
- **Multi-Currency Support** - FX risk analysis, currency exposure management, and hedging strategies
- **Historical Backtesting** - Compare projections against historical data with performance metrics
- **Risk Assessment** - Comprehensive risk profiling with volatility analysis and correlation matrices

### Dutch Tax Optimization
- **Corporate Tax (VPB)** - Vennootschapsbelasting calculations for Dutch corporations (19%/25.8% rates)
- **Income Tax (Box 1)** - Progressive Dutch income tax with deductions and brackets
- **Wealth Tax (Box 3)** - Fictitious return-based wealth tax calculations with current rates
- **Tax Scenario Comparison** - Optimize tax strategies across different regimes

### Professional Reporting
- **Excel Export** - Generate comprehensive workbooks with charts and analysis
- **PDF Reports** - Professional client-ready reports with visualizations
- **Data Persistence** - Save and load scenarios with compression and quota management
- **Chart Visualizations** - Interactive Chart.js-powered graphs and analytics

## 🏗️ Architecture

### Modern Web Stack
- **ES6 Modules** - Modular architecture with feature-based organization
- **Vite Build System** - Fast development and optimized production builds
- **Reactive State Management** - Real-time UI updates with observer pattern
- **Client-Side Only** - No server dependencies, ensuring complete data privacy

### Project Structure
```
├── index.html                  # Main application entry point
├── package.json               # Dependencies and build scripts
├── vite.config.js             # Vite build configuration
├── .github/workflows/         # CI/CD pipeline
│   └── deploy.yml
├── js/
│   ├── main.js                # Central application orchestrator
│   ├── core/                  # Core calculation engine and state management
│   │   ├── calculator.js      # Financial calculation engine
│   │   └── state-manager.js   # Reactive state management
│   ├── features/              # Modular feature implementations
│   │   ├── monte-carlo.js     # Monte Carlo simulation engine
│   │   ├── scenarios.js       # Scenario analysis
│   │   ├── portfolio.js       # Multi-asset portfolio management
│   │   ├── waterfall.js       # Cashflow analysis
│   │   ├── historical.js      # Backtesting and performance tracking
│   │   ├── currency-portfolio.js # FX risk and hedging
│   │   ├── saved.js           # Scenario persistence
│   │   └── export.js          # Report generation
│   ├── tax/                   # Dutch tax calculation modules
│   │   ├── tax-factory.js     # Tax calculation dispatcher
│   │   ├── vpb-calculator.js  # Corporate tax calculations
│   │   ├── box1-calculator.js # Income tax calculations
│   │   └── box3-calculator.js # Wealth tax calculations
│   ├── ui/                    # User interface components
│   │   ├── charts.js          # Chart.js visualization management
│   │   ├── tabs.js            # Dynamic tab loading
│   │   ├── forms.js           # Form management and validation
│   │   └── kpi-display.js     # Key performance indicators
│   ├── services/              # Data and external service integrations
│   │   ├── data-service.js    # LocalStorage persistence layer
│   │   ├── validation-service.js # Input validation rules
│   │   ├── currency-service.js # Exchange rate management
│   │   └── fx-risk-analysis.js # Foreign exchange risk calculations
│   ├── config/
│   │   └── config.js          # Application configuration and defaults
│   └── utils/                 # Utility functions and helpers
├── css/                       # Modular CSS architecture
│   ├── main.css              # CSS entry point and imports
│   ├── base/                 # Foundation styles
│   ├── components/           # Reusable UI components
│   ├── pages/                # Feature-specific styles
│   └── responsive.css        # Mobile-first responsive design
└── templates/                # HTML templates for dynamic features
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with ES6 module support

### Quick Start
```bash
# Clone the repository
git clone https://github.com/michel-de-jong/michel-de-jong.github.io.git
cd michel-de-jong.github.io

# Install dependencies
npm ci

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Commands
```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Build optimized production bundle
npm run preview  # Preview production build locally
npm run serve    # Simple Python HTTP server (alternative)
```

## 📊 Usage Guide

### Basic ROI Analysis
1. **Capital Setup** - Enter initial capital and optional leverage/loan parameters
2. **Investment Parameters** - Set expected returns (monthly/yearly), investment period, and reinvestment strategy
3. **Tax Configuration** - Choose appropriate Dutch tax regime (Corporate VPB, Income Box 1, or Wealth Box 3)
4. **Cost Management** - Input fixed costs, interest rates, and inflation assumptions
5. **Real-time Results** - View live ROI calculations, leverage factors, and inflation-adjusted values

### Advanced Features

#### Monte Carlo Simulation
- Configure volatility parameters for returns, interest rates, and costs
- Run 10,000+ probabilistic scenarios
- Analyze Value at Risk (VaR) and probability distributions
- Export statistical results and confidence intervals

#### Scenario Analysis
- Compare optimistic, base case, and pessimistic scenarios
- Run stress tests on key variables
- Analyze impact of parameter changes on ROI
- Generate scenario comparison reports

#### Portfolio Management
- Build multi-asset portfolios with custom allocations
- Optimize portfolio weights for maximum Sharpe ratio
- Analyze correlation matrices and diversification benefits
- Save and load portfolio configurations

#### Tax Optimization
- **Corporate (VPB)**: 19% rate up to €395,000, then 25.8%
- **Income (Box 1)**: Progressive rates from 36.97% to 49.5%
- **Wealth (Box 3)**: 36% tax on fictitious returns (0.36%-1.52% depending on wealth level)

## 🚀 Deployment

### GitHub Pages (Automatic)
The application automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main branch.

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider
# The application is fully static and can be hosted anywhere
```

### Hosting Options
- **GitHub Pages** (current setup)
- **Netlify** - Drag and drop the `dist` folder
- **Vercel** - Connect GitHub repository
- **AWS S3 + CloudFront** - Upload `dist` contents
- **Any static hosting provider**

## 🌐 Browser Support

- **Chrome/Edge** - Latest 2 versions
- **Firefox** - Latest 2 versions  
- **Safari** - Latest 2 versions
- **Mobile Safari** - iOS 12+
- **Chrome Android** - Version 80+

## ⚙️ Configuration

The application can be customized via `js/config/config.js`:

```javascript
export const Config = {
    defaults: {
        startKapitaal: 100000,    // Default starting capital
        rendement: 8,             // Default expected return %
        vpbRate: 25.8,            // Corporate tax rate
        box3Tarief: 36,           // Box 3 tax rate
        monteCarloRuns: 1000,     // Monte Carlo iterations
        // ... more configuration options
    },
    // Tax rates, validation rules, UI settings, etc.
};
```

## 🔒 Privacy & Security

- **Client-Side Only** - All calculations performed in browser
- **No Data Transmission** - No data sent to external servers
- **Local Storage** - Data persisted locally on user's device
- **No Tracking** - No cookies, analytics, or user tracking
- **HTTPS Recommended** - For production deployments

## 🐛 Troubleshooting

### Common Issues

**Charts not displaying**
- Ensure JavaScript is enabled
- Check browser console for Chart.js loading errors
- Try hard refresh (Ctrl+F5)

**Export functionality not working**
- Check if popup blocker is preventing downloads
- Verify browser permissions for file downloads

**Monte Carlo showing 0% loss probability**
- Increase volatility parameters
- Verify realistic return assumptions

**Mobile display issues**
- Clear browser cache
- Ensure viewport meta tag is present
- Update to latest browser version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Michel de Jong** - [@michel-de-jong](https://github.com/michel-de-jong)

## 🙏 Acknowledgments

- Built for Dutch investors and financial professionals
- Utilizes modern web technologies and Dutch tax regulations (2025)
- Chart.js for data visualization
- Vite for build tooling and development experience

---

*For questions, support, or feature requests, please open an issue on GitHub.*
