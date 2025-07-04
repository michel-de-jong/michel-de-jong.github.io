# ROI Calculator Suite - Setup Instructions

Een professionele ROI rekentool voor Nederlandse holdings met geavanceerde investeringsanalyse functies.

## Kenmerken

- **Basis Calculator**: Uitgebreide ROI berekeningen met leverage, herinvestering, inflatie en belastingen
- **Scenario Analyse**: Vergelijk best/base/worst case scenario's met stress testing
- **Monte Carlo Simulatie**: Probabilistische risicoanalyse met 10.000+ simulaties
- **Cashflow Waterfall**: Gedetailleerde cashflow analyse per periode
- **Multi-Asset Portfolio**: Portfolio builder met risico/rendement analyse
- **Export Functies**: Excel, PDF en grafiek exports
- **Responsive Design**: Werkt perfect op desktop, tablet en mobiel
- **Nederlandse Belastingen**: Ondersteuning voor VPB (zakelijk) en Box 3 (privé)

## Nieuwe Functies (2024)

### 1. Belastingberekeningen
- **Zakelijke investeringen (VPB)**: 25,8% vennootschapsbelasting over niet-herinvesteerde winst
- **Privé investeringen (Box 3)**: 36% belasting over fictief rendement
- Automatische berekening van verschuldigde belasting
- Belasting wordt alleen geheven over uitgekeerde winst

### 2. Verbeterde Features
- **Aparte Lening Looptijd**: De aflostermijn van de lening kan nu verschillen van de investeringsperiode
- **Automatische Input Synchronisatie**: Waardes worden automatisch overgenomen tussen tabs
- **Verbeterde Monte Carlo**: Realistische kans op verlies berekeningen
- **Mobile Optimalisatie**: Perfect werkend op alle smartphone formaten

### 3. Geavanceerde Analyses
- **Stress Testing**: Test impact van negatieve scenario's
- **Value at Risk (VaR)**: 95% confidence intervals
- **Inflatie Correctie**: Bekijk nominale én reële waardes
- **Cashflow Conversie**: Analyseer efficiëntie van kapitaalgebruik

## Bestandsstructuur

```
roi-calculator/
│
├── index.html              # Hoofdbestand met belasting sectie
├── README.md              # Dit bestand
│
├── css/
│   ├── main.css           # Hoofdstijlen met mobile fixes
│   └── responsive.css     # Volledig responsive design
│
└── js/
    ├── config.js          # Configuratie instellingen
    ├── utils.js           # Hulpfuncties en statistiek
    ├── calculator.js      # Rekenlogica met belasting
    ├── charts.js          # Grafiek beheer
    ├── tabs.js            # Tab templates
    └── app.js             # Hoofdapplicatie met tax handling
```

## Installatie

### Optie 1: Lokale Webserver (Ontwikkeling)

1. Download alle bestanden naar een lokale map
2. Start een lokale webserver:

```bash
# Met Python 3
python -m http.server 8000

# Met Node.js (http-server package)
npx http-server -p 8000

# Met PHP
php -S localhost:8000
```

3. Open browser: `http://localhost:8000`

### Optie 2: Apache/Nginx Webserver (Productie)

1. Upload alle bestanden naar de webserver root directory
2. Zorg voor de juiste bestandsrechten:

```bash
chmod 755 /pad/naar/roi-calculator
chmod 644 /pad/naar/roi-calculator/*
chmod 755 /pad/naar/roi-calculator/css
chmod 644 /pad/naar/roi-calculator/css/*
chmod 755 /pad/naar/roi-calculator/js
chmod 644 /pad/naar/roi-calculator/js/*
```

3. Voor Apache, maak een `.htaccess` bestand:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

### Optie 3: CDN/Static Hosting

De applicatie kan ook gehost worden op:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Cloudflare Pages

## Configuratie

Pas `js/config.js` aan voor:
- Standaard waardes
- Belastingtarieven (VPB/Box 3)
- Taalinstelling
- Export opties
- Monte Carlo parameters

