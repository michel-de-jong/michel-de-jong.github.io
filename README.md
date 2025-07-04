# ROI Calculator Suite - Setup Instructions

Een professionele ROI rekentool met geavanceerde investeringsanalyse functies.

## Kenmerken

- **Basis Calculator**: Uitgebreide ROI berekeningen met leverage, herinvestering en inflatie
- **Scenario Analyse**: Vergelijk best/base/worst case scenario's
- **Monte Carlo Simulatie**: Probabilistische risicoanalyse met 10.000+ simulaties
- **Cashflow Waterfall**: Gedetailleerde cashflow analyse per periode
- **Multi-Asset Portfolio**: Portfolio builder met risico/rendement analyse
- **Export Functies**: Excel, PDF en grafiek exports
- **Responsive Design**: Werkt op desktop, tablet en mobiel

## Nieuwe Functies

1. **Aparte Lening Looptijd**: De aflostermijn van de lening kan nu verschillen van de investeringsperiode
2. **Automatische Input Synchronisatie**: Waardes worden automatisch overgenomen tussen tabs

## Bestandsstructuur

```
roi-calculator/
│
├── index.html              # Hoofdbestand
├── README.md              # Dit bestand
│
├── css/
│   ├── main.css           # Hoofdstijlen
│   └── responsive.css     # Responsive stijlen
│
└── js/
    ├── config.js          # Configuratie instellingen
    ├── utils.js           # Hulpfuncties
    ├── calculator.js      # Rekenlogica
    ├── charts.js          # Grafiek beheer
    ├── tabs.js            # Tab templates
    └── app.js             # Hoofdapplicatie
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
- Belastingtarieven
- Taalinstelling
- Export opties

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

## Updates

Voor updates:
1. Download nieuwe versie
2. Backup huidige installatie
3. Overschrijf bestanden
4. Clear browser cache

## Licentie

Deze software wordt geleverd zoals het is, zonder enige garantie. Gebruik voor eigen risico.

## Contact

Voor vragen of ondersteuning, neem contact op met de ontwikkelaar.