# jsde.me als persönlicher Homelab-Guide

## Was Besucher hier machen können

Der erste Besuch führt von Janniks eigenem Rack ins Inventar oder in einen seiner Erfahrungsberichte. Wer wegen seiner Arbeit hier ist, kommt vom Einstieg direkt zum Lebenslauf. Wiederkehrende Besucher finden die neueste Veröffentlichung an derselben Stelle und können eine Runde Patch Panel spielen. Englisch bleibt die Sprache der Website und des Artikelarchivs.

## Referenz und Übertragung

Die Untersuchung vom 23. November 2026 umfasst die Startseite, die öffentlichen Seitentypen aus den Sitemaps und die verlinkten Werkzeuge. Die Gestaltung verwendet Janniks eigene Fotos, eine eigens gezeichnete Rack-Illustration und die lokal eingebundenen Schriftfamilien der Referenz.

| Beobachtung auf OhnyFans | Entscheidung für jsde.me |
| --- | --- |
| Die Startseite stellt eine Frage in übergroßer Pixelschrift. Die kurze Antwort, eine Akzentfarbe und zwei Aktionen bestimmen den ersten Blick. | „Is Jannik Schröder awake now?“ bekommt eine spielerische Antwort nach Paderborner Ortszeit. Zwei Links führen zu Artikeln und beruflichen Stationen. Im Rack-Archiv steht die Gesamtansicht vom November 2026 vor den drei älteren Fotos. |
| Live-Status, Stream-Historie, Chat und Zeit seit der letzten Übertragung geben dem Besuch zeitlichen Kontext. | Eine Paderborner Uhr, die tatsächlichen Publikationstage der letzten vier Wochen und ein laufendes Artikelband stehen unter dem Einstieg. Der vorhandene Tagesstatus zeigt nur gelieferte Werte. Historische Rack-Fotos tragen ihr Datum. |
| Die Ohne-pedia erschließt kurze Einträge durch Suche und Tiefenfilter. | Field Notes verbindet Volltextsuche in Titel und Beschreibung mit Themenfiltern. Jahresgruppen, Direktlinks und RSS bedienen Leser, die chronologisch stöbern. |
| Die Toolbox stellt die Handlung jedes Spiels vor. Skindle hat einen Tagesrhythmus, Higher or Lower eine Folge kurzer Entscheidungen, das Quiz ein Ergebnis. | Patch Panel hat drei überschaubare Runden mit Diensten und Ports. Fehler und Hinweise erklären die Zuordnung. Die persönliche Bestleistung bleibt im Browser. |
| Tracker, Clip-Roulette, Chat-Meter und Soundboard schöpfen aus Streams und Community-Beiträgen. | Der interaktive Teil schöpft aus Janniks Fachgebiet. Der bestehende Terminal-Assistent beantwortet persönliche Fragen, das Rack-Archiv lässt sich durchblättern. |
| Lore-Timeline, Vault und Profil geben einzelnen Ereignissen und Bildern einen eigenen Platz. | Die Karriere-Timeline macht Ausbildung, Beschäftigung, Mitgründung und Selbstständigkeit zeitlich lesbar. Gear verweist auf datierte Berichte und unterscheidet frühere Ausbaustufen. |
| FAQ, Profile und Footer bündeln häufige Fragen, Quellen und Kontaktwege. | Profil, Projektlinks, Terminal, RSS, Kontakt, Impressum und Datenschutz bleiben direkt erreichbar. |

Referenzseiten: [Startseite und Lore](https://ohnyfans.com/), [Ohne-pedia](https://ohnyfans.com/ohne-pedia/), [Toolbox](https://ohnyfans.com/tools/), [Vault](https://ohnyfans.com/vault/), [Profil](https://ohnyfans.com/ohnepixel/) und [FAQ](https://ohnyfans.com/faq/).

## Visueller Abgleich in Playwright

Am 23. November 2026 wurden bei 1440 und 390 Pixeln Breite das Menü, die Suche, der Gold-Filter, der Einstieg in Skindle und die Timeline der öffentlichen Referenz bedient und aufgezeichnet. Bei 1440 Pixeln beginnt die Frage bei x=40 und y=101. Die 95 Pixel große Schrift hat eine Zeilenhöhe von 0,9. Die rote Antwort beginnt bei y=358 mit einer Schriftgröße von 245 Pixeln. Gemessen wurden Geist Pixel Square, DM Sans und Silkscreen. Zwei horizontal versetzte Konturen geben der Überschrift ihr kräftiges Pixelbild.

Die Startseite von jsde.me übernimmt diese Maße, den hellen Grund, den Wechsel zum dunklen Werkzeugbereich, die beim Abwärtsscrollen ausweichende Kopfzeile und die Bewegung der Timeline. Das Menü klappt auf kleinen Bildschirmen unter der Kopfzeile auf. Besucher können den Ticker anhalten oder das Rack per Tastatur bedienen. Auf dem Desktop bewegt vertikales Scrollen die Karrierestationen seitwärts. Mobil, bei geringer Fensterhöhe und bei reduzierter Bewegung stehen die Stationen untereinander. Die Uhr verwendet Europe/Berlin.

## Arbeitspakete und Abnahme

| Verantwortung | Lieferung | Prüfkriterium |
| --- | --- | --- |
| PM und Integration | Startseite, Bildbetrachter, Navigation, Footer, Terminal-Route, Typografie und lokale Schriftdateien | Alle Bereiche sind mobil erreichbar. Bildwechsel funktioniert per Tastatur. API, RSS, Datenschutzhinweise und Ereignisse für bestehende Kontaktlinks bleiben erhalten. |
| Sol · Archiv | Chronologischer Artikelindex mit Suche und Themen, lesbare Detailansicht | Artikel sind ohne JavaScript verlinkt. Suche, Themenkombination und Zurücksetzen funktionieren. Zukünftige Artikel bleiben bis zum Berliner Veröffentlichungstag verborgen. |
| Sol · Gear und Profil | Belegte Hardware, Software, Zeitachse, Projekte und Kontakt | Einträge haben eine öffentliche Grundlage. Historische Geräte bleiben datiert. Berufliche Überschneidungen und Selbstständigkeit sind sichtbar. |
| Sol · Spiel | Patch Panel mit neun Zuordnungen, Hilfen, Wiederholung und lokaler Bestleistung | Alle Runden funktionieren mit Maus, Touch und Tastatur. Das Spiel funktioniert auch bei gesperrtem Browserspeicher. |
| PM und Release | Browserabnahme, Produktionsbuild, Publikationstest, Rollout im bestehenden jsde.me-Stack | Releasebild und laufende Version stimmen überein. Die öffentliche Domain liefert das neue Design und die bestehenden Artikel aus. |
