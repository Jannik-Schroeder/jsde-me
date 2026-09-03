# jsde.me — Neubau als agentische Terminal-Seite

**Datum:** 2026-09-03
**Repo:** `Jannik-Schroeder/jsde-me` (Forgejo `jsde/jsde-me`)
**Status:** freigegeben, in Umsetzung

## Ziel

Die persönliche Seite wird von Grund auf neu gebaut. Das Tailwind-UI-Template fällt komplett weg. Die neue Startseite ist ein Terminal-Fenster, in dem ein Sprachmodell als „AI-Jannik" Fragen über die Person beantwortet und dabei auf die eigenen Artikel verweist. Der Blog bleibt vollständig erhalten.

Die Seite ist **persönlich, nicht geschäftlich**. Für Geschäftliches existiert eine eigene Seite. Der Agent ist kein Vertriebskanal.

**Sprache:** Die gesamte Oberfläche ist Englisch, wie bisher. Der Agent antwortet in der Sprache der Frage.

### Nicht-Ziele

Kein Vektor-Store, kein Retrieval über Artikel-Volltext, kein Tool-Calling, keine Speicherung von Unterhaltungen, kein Kontaktformular im Chat, kein Live-Homelab-Status, keine Bildergalerie.

## Stack

| | vorher | nachher |
|---|---|---|
| Framework | Next.js 14, Pages-freier App Router | Next.js 16 (Turbopack ist Default für `dev` und `build`) |
| React | 18 | 19 |
| Styling | Tailwind 3 + Tailwind-UI-Komponenten | Tailwind 4, eigene Komponenten |
| Highlighting | `@mapbox/rehype-prism` | Shiki zur Buildzeit |
| Node | 21 (Container) | 22 (Next 16 verlangt ≥ 20.9) |
| Container | Einstufig, `npm install --force` auf `node:21-bookworm` | Mehrstufig, `output: 'standalone'`, `node:22-alpine` |

Deploy bleibt unverändert: Woodpecker baut und pusht nach Harbor, trägt den Tag in `infra-stacks` ein, Komodo rollt auf apps01 aus.

## Seitenbestand