### Voorbeeld configuratie aanpassingen:
```javascript
// In config.js
defaults: {
    startKapitaal: 100000,  // Standaard startkapitaal
    vpbTarief: 25.8,        // VPB tarief 2024
    box3Tarief: 36,         // Box 3 tarief 2024
}
```

## Gebruik

### Basis Calculator
1. Voer uw startkapitaal en eventuele lening in
2. Stel het verwachte rendement in (maandelijks of jaarlijks)
3. Kies het belastingregime (zakelijk of privé)
4. Bekijk real-time ROI berekeningen

### Scenario Analyse
- Vergelijk automatisch best/base/worst case scenario's
- Voer stress tests uit op uw investeringsstrategie
- Analyseer impact van verschillende parameters

### Monte Carlo Simulatie
- Stel volatiliteit parameters in
- Run 10.000+ simulaties voor probabilistische analyse
- Bekijk kans op verlies en Value at Risk

### Belastingopties
- **Zakelijk (VPB)**: Voor holdings en BV's
  - 25,8% over niet-herinvesteerde winst
  - Rente is aftrekbaar
- **Privé (Box 3)**: Voor particuliere beleggers
  - 36% over fictief rendement (6,04% in 2024)
  - Vermogensbelasting

## Browser Ondersteuning

- Chrome/Edge (laatste 2 versies)
- Firefox (laatste 2 versies)
- Safari (laatste 2 versies)
- iOS Safari 12+
- Chrome Android 80+

## Prestatie Optimalisatie

1. **Minificatie** (optioneel):
```bash
# Install terser for JavaScript
npm install -g terser
terser js/app.js -o js/app.min.js

# Install cssnano for CSS
npm install -g cssnano-cli
cssnano css/main.css css/main.min.css
```

2. **Gzip Compressie**: Zorg dat de webserver gzip enabled heeft

3. **CDN voor Libraries**: De externe libraries worden al vanaf CDN geladen

## Beveiliging

- Alle berekeningen gebeuren client-side
- Geen data wordt naar servers gestuurd
- LocalStorage wordt gebruikt voor opslag (blijft op gebruiker's apparaat)
- HTTPS wordt aanbevolen voor productie
- Geen cookies of tracking

## Troubleshooting

### Libraries laden niet
- Controleer internetverbinding (CDN libraries)
- Controleer browser console voor errors
- Probeer hard refresh (Ctrl+F5)

### Grafieken verschijnen niet
- Zorg dat JavaScript enabled is
- Controleer of Chart.js correct laadt
- Browser console voor errors

### Export werkt niet
- Pop-up blocker kan downloads blokkeren
- Controleer browser permissies

### Monte Carlo geeft altijd 0% verlies
- Verhoog de volatiliteit parameters
- Controleer of het basis rendement realistisch is

### Mobile weergave problemen
- Clear browser cache
- Zorg voor viewport meta tag in HTML
- Update naar laatste versie

## Updates

Voor updates:
1. Download nieuwe versie van GitHub
2. Backup huidige installatie
3. Overschrijf bestanden
4. Clear browser cache

## Wijzigingen Log

### Versie 2.0 (Huidige)
- Belastingberekeningen toegevoegd (VPB/Box 3)
- Mobile responsive design verbeterd
- Monte Carlo simulatie bugfixes
- Input overflow op mobile opgelost
- Scenario isolatie voor correcte ROI berekeningen

### Versie 1.0
- Initiële release
- Basis ROI calculator
- Scenario analyse
- Export functies

## Licentie

Deze software wordt geleverd zoals het is, zonder enige garantie. Gebruik voor eigen risico.

## Contact

Voor vragen of ondersteuning, open een issue op GitHub of neem contact op met de ontwikkelaar.

## Credits

Ontwikkeld voor Nederlandse holdings en investeerders. Gebruikt moderne web technologieën en Nederlandse belastingregels (2024).