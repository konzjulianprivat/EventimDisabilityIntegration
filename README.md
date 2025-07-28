<link rel="stylesheet" href="./README.pdf.css" />

<div class="title-page">
  <h1>Eventim Disability Integration</h1>
  <p><em>Barrierefreie Abwicklung von Ticketbestellungen &amp; Nachteilsausgleichsanträgen</em></p>
  <p><em>Version 1.0 – 23. Juli 2025</em></p>
</div>

<div class="pagebreak"></div>

# Eventim Disability Integration

Dieses Repository enthält eine Next.js Anwendung samt Express Backend, mit der Eventim eine barrierefreie Abwicklung von Ticketbestellungen und eine Verwaltung von Nachteilsausgleichsanträgen ermöglicht. Das Projekt gliedert sich in ein Frontend und einen Node.js Server im Unterordner `eventim-disability-integration`.

## Inhaltsverzeichnis

<!-- toc -->

- [Einleitung (Soheil)](#einleitung-soheil)
  * [Projekthintergrund und Motivation](#projekthintergrund-und-motivation)
  * [Aktuelle Herausforderungen:](#aktuelle-herausforderungen)
  * [Gesellschaftlicher und rechtlicher Kontex:](#gesellschaftlicher-und-rechtlicher-kontext)
- [Projektvision und Zielsetzung](#projektvision-und-zielsetzung)
  * [Ziele](#ziele)
  * [Zielgruppen und Stakeholder](#zielgruppen-und-stakeholder)
  * [Interne Stakeholder](#interne-stakeholder)
- [Projektübersicht (Soheil)](#projektubersicht-soheil)
- [Setup](#setup)
- [Projektstruktur](#projektstruktur)
- [Architektur und eingesetzte Technologien](#architektur-und-eingesetzte-technologien)
  * [Frontend](#frontend)
  * [Backend](#backend)
  * [Datenbank](#datenbank)
  * [Komponenten und Hooks](#komponenten-und-hooks)
- [Security & Fault Tolerance](#security--fault-tolerance)
  * [Rollen und Fähigkeiten](#rollen-und-fahigkeiten)
  * [Fehlertoleranz des Backends](#fehlertoleranz-des-backends)
- [Testkonzept](#testkonzept)
  * [User-Tests](#user-tests)
- [Nächste Schritte](#nachste-schritte)
- [Anhang](#anhang)
  * [Datenbank-Modell](#datenbank-modell)

<!-- tocstop -->

## Einleitung (Soheil)

### Projekthintergrund und Motivation

Die Eventim-Plattform ist eine der führenden Ticketing-Lösungen im deutschsprachigen Raum und verarbeitet jährlich Millionen von Ticket-Transaktionen für Konzerte, Festivals, Theater und Sportveranstaltungen. Trotz dieser marktführenden Position existiert eine bedeutende Lücke in der Barrierefreiheit und digitalen Inklusion für Menschen mit Behinderungen.

### Aktuelle Herausforderungen:

- Menschen mit Schwerbehindertenausweis müssen ihre Tickets derzeit telefonisch buchen
- Nachteilsausgleiche (reduzierte Preise, kostenfreie Begleitpersonen) werden nicht automatisch angewendet
- Keine digitale Verifizierung von Behindertenausweisen möglich
- Manuelle Bearbeitung führt zu langen Wartezeiten und Fehlerquellen
- Schlechte User Experience für eine vulnerable Zielgruppe

### Gesellschaftlicher und rechtlicher Kontext:

In Deutschland leben etwa 7,9 Millionen Menschen mit einer anerkannten Schwerbehinderung (Stand 2021). Diese Personengruppe hat nach dem Sozialgesetzbuch IX (SGB IX) und verschiedenen Landesgesetzen Anspruch auf Nachteilsausgleiche bei kulturellen Veranstaltungen. Die EU-Richtlinie zur Barrierefreiheit (European Accessibility Act) verpflichtet zudem bis 2025 zur digitalen Barrierefreiheit von Ticketing-Systemen.

## Projektvision und Zielsetzung

Vision: "Eventim wird zur ersten vollständig inklusiven Ticketing-Plattform, die Menschen mit Behinderungen den gleichen komfortablen, digitalen Zugang zu kulturellen Erlebnissen ermöglicht wie allen anderen Nutzern."

### Ziele

#### Primäre Ziele:

- Vollständige Integration der Disability-Features in die bestehende Plattform
- Eliminierung manueller Prozesse durch intelligente Verifizierung
- Erfüllung aller rechtlichen Anforderungen Erschließung einer neuen Zielgruppe mit signifikantem Marktpotential

#### Sekundäre Ziele:

- Reduzierung der Support-Anfragen um 70%
- Steigerung der Kundenzufriedenheit in der Zielgruppe
- Positionierung als Accessibility-Leader im Ticketing-Markt

### Zielgruppen und Stakeholder

#### Menschen mit Schwerbehinderung (Primary Users)

- Anzahl: ~7,9 Millionen in Deutschland
- Charakteristika: Diverse Behinderungsarten, unterschiedliche technische Affinität
- Bedürfnisse: Einfache, barrierefreie Buchung, automatische Vergünstigungen
- Pain Points: Aktuelle telefonische Buchung, Wartezeiten, Unsicherheit über Berechtigung

#### Begleitpersonen und Angehörige (Secondary Users)

- Anzahl: ~2–3 Millionen potentielle Nutzer
- Charakteristika: Oft technisch versierter, buchen stellvertretend
- Bedürfnisse: Transparente Abrechnung, klare Berechtigungsregeln

### Interne Stakeholder

#### Service-Mitarbeiter

- Anzahl: ~50 Personen im Customer Service
- Bedürfnisse: Effiziente Tools zur Antragsbearbeitung, reduzierte Anruflast
- Erfolgsmetriken: 60% weniger Disability-bezogene Tickets

#### Admin-User (Content-Manager, Venue-Manager)

- Anzahl: ~20 Power-User
- Bedürfnisse: Einfache Konfiguration von barrierefreien Bereichen
- Erfolgsmetriken: Reduzierte Setup-Zeit für neue Events

## Projektübersicht (Soheil)

Das Eventim Disability Integration System ist eine umfassende Erweiterung der bestehenden Ticketing-Plattform, die Menschen mit Behinderungen vollständige digitale Autonomie beim Ticket-Kauf ermöglicht. Das System integriert sich nahtlos in die bestehende Eventim-Architektur und erweitert diese um spezialisierte Funktionen für Barrierefreiheit und Nachteilsausgleiche.

Kernfunktionalitäten:

- **Intelligente Behindertenausweis-Verifizierung**
  - Upload-Interface für Vorder- und Rückseite des Schwerbehindertenausweises
  - OCR-basierte automatische Datenextraktion (Grad, Merkzeichen, Gültigkeit)
  - Manuelle Nachbearbeitung durch geschulte Service-Mitarbeiter
  - Echtzeit-Validierung gegen bekannte Ausweis-Muster

- **Automatisierte Nachteilsausgleiche**
  - Dynamische Preisanpassungen basierend auf Behinderungsgrad und Merkzeichen
  - Automatische Begleitpersonen-Integration für B-Merkzeichen-Inhaber
  - Priorisierte Anzeige barrierefreier Sitzplätze und Bereiche
  - Transparente Darstellung aller Vergünstigungen im Checkout

## Setup

1. **Repository klonen** und in das Projekt wechseln:

   ```bash
   git clone <repo-url>
   cd EventimDisabilityIntegration/eventim-disability-integration
   ```

2. **Abhängigkeiten installieren**:

   ```bash
   npm install
   ```

3. **Datenbankzugang konfigurieren**:

   Legen Sie im Verzeichnis `server` eine Datei `credentials.json` an. Beispiel:
   ```json
   {
      "host": "152.53.119.113",
      "port": 5433,
      "user": "postgres",
      "password": "example",
      "database": "db1",
      "sessionSecret": "example-secret"
   }
   ```

4. **Entwicklungsumgebung starten**:

   ```bash
   npm run dev
   ```
   Damit starten sowohl das Next.js Frontend auf [http://localhost:3000](http://localhost:3000), das Backend unter [http://localhost:4000](http://localhost:4000) sowie P2M zur Überwachung der Datenbank- und Backendverbindung.

<a name="projektstruktur"></a>

## Projektstruktur

Der gesamte Quellcode liegt im Unterordner `eventim-disability-integration`. Nachfolgende Tabelle bietet einen schnellen Überblick über die wichtigsten Verzeichnisse:

| Pfad | Inhalt |
|------|-------|
| `src/pages/` | Sämtliche Next.js Seiten. Unterordner wie `admin/` oder `artists/` bilden dynamische Routen ab. |
| `src/components/` | Wiederverwendbare UI-Bausteine (Modals, Navigationsleisten, Karten usw.) |
| `src/hooks/` | Custom Hooks wie `useAuth` oder `useCart`, die zentrale Logik kapseln |
| `src/__tests__/` | Kleine Jest-Tests zur Absicherung wichtiger Backend-Funktionen |
| `server/` | Express‑Backend (`server.js`), DB-Anbindung (`db.js`), `backup_script.sql` und PM2-Konfiguration |
| `public/` | Statische Dateien, die unverändert von Next.js bereitgestellt werden |

In der Repository-Wurzel befinden sich zudem `diagrams/` und `pictures/` mit den PlantUML‑Quellen und exportierten SVG-Grafiken des Designs.

<a name="technologien"></a>

## Architektur und eingesetzte Technologien

Die Anwendung besteht aus einem [Next.js](https://nextjs.org/) Frontend und einem [Express](https://expressjs.com/) Backend. Als Datenbank kommt [PostgreSQL](https://www.postgresql.org/) zum Einsatz. Die Wahl fiel auf diese Kombination, da sie leichtgewichtig, gut erweiterbar und auch ohne großen Konfigurationsaufwand lokal ausführbar ist. Next.js liefert die React basierte Oberfläche und kann sowohl statische Seiten als auch serverseitig gerenderte Inhalte bereitstellen. Express dient als schlanker REST‑API Server, der über die `server`‑Ordnerstruktur umgesetzt ist. Die Kommunikation zwischen Frontend und Backend erfolgt ausschließlich über JSON‑basierte HTTP‑Aufrufe.

<a name="frontend"></a>

### Frontend

Im Frontend der Applikation wurde Next.js in Kombination mit React eingesetzt, weil diese Lösung serverseitiges Rendering ermöglicht und eine klare Komponentenstruktur vorgibt. Im Gegensatz zu einer klassischen Client-only-Umsetzung mit Create React App profitieren wir so von besseren Ladezeiten und SEO.

Alternative Umsetzungen wären etwa mit Vue.js/Nuxt oder Angular möglich gewesen, jedoch besitzt das Team bereits umfangreiche Erfahrung mit React, was die Wartung vereinfacht.

#### Seitenübersicht

Die Next.js Anwendung befindet sich unter `src/pages` und nutzt dynamische Routen. Wichtige Seiten sind:

| Pfad | Zweck / Inhalte |
|------|----------------|
| `/` | Startseite mit Highlights sowie Künstler- und Tourübersicht |
| `/artists/[artist]` | Detailseite eines Künstlers und Übersicht zugehöriger Touren |
| `/artists/[artist]/[tour]` | Informationen und Events einer Tour |
| `/artists/[artist]/[tour]/[event]` | Detailseite eines Events mit Buchungsoption |
| `/registration` | Formular zur Kontoerstellung und Erfassung optionaler Behindertenausweis-Daten |
| `/login` | Anmelden bzw. Schnellanmeldung inkl. Passwort-Reset |
| `/profile` | Persönliche Daten, Bestellungen und eigene Events verwalten |
| `/checkout` | Mehrstufiger Bestellprozess (Versanddaten, Zahlung, Abschluss) |
| `/admin` | Einstieg in alle Admin-Unterseiten zur Pflege von Künstlern, Ländern, Genres, Touren und Veranstaltungsorten |
| `/service` | Zugriffspunkt für Service-Mitarbeiter (u.a. Nachteilsausgleichsanträge und Account-Management) |

Alle Seiten unter `/admin/*` und `/service/*` setzen entsprechende Berechtigungen voraus und sind nur Admin- bzw. Servicemitarbeitern gestattet. Falls ein Nutzer, welcher entweder nicht angemeldet ist oder nicht die notwendigen Berechtigungen besitzt auf diese Webseite geht, so wird dieser auf die Homepage zurückgewiesen.

<a name="backend"></a>

### Backend

Im Backend der Applikation wurde Express als leichtgewichtiges Framework eingesetzt, da es eine minimalistische Struktur besitzt und Middleware sehr flexibel eingebunden werden kann. Im Gegensatz zu komplexeren Lösungen wie NestJS ermöglicht Express einen schnellen Einstieg und volle Kontrolle über den Request-Flow.

Alternative Umsetzungen wären mit NestJS oder Fastify möglich gewesen, doch Express ist in der Node.js-Community weit verbreitet und dementsprechend ausgezeichnet dokumentiert.

Im Folgenden sind die wichtigsten Routen des Express-Servers (siehe `server/server.js`) aufgeführt:

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `POST`  | `/users` | Registrierung eines neuen Nutzers inkl. optionaler Behindertenausweis-Daten |
| `POST`  | `/sessions` | Benutzeranmeldung, legt Session-Cookie an |
| `GET`   | `/session` | Prüft, ob ein Nutzer eingeloggt ist und liefert Profilinformationen |
| `DELETE` | `/session` | Beendet die aktuelle Session |
| `GET`   | `/users/me/address` | Liefert die hinterlegte Anschrift des eingeloggten Nutzers |
| `GET`   | `/disability-marks` | Auflistung möglicher Markierungen des Behindertenausweises |
| `GET`   | `/disability-requests/pending` | Offene Anträge auf Nachteilsausgleich für den Service-Bereich |
| `PATCH` | `/disability-requests/:id/accepted` | Antrag eines Nutzers akzeptieren |
| `PATCH` | `/disability-requests/:id/declined` | Antrag eines Nutzers ablehnen |
| `GET`   | `/artists` | Auflistung aller Künstler |
| `POST`  | `/artists` | Neuen Künstler anlegen |
| `GET`   | `/tours/detailed` | Touren inkl. Events und Zugänglichkeitsdaten |
| `POST`  | `/tours` | Neue Tour anlegen |
| `GET`   | `/venues/detailed` | Liste aller Veranstaltungsorte mit Areas |
| `POST`  | `/venues` | Neuen Veranstaltungsort anlegen |
| `POST`  | `/cart-items` | Ticket zur Warenkorb-Session hinzufügen |
| `GET`   | `/checkout` | Aktuellen Checkout laden |
| `POST`  | `/orders` | Bestellung aus abgeschlossenem Checkout erzeugen |

Dies ist nur ein Auszug. Weitere Endpunkte finden sich direkt im Quellcode von `server/server.js`.

Die Endpunkte folgen den Best Practices von REST-API-Schnittstellen und halten konsequent Ressourcenorientierung, sprechende URLs sowie eindeutige HTTP-Statuscodes ein. Darüber hinaus wurde bei der Konstruktion der Endpunkte auf eine einheitliche Fehlerbehandlung und eine klare Trennung zwischen Daten- und Geschäftslogik geachtet.

### Technologie‑Übersicht

Neben den eingesetzten Frameworks wurden in diesem Projekt mehrere Libraries eingebunden, welche im Folgenden aufgelistet werden.

| Komponente/Bibliothek | Kategorie | Zweck |
|-----------------------|-----------|-------|
| **Node.js** | Runtime | Ausführung von Backend und Next.js |
| **Next.js** | Framework | React-basiertes Frontend mit Server Side Rendering |
| **React** | Library | UI-Komponenten im Browser |
| **Express** | Backend Framework | REST‑API und Routing |
| **PostgreSQL** | Datenbank | Persistente Speicherung aller Daten |
| **pg** | Library | Zugriff auf PostgreSQL im Backend |
| **bcrypt** | Library | Hashing von Passwörtern |
| **multer** | Library | Datei‑Uploads in die Datenbank |
| **react-router-dom** | Library | Clientseitige Navigation |
| **react-toastify** | Library | Anzeigen von Toast‑Benachrichtigungen |
| **opossum** | Library | Circuit‑Breaker für Fehlerbehandlung |
| **PM2** | Tool | Prozessmanager für den Server |
| **nodemon** | Tool | Automatischer Neustart im Entwicklungsmodus |
| **uuid** | Library | Erzeugen eindeutiger IDs |
| **Testing Library / Jest** | Testframeworks | Frontend‑Tests |

Es wurde insbesondere `react-toastify` genutzt, um auf der Seite ein konsistentes Benachrichtigungssystem umzusetzen. Darüber hinaus sorgen `opossum` und `PM2` für eine resiliente Fehlerbehandlung im Backend und einen stabilen Betrieb.

<a name="datenbank"></a>

### Datenbank

![Datenbank-Schema](./pictures/ERM_database.png)

Die Datenbank basiert auf PostgreSQL und wurde einmalig über `server/backup_script.sql` erstellt. Enthalten sind Tabellen für Benutzer, Rollen, Künstler, Touren, Events, Veranstaltungsorte sowie Tabellen zur Abwicklung von Bestellungen und zur Speicherung von Disability-Merkmalen. Hierbei wurde darauf geachtet, dass alle Metadaten ebenfalls in der Datenbank angepasst werden können, somit flexibel angepasst und erweitert werden können.

Es wurde sich für eine PostgreSQL Datenbank entschieden, da diese ACID-konforme Transaktionen sowie eine ausgereifte Query-Engine bietet und gleichzeitig JSON-Datenstrukturen unterstützt. Alternativen wie MySQL oder MongoDB wurden geprüft, jedoch erschien PostgreSQL aufgrund der breiten Community-Unterstützung und der stabilen Erweiterbarkeit am sinnvollsten.

#### Übersicht der Datenbanktabellen
Nachfolgend eine kurze Beschreibung jeder Tabelle und ihrer Beziehungen.

| Tabelle | Zweck / wichtige Spalten | Abhängigkeiten |
|---------|--------------------------|---------------|
| **countries** | Länder mit ISO‑Code. | – |
| **cities** | Städte innerhalb eines Landes. | `countries` via `country_id` |
| **user_roles** | Definiert Rechte einer Rolle. | – |
| **users** | Registrierte Personen samt Adresse und optionalen Disability‑Angaben. | `user_roles` via `role` |
| **artists** | Künstlerinformationen. | – |
| **genres** / **subgenres** | Klassifikation von Touren. | `genres` via `genre_id` |
| **tours** | Übergeordnete Tour einer Reihe von Events. | – |
| **tour_artists** | Zuordnung Künstler ↔ Tour. | `artists`, `tours` |
| **tour_genres** / **tour_subgenres** | Genre‑Verknüpfungen einer Tour. | `tours`, `genres`/`subgenres` |
| **venues** | Veranstaltungsorte. | `cities` via `city_id` |
| **areas** | Sitzplatz‑ bzw. Zugänglichkeitsbereiche. | – |
| **venue_areas** | Bereiche innerhalb eines Venues. | `venues`, `areas` |
| **events** | Konkrete Veranstaltungstermine. | `tours`, `venues` |
| **event_categories** | Ticket‑Kategorien (Preis, Support für Behinderte). | `events` via `event_id` |
| **event_supporting_acts** | Support‑Acts eines Events. | `events`, `artists` |
| **event_venue_areas** | Zuordnung Event ↔ Bereich mit Kapazität. | `events`, `venue_areas`, `event_categories` |
| **images** | Speicherung von hochgeladenen Bildern. | Beliebige Entität über `entity_type`/`entity_id` |
| **carts** | Aktiver Warenkorb eines Nutzers. | `users` |
| **cart_items** | Einzelne Artikel im Warenkorb. | `carts`, `events`, `event_categories` |
| **checkouts** | Zwischenschritt zwischen Warenkorb und Bestellung. | `users` |
| **checkout_items** | Positionen des Checkouts inkl. Preis. | `checkouts`, `events`, `event_categories` |
| **payment_options** / **shipping_options** | Stammdaten für Zahlungs‑ und Versandarten. | – |
| **orders** | Abgeschlossene Bestellungen. | `users`, `payment_options` |
| **tickets** | Konkrete Ticketdatensätze. | `orders`, `event_categories` |
| **order_tickets** | Relation zwischen Order und Ticket (1‑n). | `orders`, `tickets` |
| **disability_marks** | Mögliche Merkmale auf Behindertenausweisen. | `areas` via `area_id` |
| **user_disability_marks** | Zuordnung User ↔ Marks. | `users`, `disability_marks` |

Die Fremdschlüssel schützen vor inkonsistenten Daten. Viele Tabellen nutzen UUIDs als Primärschlüssel. Preise werden als `NUMERIC(10,2)` gespeichert, was zwei Nachkommastellen erlaubt. Für einfache Lookups existieren diverse Join‑Tabellen (z. B. `tour_genres`). Bei der Konstruktion des Datenbankmodells wurde stets darauf geachtet, dass die Datenbank in dritter Normalform vorliegt, somit Anomalien durch Löschen oder Anpassungen von Daten weitesgehend midigiert werden können.

<a name="komponenten-hooks"></a>

### Komponenten und Hooks

Eine Komponente im Kontext dieser Arbeit ist ein kapselbarer UI-Baustein auf React-Basis, wohingegen ein Hook wiederverwendbare Logik wie Zustandsverwaltung oder Seiteneffekte abbildet. Beide Konzepte eignen sich dazu, komplexe Abläufe zu abstrahieren und die Wiederverwendbarkeit des Codes signifikant zu erhöhen.

Der Quellcode unter `src` gliedert sich in wiederverwendbare React‑Komponenten und mehrere Custom Hooks:

**Komponenten** (Auswahl)

| Datei | Einsatz |
|-------|--------|
| `nav-bar.jsx` | Hauptnavigation mit Suche und Warenkorb-Anzeige |
| `footer.jsx` | Gemeinsamer Seitenfuß |
| `LoadingOverlay.jsx` | Überblendet die Seite während Daten geladen werden |
| `DisabilityRequestModal.jsx` | Dialog zur Beantragung eines Nachteilsausgleichs |
| `DeleteAccountModal.jsx` | Bestätigungsdialog zum Löschen des Accounts |
| `smallArtistCard.jsx` / `smallTourCard.jsx` | Vorschaukarten auf der Startseite |

**Hooks**

| Hook | Zweck |
|------|------|
| `useAuth` | Kümmert sich um Login‑Status und hält Userdaten clientseitig vor |
| `useCart` | Verwaltet den Warenkorb und lädt Items vom Server |
| `useRequireAccess` | Leitet unberechtigte Nutzer auf die Login‑Seite um |
| `useValidation` | Hilft bei Formularvalidierungen |

Die Komponenten sind so aufgebaut, dass sie in verschiedenen Seiten wiederverwendet werden können. Die Hooks stellen gemeinsam genutzte Logik bereit und erleichtern die Anbindung an das Backend.

<a name="weiterfuehrende-hinweise"></a>

## Schnittstellen zwischen Datenbank, Backend und Frontend

### REST-Endpunkte

Die Kommunikation zwischen Frontend und Backend erfolgt ausschließlich über klar definierte REST-Endpunkte, die einheitliche JSON-Strukturen zur Verfügung stellen.

### Trennung von Geschäfts- und Applikationslogik

Die Geschäftslogik befindet sich hauptsächlich im Backend, während das Frontend primär für die Darstellung und Benutzerinteraktion zuständig ist. Dadurch bleibt der Client schlank und die Kernprozesse lassen sich unabhängig testen.

## Security & Fault Tolerance

Um Userdaten bestmöglich zu schützen, werden alle API-Aufrufe über HTTPS gesichert und Sessions serverseitig verwaltet.

- Das Frontend erwartet als API-Basis `NEXT_PUBLIC_API_URL` (Standard: `http://localhost:4000`).
- Für Datei-Uploads wird `multer` verwendet. Bilder werden in der Tabelle `images` gespeichert und über `/image/:id` ausgeliefert.
- Ein Cronjob im Server entfernt veraltete Warenkörbe und Checkouts alle 60 Sekunden.

### Rollen und Fähigkeiten

Die Tabelle `user_roles` definiert Berechtigungen. Aktuell existieren drei Rollen:

| Rollenname | Beschreibung | Edit | Create | Appoint Roles | Account Mgmt | Disability Approval | Delete |
|------|--------------|------|--------|---------------|--------------|--------------------|--------|
| **user** | Regulärer Eventim Nutzer | false | false | false | false | false | false |
| **service** | Service-Mitarbeiter von Eventim | false | false | false | true | true | false |
| **admin** | Vollzugriff auf alle Funktionen | true | true | true | true | true | true |

Um im Falle eines Datenbank- oder Backend-Fehlers dem Nutzer weiterhin ein funktionsfähiges System zu bieten, werden Fehlerzustände serverseitig abgefangen und dem Frontend in strukturierter Form gemeldet.

- `server/db.js` überwacht die Datenbankverbindung und versucht bei Fehlern einen Reconnect. Ein Circuit-Breaker auf Basis von `opossum` verhindert Kaskadenfehler.
- `server/server.js` startet erst, wenn eine DB-Verbindung besteht, und führt regelmäßige Aufräumjobs aus.
- Der Server wird mit **PM2** im Cluster-Modus betrieben und startet bei Fehlern automatisch neu.
- Ungefangene Fehler führen zu einem kontrollierten Exit, damit PM2 unmittelbar einen Neustart durchführen kann.

Damit wird garantiert, dass auch bei temporären Ausfällen keine inkonsistenten Daten geschrieben werden und der Dienst sich automatisch erholt.

### Doppelte Validierung zwischen Front- und Backend

Fälle, in denen eine Anpassung/ein Löschen von Daten nicht zugelassen werden soll sind sowohl in Front- als auch im Backend abgefangen. Beim Versuch, eine Tour bzw. ein Event zu löschen validiert zunächst das Frontend, ob zu dieser Tour/ einem Event dieser Tour bereits Tickets existieren. Nur wenn keine Tickets in `orders` hinterlegt sind, erscheint die Möglichkeit das Event zu löschen.

Sollte das Frontend in einen Fehler laufen und dennoch ein "Löschen"-Icon anzeigen wirft das Backend in `server/server.js` einen Fehler, dass diese Aktion nicht erlaubt ist, bevor dads Event auf der Datenbank gelöscht wird. Dieser wird vom Frontend entgegengenommen und in Form einer Fehlermeldung dem User angezeigt, dass die von ihm durchgeführte Aktion nicht möglich ist.

Umgesetzt wird dies durch ein Zusammenspiel aus clientseitigen Guards und serverseitiger Validierung, welche jede Manipulation der Daten prüft.

## Testkonzept

Zur Validierung der Ergebnisse aus der Applikation werden Tests durchgeführt, die sowohl Unit- als auch Integrationstestfälle umfassen. Geprüft werden hierbei die REST-Endpunkte des Backends, die Funktionsweise der React-Komponenten sowie komplette Nutzerflüsse mittels End-to-End-Tests.

### User-Tests

![User-Testfälle](./pictures/test_cases.png)

Als Normalnutzer wurde zunächst versucht, durch direkte Eingabe der URL „/admin/<unterseite>“ auf den Admin-Bereich zuzugreifen (TC01). Das System leitete jedoch konsequent auf die Anmeldeseite um. Anschließend folgte eine Reihe von Löschtests: Beim Versuch, eine Stadt zu entfernen, in der bereits ein Event existiert (TC02), erschien ein Popup mit dem Hinweis, dass das Löschen fehlschlug, weil Städte dieses Landes in einem Stadion verwendet werden. Gleiches geschah beim Löschen einer Venue mit bestehendem Event (TC03); hier meldete das System, die Venue könne nicht entfernt werden, da Tickets für Events existieren. Auch das Löschen eines Landes, in dem Events stattfinden (TC04), wurde mit einem entsprechenden Fehler-Popup verhindert, das erneut auf verwendete Städte verwies.

Der Versuch, einen Nutzer direkt über die Benutzeroberfläche zu löschen, obwohl noch Buchungen für zukünftige Veranstaltungen bestehen (TC05), scheiterte ebenfalls: Unterhalb der Darstellung erschien der Text, das Konto könne nicht gelöscht werden, solange Tickets für noch nicht stattgefundene Events vorhanden sind. Ein Event mit bereits verkauften Tickets zu löschen (TC06) war gar nicht erst vorgesehen – die Option existierte schlicht nicht; dasselbe galt für das Entfernen einer Tour, die Events mit verkauften Tickets enthält (TC07). Artists ließen sich generell nicht löschen (TC08). Beim Versuch, ein Genre zu entfernen, für das bereits Tickets eines Events existieren (TC09), zeigte das System ein Popup, das einen Fehler beim Löschen meldete und als mögliche Ursache eine Tour-Verknüpfung nannte. Identisch verhielt es sich beim Sub-Genre (TC10): Auch hier verhinderte ein Fehlerhinweis das Löschen und verwies auf eine mögliche Verbindung zu einer Tour.

Ein weiterer Test zielte darauf ab, mehr Tickets zu bestellen, als tatsächlich vorhanden waren (TC11). Wurde ein Event mit nur einem Ticket angelegt und der Nutzer versuchte, mehr zu kaufen, graute sich der Kauf-Button bei Erreichen der maximalen Ticketanzahl aus, sodass ein weiterer Erwerb unmöglich war. Interessant war auch der Fall, in dem ein Nutzer sein Konto löschen wollte, obwohl noch ein offener Schwerbehindertenantrag bestand (TC12): Statt den Löschvorgang zu blockieren, entfernte das System den Antrag aus der Liste offener Anträge.

Beim Anlegen eines Events in einer Venue mit Behindertenbereich wurde geprüft, ob sich Sitzplätze – egal ob regulär oder für Schwerbehinderte – komplett weglassen lassen (TC13). Das System erlaubte dies nicht: Kategorien bzw. Sitzplätze müssen einen Wert größer null haben, womit gesetzliche Vorgaben eingehalten werden. Schließlich wurde getestet, ob mehrere Schwerbehindertentickets (etwa Sondertickets oder Gratis-Begleitpersonen) gleichzeitig gekauft werden können (TC14). Auch das war nicht möglich: Der „In den Warenkorb“-Button blieb ausgegraut und ließ sich nicht anklicken.

### Backend-Tests

Die automatisierten Backend-Tests nutzen Jest und prüfen alle API-Routen auf korrekte Antwortcodes sowie auf die Validierung der Eingabedaten. Hierbei wird eine isolierte Testdatenbank verwendet, damit produktive Daten nicht beeinflusst werden.

<a name="next-steps"></a>

## Nächste Schritte
Das Grundgerüst funktioniert lokal stabil: Registrierung, Login, Rollenverwaltung und der Bestellprozess sind lauffähig. Das Projekt ist in Frontend und Backend klar getrennt und setzt auf PostgreSQL als persistente Datenbasis.

Vor einer finalen Bereitstellung sollten noch folgende Punkte bearbeitet werden:

1. **Konfiguration bereinigen** – Secrets in Umgebungsvariablen auslagern und Produktionsbuilds automatisieren.
2. **Security prüfen** – HTTPS erzwingen, CORS-Regeln präzisieren und optionale 2FA vorsehen.
3. **Fehlertoleranz weiter ausbauen** – zentrales Logging und Alerting einrichten.

Bereits sehr gut funktionieren das Rollenmodell, die Bild-Uploads sowie die periodische Datenbereinigung im Backend.

<a name="appendix"></a>
## Anhang: Abhängigkeiten und Versionen

Die folgenden Tabellen listen alle im Projekt genutzten Pakete samt Version auf. Die Angaben stammen aus `package.json`.

### Runtime- und Bibliotheksabhängigkeiten

| Paket | Version |
|-------|---------|
| `@testing-library/dom` | ^10.4.0 |
| `@testing-library/jest-dom` | ^6.6.3 |
| `@testing-library/react` | ^16.3.0 |
| `@testing-library/user-event` | ^13.5.0 |
| `bcrypt` | ^6.0.0 |
| `cors` | ^2.8.5 |
| `express` | ^5.1.0 |
| `express-session` | ^1.18.1 |
| `multer` | ^2.0.0 |
| `next` | ^15.3.2 |
| `nodemon` | ^3.1.10 |
| `opossum` | ^5.0.1 |
| `pg` | ^8.16.0 |
| `prop-types` | ^15.8.1 |
| `react` | ^19.1.0 |
| `react-dom` | ^19.1.0 |
| `react-router-dom` | ^7.6.1 |
| `react-scripts` | ^0.0.0 |
| `react-toastify` | ^11.0.5 |
| `toastify` | ^2.0.1 |
| `uuid` | ^11.1.0 |
| `web-vitals` | ^2.1.4 |

### Entwicklungsabhängigkeiten

| Paket | Version |
|-------|---------|
| `@types/node` | 22.15.21 |
| `@types/react` | 19.1.5 |
| `concurrently` | ^9.1.2 |

Die Anwendung wurde zuletzt mit Node.js v22 getestet. Eine aktuelle Node-Version wird empfohlen, um alle Features von Next.js nutzen zu können.

## FAQ Section

### Wie kann die Architektur beschrieben werden?

- Womit interagiert der Endnutzer
  - Der Endnutzer arbeitet über einen Browser mit dem in Next.js entwickelten Frontend. Von dort werden REST-Aufrufe an das Express-Backend geschickt. Direkten Kontakt zur Datenbank gibt es nicht.
- Womit interagiert der Endnutzer nicht
  - Der Endnutzer hat keinerlei direkte Verbindung zu Server oder Datenbank. Alle technischen Details wie Session-Verwaltung oder Datenbankzugriffe laufen vollständig im Backend ab, ohne dass der Nutzer darauf zugreifen kann.
- Wie sind Applikation und Server verbunden
  - Das Frontend läuft in einem Next.js-Server, der als Client im Browser ausgeführt wird, und kommuniziert per HTTP/REST mit dem Express-Server auf Port 4000. In der `NEXT_PUBLIC_API_URL` wird definiert, unter welcher Adresse die API erreichbar ist.
- Wie sind Server und Daenbank verbunden bzw tauschen Daten aus
  - Der Express-Server nutzt das `pg`-Modul, um über einen Connection-Pool auf die PostgreSQL-Datenbank zuzugreifen. Die Verbindungskonfiguration liest er aus `credentials.json`. Anfragen werden durch einen `opossum`-Circuit-Breaker geleitet, der bei Fehlern den Pool neu aufbaut.
- wie könnte ich eine Grafik mit folgenden Komponenten bauen: Server, Datenbank, Applikation, Sessions, Browser, Endnutzer
  - Ein mögliches Architekturdiagramm zeigt den Browser des Nutzers, der über HTTPS auf das Next.js-Frontend zugreift. Dieses ruft per REST den Express-Server auf, der Sessions in `express-session` verwaltet und über `pg` mit der PostgreSQL-Datenbank spricht. Pfeile zwischen den Komponenten verdeutlichen die Datenflüsse.

### Wie funktionieren Sessions?

- Wo werden wie Sessions verwaltet (bspw. beim Checkout oder Login)?
  - Die Sessions werden serverseitig mit `express-session` gehalten. Beim Login speichert der Server im Session-Objekt die Nutzer-ID und Berechtigungen. Beim Checkout legt er ein Unterobjekt `checkout` an, in dem Versand- und Zahlungsdaten während des Kaufvorgangs liegen.
- Wie sind die Sessions aufgebaut?
  - Jede Session besteht aus einem Cookie mit dem Namen `sid`, das im Browser hinterlegt ist, und einem dazugehörigen Servereintrag im MemoryStore. Dort liegen Attribute wie `userId`, `email`, diverse Rollenrechte sowie das `checkout`-Objekt. Die Daten sind also in einem JS-Objekt strukturiert.
- Welche Daten werden in welcher Session wie lange gespeichert?
  - Die Login-Session speichert Nutzerdaten eine Stunde lang, da die Cookie-Option `maxAge` auf 3600000 Millisekunden steht. Daten des Checkout-Vorgangs werden zusätzlich im `checkout`-Objekt abgelegt und nach 15 Minuten Inaktivität verworfen.
- Wo werden die Daten genau gespeichert die in einer Session sind, macht das der Browser oder wer sonst?
  - Die eigentlichen Sessiondaten liegen ausschließlich im Node.js-Server und werden standardmäßig in dessen Speicher abgelegt. Der Browser hält nur die Session-ID im Cookie. Bei jedem Request sendet er dieses Cookie mit, sodass der Server die zugehörigen Daten finden kann.

### Wie genau werden Bilder gespeichert?

- Wie werden die Bilder von .png bzw .jpeg in ein Format umgewandelt was die Datenbank speichert?
  - Der Server nimmt hochgeladene PNG- oder JPEG-Dateien über `multer` entgegen. Da wir den Speicher auf `memoryStorage` gesetzt haben, liegen sie bereits als Buffer im Arbeitsspeicher. Dieser Binärpuffer wird anschließend direkt in die Spalte `image_data` der Tabelle `images` geschrieben.
- in welcher Form bekommt der Server die Bilddaten und wie werden diese dann in images gespeichert?
  - Durch das Multer-Middleware bekommt `server.js` die hochgeladenen Dateien in `req.file` beziehungsweise `req.files` als Buffer zusammen mit dem MIME-Type. Jeder Upload erhält eine UUID als ID. Anschließend wird `INSERT INTO images (id, image_data, image_type)` ausgeführt, sodass Buffer und Typ persistiert werden.
- wie werden Bilder aus der Datenbank geholt
  - Zum Abruf stellt das Backend die Route `/image/:id` bereit. Dort wird per `SELECT image_data, image_type FROM images WHERE id = $1` das gespeicherte Binary geladen. Danach setzt der Server den Content-Type auf den gespeicherten MIME-Wert und sendet die Daten als HTTP-Response zurück.
- wie erfolgt die Umwandlung vom Format der Datenabank in ein Bild?
  - Im Browser geschieht keine Konvertierung: das Backend liefert das Bild bereits mit korrektem MIME-Type aus. Der Browser interpretiert den Content-Type und stellt das Binary direkt als Bild dar. Es wird also nur übertragen und nicht nochmals transformiert.

### Wie genau funktionieren Hooks?

- Was ist der Sinn von Hooks?
  - React-Hooks ermöglichen es, in Funktionskomponenten zustandsbehaftete Logik und Nebeneffekte zu kapseln. Mit `useState` werden lokale Zustände verwaltet, `useEffect` führt Code bei bestimmten Änderungen aus. Dadurch bleibt der Code schlanker und wiederverwendbar.
- Wie genau werden Hooks in diesem Code genutzt?
  - In den React-Seiten wie `login.jsx` und den Checkout-Komponenten werden `useState` und `useEffect` eingesetzt, um Formularfelder zu steuern und API-Daten zu laden. Beispielsweise speichert `useState` die E-Mail im Login-Formular und `useEffect` ruft Versand- oder Zahlungsoptionen ab.

### Wie funktioniert der Auto-Restart und Circuit Breaker durch Opossum und P2M?

- Was ist der Sinn von den zwei Integrationen?
  - PM2 überwacht den Node-Prozess und startet ihn automatisch neu, falls er abstürzt. Opossum kapselt einzelne Funktionen – hier vor allem Datenbankzugriffe – in einen Circuit Breaker und verhindert, dass wiederholte Fehler das gesamte System lahmlegen.
- Was macht ein Circuit Breaker von Opossum?
  - Der Circuit Breaker überwacht Fehlerraten und Antwortzeiten der gekapselten Funktion. Überschreiten die Fehler ein vordefiniertes Limit, wird der Breaker geöffnet. In dieser Phase werden Anfragen sofort abgelehnt, bis nach Ablauf von `resetTimeout` ein neuer Versuch gestartet wird.
- Wie genau weiß der Circuit Breaker, dass das backend/frontend grade nicht funktioniert ud startet die apps durch?
  - Opossum misst Erfolgs- und Fehlerschwellen beim Ausführen der eingekapselten Funktion, hier etwa eines DB-Queries. Wird die Funktion mehrmals nacheinander mit Fehlern beantwortet oder überschreitet die Antwortzeit das Timeout, geht der Breaker in den offenen Zustand. Dadurch werden weitere Aufrufe blockiert, bis ein Retry ansteht. Ein Neustart der App erfolgt über PM2.
- Wie genau kann p2m oder opossum die apps durchstarten?
  - PM2 führt den Node-Prozess als Daemon aus und überwacht Exit-Codes sowie Speicherverbrauch. Stürzt der Prozess ab oder beendet er sich selbst, startet PM2 automatisch einen neuen Worker. Opossum selbst startet die App nicht neu; es sorgt aber dafür, dass fehlerhafte Funktionen nicht mehr ausgeführt werden, bis sie wieder stabil sind.
- Was sind die zeitintervalle, in denen P2m und Opossum die App überprüfen, ob sie läuft
  - Im Projekt werden keine speziellen PM2-Intervalle definiert, da PM2 permanent den Prozessstatus beobachtet. Der Circuit Breaker führt jedoch alle zehn Sekunden einen Datenbank-Healthcheck durch und öffnet sich fünf Sekunden lang nach jedem Fehler (`resetTimeout`), bevor ein erneuter Verbindungsversuch erfolgt.
- Wie kann die App dennoch abstürzen?
  - Trotz Circuit Breaker und PM2 können unbehandelte Exceptions, Speicherlecks oder Logikfehler im Code zum Absturz führen. Wenn beispielsweise ein API-Endpunkt eine falsche Query ausführt oder Endlosschleifen erzeugt, beendet sich der Prozess. PM2 startet ihn zwar neu, aber der Fehler muss im Quellcode behoben werden.


=======
## Anhang
### Datenbank-Modell
```plantuml
@startuml
!theme plain
top to bottom direction
skinparam linetype ortho

class areas {
   name: varchar(50)
   description: varchar(100)
   disability_category_for: char(3)
   id: uuid
}
class artists {
   name: varchar(255)
   biography: text
   website: varchar(255)
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   artist_image: uuid
   id: uuid
}
class cart_items {
   cart_id: uuid
   event_id: uuid
   event_category_id: uuid
   quantity: integer
   added_at: timestamp with time zone
   is_assistance_ticket: boolean
   id: uuid
}
class carts {
   user_id: uuid
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   id: uuid
}
class checkout_items {
   checkout_id: uuid
   event_category_id: uuid
   quantity: integer
   price: numeric(10,2)
   added_at: timestamp with time zone
   event_id: uuid
   is_assistance_ticket: boolean
   id: uuid
}
class checkouts {
   user_id: uuid
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   id: uuid
}
class cities {
   name: varchar(100)
   country_id: uuid
   id: uuid
}
class countries {
   name: varchar(100)
   iso_code: char(2)
   id: uuid
}
class disability_marks {
   description: varchar(100)
   area_id: uuid
   mark_code: char(3)
}
class event_categories {
   event_id: uuid
   name: text
   price: numeric(10,2)
   disability_support_for: char(3)
   id: uuid
}
class event_supporting_acts {
   event_id: uuid
   artist_id: uuid
}
class event_venue_areas {
   event_id: uuid
   venue_area_id: uuid
   capacity: integer
   category_id: uuid
   id: uuid
}
class events {
   tour_id: uuid
   venue_id: uuid
   description: text
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   start_time: timestamp with time zone
   end_time: timestamp with time zone
   door_time: timestamp with time zone
   id: uuid
}
class genres {
   name: varchar(50)
   id: uuid
}
class images {
   image_data: bytea
   image_type: text
   entity_type: text
   entity_id: uuid
   id: uuid
}
class order_tickets {
   order_id: uuid
   ticket_id: uuid
   id: uuid
}
class orders {
   user_id: uuid
   created_at: timestamp with time zone
   street_address: varchar(255)
   postal_code: varchar(20)
   city: varchar(100)
   country: varchar(100)
   is_paid: boolean
   salutation: varchar(20)
   first_name: varchar(100)
   last_name: varchar(100)
   company: varchar(255)
   payment_option_id: uuid
   id: uuid
}
class payment_options {
   label: varchar(50)
   description: varchar(100)
   icon_src: varchar(50)
   id: uuid
}
class shipping_options {
   label: varchar(100)
   price: numeric
   description: varchar(100)
   id: uuid
}
class subgenres {
   genre_id: uuid
   name: text
   id: uuid
}
class tickets {
   order_id: uuid
   event_category_id: uuid
   seat_number: varchar(50)
   price: numeric(10,2)
   created_at: timestamp with time zone
   is_assistance_ticket: boolean
   id: uuid
}
class tour_artists {
   tour_id: uuid
   artist_id: uuid
}
class tour_genres {
   tour_id: uuid
   genre_id: uuid
}
class tour_subgenres {
   tour_id: uuid
   subgenre_id: uuid
}
class tours {
   title: varchar(255)
   subtitle: varchar(255)
   start_date: date
   end_date: date
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   tour_image: uuid
   id: uuid
}
class user_disability_marks {
   user_id: uuid
   mark_code: char(3)
}
class user_roles {
   name: varchar(50)
   description: varchar(100)
   has_editing_access: boolean
   has_creation_access: boolean
   has_role_appointing_capability: boolean
   has_account_management_access: boolean
   has_disability_approval_access: boolean
   has_deletion_permission: boolean
   id: uuid
}
class users {
   salutation: varchar(20)
   first_name: varchar(100)
   last_name: varchar(100)
   company: varchar(255)
   street_address: varchar(255)
   postal_code: varchar(20)
   city: varchar(100)
   country: varchar(100)
   email: varchar(255)
   phone: varchar(20)
   birth_date: date
   request_for_disability: boolean
   disability_degree: integer
   disability_card_image_front: uuid
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   password: text
   disability_card_image_back: uuid
   is_currently_disabled: boolean
   disability_card_expiry_date: date
   role: uuid
   visible_user_id: integer
   user_id: uuid
}
class venue_areas {
   venue_id: uuid
   max_capacity: integer
   area_id: uuid
   id: uuid
}
class venues {
   name: varchar(255)
   address: varchar(500)
   city_id: uuid
   website: varchar(255)
   created_at: timestamp with time zone
   updated_at: timestamp with time zone
   venue_image: uuid
   id: uuid
}

cart_items             -[#595959,plain]-^  carts                 : "cart_id:id"
cart_items             -[#595959,plain]-^  event_categories      : "event_category_id:id"
cart_items             -[#595959,plain]-^  events                : "event_id:id"
carts                  -[#595959,plain]-^  users                 : "user_id"
checkout_items         -[#595959,plain]-^  checkouts             : "checkout_id:id"
checkout_items         -[#595959,plain]-^  event_categories      : "event_category_id:id"
checkout_items         -[#595959,plain]-^  events                : "event_id:id"
checkouts              -[#595959,plain]-^  users                 : "user_id"
cities                 -[#595959,plain]-^  countries             : "country_id:id"
disability_marks       -[#595959,plain]-^  areas                 : "area_id:id"
event_categories       -[#595959,plain]-^  events                : "event_id:id"
event_supporting_acts  -[#595959,plain]-^  artists               : "artist_id:id"
event_supporting_acts  -[#595959,plain]-^  events                : "event_id:id"
event_venue_areas      -[#595959,plain]-^  event_categories      : "category_id:id"
event_venue_areas      -[#595959,plain]-^  events                : "event_id:id"
event_venue_areas      -[#595959,plain]-^  venue_areas           : "venue_area_id:id"
events                 -[#595959,plain]-^  tours                 : "tour_id:id"
events                 -[#595959,plain]-^  venues                : "venue_id:id"
order_tickets          -[#595959,plain]-^  orders                : "order_id:id"
order_tickets          -[#595959,plain]-^  tickets               : "ticket_id:id"
orders                 -[#595959,plain]-^  payment_options       : "payment_option_id:id"
orders                 -[#595959,plain]-^  users                 : "user_id"
subgenres              -[#595959,plain]-^  genres                : "genre_id:id"
tickets                -[#595959,plain]-^  event_categories      : "event_category_id:id"
tickets                -[#595959,plain]-^  orders                : "order_id:id"
tour_artists           -[#595959,plain]-^  artists               : "artist_id:id"
tour_artists           -[#595959,plain]-^  tours                 : "tour_id:id"
tour_genres            -[#595959,plain]-^  genres                : "genre_id:id"
tour_genres            -[#595959,plain]-^  tours                 : "tour_id:id"
tour_subgenres         -[#595959,plain]-^  subgenres             : "subgenre_id:id"
tour_subgenres         -[#595959,plain]-^  tours                 : "tour_id:id"
user_disability_marks  -[#595959,plain]-^  disability_marks      : "mark_code"
user_disability_marks  -[#595959,plain]-^  users                 : "user_id"
users                  -[#595959,plain]-^  user_roles            : "role:id"
venue_areas            -[#595959,plain]-^  areas                 : "area_id:id"
venue_areas            -[#595959,plain]-^  venues                : "venue_id:id"
venues                 -[#595959,plain]-^  cities                : "city_id:id"
@enduml
```

### Workflows

Die folgenden Aktivitätsdiagramme visualisieren typische Abläufe im System. Sie zeigen jeweils, auf welchen Seiten sich der Nutzer befindet und welche Daten einzugeben sind.

#### Registrierte*n Benutzer*in mit Behinderung anlegen und anmelden

Der Prozess führt vom ersten Aufruf der Loginseite über die Registrierung bis zum erfolgreichen Login. Während der Registrierung kann direkt ein Behindertenausweis hochgeladen und die relevanten Merkzeichen angegeben werden.

![Registrierung / Anmelden](./diagrams/pictures/registration.svg)

#### Ticketkauf als behinderte Person

Nach erfolgreicher Anmeldung navigiert der Nutzende durch die Tour‐ und Eventseiten, fügt Tickets dem Warenkorb hinzu und schließt den Checkout  ab.

![Ticketkauf](./diagrams/pictures/buying_tickets.svg)

#### Nachteilsausgleichsantrag im Profil stellen

Im Profil kann jederzeit ein Antrag gestellt oder aktualisiert werden. Dazu werden Grad der Behinderung, Ausweisbilder und Merkzeichen hinterlegt.

![Nachteilsausgleich stellen](./diagrams/pictures/request_for_disadvantages.svg)

#### Nachteilsausgleichsantrag als Service-Mitarbeiter bearbeiten

Service-User rufen die Übersicht der offenen Anträge auf, prüfen die Angaben und akzeptieren oder lehnen den Antrag ab.

![Nachteilsausgleich akzeptieren](./diagrams/pictures/accept_or_decline_rfd.svg)

#### Rolle eines Nutzers ändern (Admin)

Mit entsprechender Berechtigung können Service-Mitarbeitende die Rolle eines
Accounts anpassen.

![Nutzerrolle anpassen](./diagrams/pictures/change_user_role.svg)

#### Tour samt Event anlegen

Administratoren erstellen zunächst eine Tour und fügen anschließend Events hinzu.

![Tour mit Event erstellen](./diagrams/pictures/create_event.svg)

#### Tour löschen (erfolgreich oder nicht möglich)

Eine Tour lässt sich nur entfernen, wenn für keine ihrer Events bereits Tickets verkauft wurden.

![Tour löschen](./diagrams/pictures/delete_tour.svg)

#### Benutzerkonto löschen

Nutzer können ihr Konto im Profil endgültig entfernen, sofern keine zukünftigen Events mehr besucht werden müssen.

![Account löschen](./diagrams/pictures/delete_account.svg)

#### Abmelden

Der Logout erfolgt über das Dropdown-Menü der Navigationsleiste.

![Logout](./diagrams/pictures/logout.svg)

#### Profildaten aktualisieren

Persönliche Daten wie Adresse oder Telefonnummer lassen sich direkt im Profil
anpassen.

![Profildaten anpassen](./diagrams/pictures/edit_profile_data.svg)