| Pfad | Was passiert |
|---|---|
| `/` | Neu: Rail + Terminal. Ersetzt auch die bisherige `/about` |
| `/articles` | Neu gestaltet: dichte Liste nach Jahr, kein Karten-Grid |
| `/articles/<slug>` | 28 Stück, **Slugs und Inhalte unverändert**, nur neues Rendering |
| `/uses` | Bleibt als Pfad. Layout neu, **Inhalt komplett neu** — der bestehende Text ist unverändertes Template-Beispielmaterial (MacBook M3, Keychron, „Figma for the entire company") und beschreibt Jannik nicht |
| `/feed.xml` | Bleibt funktionsfähig |
| `/about` | Entfällt → 308 auf `/` |
| `/gallery` | Entfällt → 308 auf `/`. 20 Bilder werden gelöscht |
| `/speaking` | Entfällt → 308 auf `/` |
| `/thank-you` | Entfällt ersatzlos |

## Startseite

**Revision 03.09. abends (nach Sichtung im Browser):** Die Zwei-Spalten-Form mit Porträt-Rail wurde verworfen — sie wirkte leer und lopsided. Stattdessen:

**Eine zentrierte Spalte** auf etwa 60 % der Fensterbreite (`min(60vw, 1000px)`, mobil volle Breite), vertikal in der Viewport zentriert. Kein Porträt, keine Rail.

Von oben nach unten: eine Kopfzeile mit Name, Headline und den Links (phanes.net, GitHub, LinkedIn, X, Mail, Articles, RSS — kein Instagram); das **Terminal inline** als Hero, kein Popup; darunter der „live today"-Block; unter dem Terminal der KI-Hinweis als Fußzeile. **Keine Artikelliste auf der Startseite** — Artikel findet man über das Terminal (`ls articles`, Antworten des Agents) und über `/articles`.

**Die Startseite scrollt nicht.** Sie füllt genau den Viewport, der Inhalt sitzt aber **mittig mit je ~20 % Luft oben und unten**: das Terminal hat auf dem Desktop eine feste Höhe (`clamp(320px, 42vh, 520px)`) statt sich zu strecken; Kopfzeile darüber, Live-Block darunter, der Block als Ganzes vertikal zentriert. Gescrollt wird ausschließlich im Transcript des Terminals. Nur auf sehr kleinen Viewports (< ~640 px Höhe) darf die Seite scrollen, damit nichts abgeschnitten wird.

Der serverseitig gerenderte Boot-Text (`$ whoami` + Vorstellungstext, `$ ls articles` → „20 posts · newest: …" mit Links auf `/articles` und den neuesten Beitrag) steht **im** Terminal — Crawler sehen ihn dort, Besucher lesen ihn als Begrüßung.

**Das Terminal** hat eine Titelleiste (`● ● ●  jannik@jsde.me — ask-me`), darunter den Verlauf, darunter die Eingabezeile, ganz unten die Statusline.

**Farbe.** Neutral. Text in Zinkweiß auf fast schwarzem Grund, genau eine Akzentfarbe für Prompt-Zeichen, Links und Cursor. Keine farbigen Balken, keine Glows — Status wird über farbige Schrift ausgedrückt.

**Ohne JavaScript** rendert der Terminal-Bereich serverseitig einen statischen Vorstellungstext plus die Artikelliste. Crawler und Besucher mit blockiertem JavaScript sehen echten Inhalt, keine leere Box.

## Der Agent

**Modell:** `gpt-5.6-luna` über die OpenAI Responses API, per SSE gestreamt. Modell-ID kommt aus `OPENAI_MODEL` mit `gpt-5.6-luna` als Vorgabe. Das Muster wird aus `fitness-scpx` übernommen, wo dieselbe API bereits produktiv streamt.

**Kontext**, zusammengesetzt aus zwei Teilen:

1. `src/lib/me.ts` — von Hand gepflegt: Werdegang, Stationen, Homelab, Projekte, Tonfall, Themen die der Agent nicht anfasst.
2. Ein zur Buildzeit erzeugter Artikel-Index: Slug, Titel, Datum, Beschreibung aller Artikel. Wird beim Build aus den MDX-Dateien generiert, nicht von Hand gepflegt.

**Verhaltensregeln im System-Prompt:**

- Antwortet in der Sprache der Frage, standardmäßig Deutsch.
- Erfindet keine Fakten. Was nicht im Kontext steht, wird als unbekannt benannt, mit Verweis auf den echten Jannik.
- Nennt keine internen Hostnamen, IP-Adressen oder Infrastrukturdetails aus dem Homelab, die nicht ohnehin in einem veröffentlichten Artikel stehen.
- Verlinkt passende Artikel als echte `/articles/<slug>`-Pfade.
- Bleibt bei Themen über die Person. Keine allgemeine Programmierhilfe, keine Hausaufgaben.

Unter dem Terminal steht ein kurzer Hinweis, dass hier ein Sprachmodell antwortet und irren kann.

**Eingebaute Befehle (Client, ohne Modell):** `clear`/`cls` leert das Transcript, `help`/`?` listet die Befehle, `whoami` zeigt den Vorstellungstext, `ls`/`ls articles`/`articles` listet alle veröffentlichten Artikel als Links, `contact`/`reach` zeigt E-Mail als `mailto:` und die Profil-Links, `exit`/`quit` antwortet trocken. Alles andere geht als Frage an das Modell. Diese Befehle kosten keine Tokens.

**Links in Antworten:** Nur drei Dinge werden anklickbar — `/articles/<slug>`-Pfade, die E-Mail-Adresse aus `me.email` als `mailto:`, und die exakten URLs aus `me.links`. Jede andere URL im Modelltext bleibt reiner Text, damit ein per Prompt eingeschleuster Link nie klickbar wird. Der System-Prompt weist das Modell an, bei Kontaktfragen genau diese Adresse und URLs unverändert zu nennen.

### Schnittstelle `POST /api/chat`

Anfrage:

```jsonc
{
  "messages": [ { "role": "user" | "assistant", "content": "..." } ]
}
```

Der Server kürzt auf die letzten 6 Nachrichten und begrenzt jede Nachricht auf 1000 Zeichen. Antwort ist ein SSE-Stream mit genau drei Ereignistypen — **Namen bewusst identisch zu `fitness-scpx`**, damit Parser und Fehlerbehandlung dort abgeschrieben werden können:

```
event: token   data: {"text":"..."}      Textstück, beliebig viele
event: done    data: {}                  Ende, genau einmal
event: error   data: {"code":"...","text":"..."}   Ende mit Fehler, genau einmal
```

`text` im `error` ist immer eine fertige, dem Besucher zeigbare Zeile — nie ein roher Fehlertext, nie ein Stacktrace, nie ein Schlüssel.

Fehler kommen **im Stream**, nicht als HTTP-Status: sobald der erste Chunk raus ist, sind die Header längst gesendet. Einzige Ausnahme sind Ablehnungen vor Streambeginn (Validierung, Rate-Limit).

### Bremse

Pro IP 15 Nachrichten pro rollender Stunde. Zusätzlich ein globaler Tagesdeckel aus `CHAT_DAILY_CAP` (Vorgabe 500). Beide Zähler im Prozessspeicher; der Dienst läuft als einzelne Instanz, ein Neustart setzt sie zurück — das ist akzeptiert. Antwortlänge nach oben begrenzt.

Greift eine Grenze, kommt HTTP 429 mit einem `error`-Ereignis im gleichen Format, formuliert im Ton der Seite statt als technische Fehlermeldung.

## Statusline

Eine Zeile am unteren Rand des Terminal-Fensters, tmux-Stil, Symbole statt Wörter, beim Überfahren erscheint die volle Bedeutung:

```
♥ 48  ·  8.412  ·  7h12  ·  ⎇ 14  ·  3h41                    vor 6 min
```

Ruhepuls, Schritte, Schlafdauer, Commits (GitHub und Forgejo addiert), Coding-Zeit aus WakaTime.

**Bewusste Entscheidung:** Ruhepuls und Schlafdauer sind Gesundheitsdaten und werden hier öffentlich und täglich aktualisiert veröffentlicht. Daraus lassen sich Krankheitstage, durchgemachte Nächte und Abwesenheiten ablesen. Der Seitenbetreiber ist darauf hingewiesen worden und hat sich dafür entschieden.

### Schnittstelle `GET /api/status`

```jsonc
{
  "restingHeartRate": 48,      // Schläge pro Minute, oder null
  "steps": 8412,               // heute, oder null
  "sleepMinutes": 432,         // letzte Nacht, oder null
  "commits": 14,               // heute, GitHub + Forgejo, oder null
  "codingMinutes": 221,        // heute, WakaTime, oder null
  "updatedAt": "2026-09-03T09:12:00Z"
}
```

Jeder Wert einzeln nullbar. `null` heißt: Segment wird in der Statusline nicht gezeigt. Die Route antwortet **immer** mit 200 und einem gültigen Objekt, auch wenn jede einzelne Quelle ausfällt. Fehler werden geloggt, nie durchgereicht.

Serverseitig 15 Minuten zwischengespeichert. Alle vier Quellen werden nebenläufig abgefragt, jede mit 3 Sekunden Zeitlimit; wer nicht liefert, wird zu `null`.

Quellen, jede über Umgebungsvariablen konfiguriert und bei fehlender Konfiguration stillschweigend übersprungen:

| Wert | Quelle |
|---|---|
| Puls, Schritte, Schlaf | `GET https://fitness.scpx.de/api/agent/briefing`, Header `Authorization: Bearer <AGENT_TOKEN>` |
| Commits | GitHub REST plus Forgejo REST, addiert |
| Coding-Zeit | WakaTime Summaries |

Der Briefing-Endpunkt existiert bereits und muss **nicht** gebaut werden. Aus seiner Antwort werden genau drei Felder gelesen: `lastNight.restingHr`, `lastNight.sleepMinutes` und aus `trends7d.steps` der Eintrag mit dem heutigen Datum. Alles andere wird verworfen.

Zu beachten: das Token öffnet die gesamte Briefing-Antwort, nicht nur diese drei Zahlen. Es wird ausschließlich serverseitig verwendet und erreicht den Browser nie.

## Artikel

Die 28 MDX-Dateien bleiben inhaltlich unangetastet und behalten ihre Slugs. Neu sind Layout, Typografie und Code-Blöcke.

Der bisherige Lader in `src/lib/articles.ts` findet Artikel über einen dynamischen Glob-Import. Das ist eine Webpack-Eigenheit; unter Turbopack liefert er still eine leere Liste — Blog leer, Feed leer, kein Fehler. Ersatz ist ein zur Buildzeit erzeugter Index (`scripts/generate-articles.mjs` → `src/lib/articles.generated.ts`), den sowohl die Artikelliste als auch der Agent-Kontext lesen.

**Bekanntes Risiko:** Turbopack ist in Next 16 der Standard-Builder und kann importierte Rehype-Plugin-Funktionen nicht durchreichen, `@mapbox/rehype-prism` fällt damit weg. Ersatz ist Shiki zur Buildzeit. Falls das nicht trägt, ist `next build --webpack` der Rückweg — dann aber ohne den schnellen Build, deshalb wird zuerst Shiki versucht.

## Fehlerverhalten

| Fall | Verhalten |
|---|---|
| OpenAI antwortet nicht oder zu langsam | Terminal schreibt eine Absage im Ton der Seite und zeigt die Artikelliste |
| Grenze erreicht | 429, gleiche Formatierung, Ton der Seite |
| Status-Quelle tot | Betroffenes Segment verschwindet, Rest bleibt |
| Kein JavaScript | Statischer Vorstellungstext plus Artikelliste |

Es gibt keine Datenbank und keinen Zustand, der kaputtgehen kann.

## Umgebungsvariablen

| Name | Pflicht | Zweck |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ja | schon vorhanden |
| `OPENAI_API_KEY` | ja | Chat |
| `OPENAI_MODEL` | nein | Vorgabe `gpt-5.6-luna` |
| `CHAT_DAILY_CAP` | nein | Vorgabe 500 |
| `FITNESS_BRIEFING_URL`, `FITNESS_AGENT_TOKEN` | nein | Puls, Schritte, Schlaf |
| `GITHUB_TOKEN`, `GITHUB_USER` | nein | Commits |
| `FORGEJO_URL`, `FORGEJO_TOKEN`, `FORGEJO_USER` | nein | Commits |
| `WAKATIME_API_KEY` | nein | Coding-Zeit |

Fehlt eine optionale Variable, fällt genau ihr Segment weg. Der Chat ist die einzige Funktion, die ohne ihren Schlüssel nicht läuft.

## Offene Punkte

1. **`/uses` braucht echten Inhalt von Jannik.** Der Bestand ist Template-Text. Die Seite wird mit der neuen Struktur und einer klar als vorläufig markierten Liste gebaut; die echten Geräte und Werkzeuge trägt Jannik nach.
2. Die neuen Umgebungsvariablen müssen in `infra-stacks/apps01/jsde-me/docker-compose.yml` eingetragen werden. Anderes Repo, eigener Schritt.
3. ~~Sechs Artikel tragen Veröffentlichungsdaten in der Zukunft.~~ **Entschieden (User):** Artikel mit Datum in der Zukunft sind geplante Beiträge und dürfen vor ihrem Datum nirgends erscheinen — nicht in der Liste, nicht im Feed, nicht auf der Startseite, nicht im Agent-Kontext, und ihre URL antwortet mit 404. Stichtag ist der Berliner Kalendertag. Das `/articles`-Segment wird stündlich neu bewertet (`revalidate = 3600`), damit ein Artikel am Stichtag ohne Deploy erscheint. Der Build-Generator behält alle 28 und seinen Zähl-Guard.

## Abnahme

- `/` zeigt Rail und Terminal, Chat streamt, Statusline erscheint mit den vorhandenen Werten
- Alle 28 Artikel unter unveränderten URLs erreichbar, Code-Blöcke hervorgehoben
- Die Artikelliste enthält tatsächlich 28 Einträge — nicht null, das wäre der stille Turbopack-Fehler
- `/uses` und `/feed.xml` funktionieren
- `/about`, `/gallery`, `/speaking` leiten auf `/` um
- Ohne JavaScript ist die Startseite lesbar
- `npm run build` läuft mit Turbopack durch
- Typecheck und Lint sauber
- Kein Rest des Tailwind-UI-Templates mehr im Baum
