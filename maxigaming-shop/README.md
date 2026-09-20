# MaxiGaming Shop

Statische Ein-Seiten-Shop-Seite mit vier festen PC-Konfigurationen und
Kreditkarten-Checkout über SumUp. Kein Konfigurator, keine anderen
Zahlungsarten – wie gewünscht.

## Was enthalten ist

- `index.html`, `css/style.css`, `js/main.js` – die eigentliche Seite
- `data/products.json` – deine vier Systeme (Name, Specs, Preis). **Hier
  anpassen**, wenn sich Konfiguration oder Preise ändern.
- `netlify/functions/create-checkout.js` – Server-Funktion, die bei SumUp
  einen Checkout mit dem **serverseitig hinterlegten** Preis anlegt (der
  Preis kommt nie vom Browser, damit niemand den Betrag manipulieren kann)
- `netlify.toml` – Netlify-Konfiguration
- `.env.example` – zeigt, welche Umgebungsvariablen du brauchst

**Nicht enthalten:** eine Admin-Oberfläche, Bestellverwaltung oder
Lagerbestand. `ADMIN_PASSWORD` ist in `.env.example` nur als Platzhalter für
später vorgesehen, wird vom aktuellen Code aber nirgends benutzt.

## 1. Auf GitHub hochladen

```bash
cd maxigaming-shop
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-NUTZERNAME/maxigaming-shop.git
git push -u origin main
```

(Repo vorher leer auf github.com anlegen, ohne README/gitignore, damit es
zum `git push` passt.)

## 2. Mit Netlify verbinden

1. Auf [app.netlify.com](https://app.netlify.com) → **Add new site → Import
   an existing project**.
2. GitHub-Repo auswählen.
3. Build-Einstellungen: **Build command leer lassen**, **Publish
   directory: `.`** (steht schon in `netlify.toml`, Netlify übernimmt das
   automatisch).
4. Noch nicht deployen – erst die Umgebungsvariablen setzen (nächster
   Schritt), sonst schlägt der Checkout fehl.

## 3. Umgebungsvariablen setzen

In Netlify: **Site configuration → Environment variables** → folgende
Werte eintragen (NICHT in eine `.env`-Datei im Repo schreiben):

| Variable | Wert |
|---|---|
| `SUMUP_API_KEY` | dein Secret API Key aus dem [SumUp Developer-Dashboard](https://developer.sumup.com/tools/authorization/api-keys/) |
| `SUMUP_MERCHANT_CODE` | dein Merchant Code aus dem SumUp-Dashboard |
| `SITE_URL` | die Netlify-URL deiner Seite (z. B. `https://maxigaming.netlify.app`) |
| `ADMIN_PASSWORD` | optional, aktuell ungenutzt |

Danach: **Deploy site**.

## 4. SumUp-Konto vorbereiten

- Du brauchst ein SumUp-Konto mit freigeschaltetem **Online-Payments**
  (Checkout-API). Das ist etwas anderes als das normale Kartenterminal.
- API Key erstellen unter developer.sumup.com (Scope `payments` oder
  `checkouts.write`/`checkouts.read`).
- Zum Testen bietet SumUp einen Sandbox-Modus/Testkarten an – siehe
  [developer.sumup.com/online-payments/testing](https://developer.sumup.com/online-payments/testing/).
  Erst mit einer echten Testbestellung prüfen, bevor du die Seite
  bewirbst.

## 5. Domain (optional)

Falls du eine eigene Domain statt `*.netlify.app` willst: **Domain
management** in Netlify → Domain hinzufügen und DNS wie angezeigt setzen.

## Preise & Produkte ändern

Einfach `data/products.json` bearbeiten und neu pushen (Netlify deployt
automatisch bei jedem Push auf `main`). Die Netlify-Funktion liest dieselbe
Datei, Preise auf der Seite und beim Checkout bleiben also immer
synchron.

## Sicherheitshinweis

`create-checkout.js` läuft ausschließlich serverseitig; der `SUMUP_API_KEY`
verlässt nie den Browser. Kartendaten werden direkt vom SumUp-Payment-Widget
verarbeitet, laufen also nicht über deinen Server – dadurch bleibst du
weitgehend außerhalb des PCI-DSS-Umfangs, bist aber weiterhin selbst dafür
verantwortlich, deine Verpflichtungen mit SumUp/deinem Acquirer zu klären.
