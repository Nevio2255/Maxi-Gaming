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

## Produkte verwalten: `/admin`

Unter `https://DEINE-SEITE.netlify.app/admin` gibt es eine passwortgeschützte
Oberfläche, um Produkte anzulegen, zu bearbeiten und zu löschen –
inklusive mehrerer Bilder pro Produkt (werden im Browser automatisch
verkleinert, bevor sie hochgeladen werden).

- Anmeldung mit dem Wert von `ADMIN_PASSWORD` aus deinen Netlify-Umgebungsvariablen.
- Gespeichert wird in **Netlify Blobs** (in Netlify eingebauter Objekt-Speicher,
  keine zusätzliche Einrichtung nötig, funktioniert automatisch nach dem
  Deploy).
- `data/products.json` ist nur noch die **Startbefüllung**: Solange im
  Admin-Bereich noch nichts gespeichert wurde, zeigt die Seite die vier
  Beispielsysteme aus dieser Datei. Sobald du im Admin-Bereich etwas
  speicherst, übernimmt Netlify Blobs und `data/products.json` wird nicht
  mehr verwendet.
- Wichtig: Der Admin-Schutz ist ein einfacher Passwortvergleich – ausreichend
  für einen kleinen Shop, aber kein Ersatz für ein vollwertiges Login-System
  mit Benutzerkonten. Teile den Link/das Passwort nicht öffentlich.

**Währung:** Beim Anlegen eines Produkts im Admin-Bereich wählst du die
Währung. Sie **muss** zur Länderwährung deines SumUp-Kontos passen (siehe
SumUp-Dashboard unter Einstellungen), sonst lehnt SumUp die Zahlung mit
`"Given currency differs from merchant's country currency"` ab.

## Preise & Produkte ändern

Am einfachsten über den Admin-Bereich (`/admin`). Alternativ kannst du die
Start-Daten in `data/products.json` bearbeiten und neu pushen – das wirkt
sich aber nur aus, solange noch keine Produkte über den Admin-Bereich
gespeichert wurden (siehe oben).

## Sicherheitshinweis

`create-checkout.js` läuft ausschließlich serverseitig; der `SUMUP_API_KEY`
verlässt nie den Browser. Kartendaten werden direkt vom SumUp-Payment-Widget
verarbeitet, laufen also nicht über deinen Server – dadurch bleibst du
weitgehend außerhalb des PCI-DSS-Umfangs, bist aber weiterhin selbst dafür
verantwortlich, deine Verpflichtungen mit SumUp/deinem Acquirer zu klären.
