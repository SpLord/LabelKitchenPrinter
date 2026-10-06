# Katzenzimmer – Design

Stand 2026-10-06. Mit dem Nutzer Schritt für Schritt entschieden; Entwürfe in
`katzenzimmer/` (stil.png, zimmer.png, effekte.png).

## Warum

Das Spiel ist in drei Schichten gewachsen (alte Gimmicks mit Freischalt-
schwellen und Effekt-Feuerwerk, Tamagotchi-Schicht, Laden), die nie
zusammengeführt wurden. Und Katze und Etikettendrucker teilen sich dieselbe
Fläche: die Katze verschluckte Tipps auf Etikettenknöpfe (gemessen, 2 von 2).

Gemessene Fehler der Analyse: Zufriedenheit sank nie (Timer wurde jede Minute
neu gestartet), Sackgasse auf neuen Geräten (Füttern erst ab 50 Münzen
Höchststand), Münzwirtschaft ohne Grenzen (Leckerli-Regen ~100× Häufchen),
Fellwechsel alle 3 h durch alle Felle entwertet jeden Kauf.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Wo lebt die Katze? | **Katzenzimmer** im Vollbild. Küche zeigt nur eine Karte. |
| Gekauftes | **Sichtbare Möbel auf Stellplätzen**, die Katze benutzt sie selbst (Klo, Brunnen, Kratzbaum, Höhle, Futterautomat). Umstellen per Tipp, kein Ziehen. |
| Zeichenstil | **A – Comic mit Kontur** (heutige Katze), dazu weiche Bodenschatten. Kein Emoji als Grafik. |
| Münzen | **Mischung**: tägliches Geschenk (Pflege + Herzen), Versorgen mit Tageslimit, Leckerli-Regen 1×/h, Hütchenspiel. |
| Alte Gimmicks | Bleiben: Laser, Spielzeug, Leckerli-Regen. Weg: x2, Magnet, Coin-Shower, Effekt-Feuerwerk an Münzschwellen. |
| Bauweise | **SVG-Szene + testbare Verhaltenslogik**, Laufen über CSS-Übergänge (Grafikkarte), nicht React pro Bild. |
| Vorgehen | **Sofort sichtbar**: hinter `?zimmer` in der echten App; die Küche ohne Schalter bleibt unverändert, bis umgeschaltet wird. |

## Aufbau

- **Küche**: eine Karte oben rechts – Katze, Name, was ihr fehlt, Münzen;
  blauer Punkt = braucht etwas. Tipp öffnet das Zimmer. Nichts liegt über
  den Etikettenknöpfen.
- **Zimmer**: oben Zurück, drei Ringe (Hunger, Durst, Laune), Name + Phase +
  Herzen, Münzen. Mitte die Wohnung mit Stellplätzen (Boden, Wand). Unten fünf
  Bereiche: Füttern, Spielen, Laden, Kleiderschrank, Einrichten – jeder öffnet
  dasselbe Blatt von unten. Gelber Knopf mit Münze = kostet so viel.

## Spielregeln

- Hunger/Durst −1,2 %/h (unverändert), **Laune −2 %/h** (vorher 6 %, die nie
  wirkten). Nachts halb.
- **Füttern füllt den Napf**, nicht direkt den Hunger; die Katze frisst, wenn
  sie Hunger hat. Futterautomat füllt morgens halb.
- **Klo** füllt sich mit jedem Gang; voll oder nicht vorhanden → Häufchen auf
  dem Boden, drückt die Laune.
- Verhalten, Rangfolge: krank → Nacht/schlafen → Durst → Hunger → muss mal →
  sonst (Fenster, Kratzbaum, Ball, putzen, Nickerchen).
- Kein zufälliger Fellwechsel mehr.
- Münzen: Geschenk 10 + bis 20 (Pflege Vortag) + 4/Herz, ab 5 Uhr; Klo leeren 3,
  Häufchen 2 (zusammen ≤ 30/Tag); Leckerli-Regen ≤ 10, 1×/h; Hütchenspiel wie
  bisher. Realistisch 50–100/Tag.
- Laden: Möbel günstig (Klo 150, Brunnen 400, Kratzbaum 600, Futterautomat 700,
  Höhle 900, Kleinkram ab 150); Felle/Zubehör bleiben Langzeitziele.
  Glückspfote: Geschenk +25 %.
- Ein Fortschrittssystem: keine Freischaltschwellen; Herzen vergrößern das
  Geschenk und schalten je ein Verhalten frei (kommt angelaufen, rollt sich,
  2 Geschenke/Tag, Sonnenbad am Fenster, seltene Fundstücke).
- Freundschaft mit Tageslimit (Streicheln 3, Spielen 2, Füttern 2, Tag 5).
- Keine Sackgasse: Wasser immer frei, Notration 1×/Tag, Krankheit heilt bei
  12 h gutem Zustand von selbst; Medizin beschleunigt.
- Bestand bleibt: Münzen, Gekauftes; Krone wird anlegbares Zubehör.

## Posen und Effekte

Posen statt Graufilter: schläft, trinkt, frisst, krank, spielt, glücklich.
Effekte mit Bedeutung: Münzen fliegen zur Anzeige, Herzchen beim Streicheln,
Plopp-Ring bei neuem Möbel, neues Herz mit Freischalt-Hinweis.

## Neue Ideen (in späteren Etappen)

Tageszeiten nach echter Uhr (Fenster, Lampe), Besuch am Fenster (Vögel,
Schmetterlinge), Fundstücke-Album.

## Etappen – jede sofort unter `?zimmer` sichtbar

1. **Gerüst**: Küchenkarte, Zimmer mit Möbeln aus dem Bestand, Katze läuft
   bedürfnisgesteuert, Ringe/Herzen/Münzen live, Füttern füllt den Napf.
2. Posen (schläft, trinkt, frisst, krank …) und Laufbild.
3. Klo und Häufchen, Versorgen-Belohnungen, tägliches Geschenk, neue Wirtschaft.
4. Laden, Kleiderschrank, Einrichten (Stellplätze) im einheitlichen Blatt.
5. Spielen: Laser, Ball, Leckerli-Regen, Hütchenspiel mit echten Bechern.
6. Effekte, Herzen-Freischaltungen.
7. Tageszeiten, Fensterbesuch, Fundstücke.
8. Umschalten: Zimmer wird Standard, Altlasten (CatSprite, Freischaltschwellen)
   werden entfernt.

## Technik

- `src/zimmer/`: Szene (SVG, Ebenen), Möbel als Komponenten, Stellplätze und
  Verhalten als reine Funktionen (node:test), Zustand über die vorhandenen
  Hooks (useCatNeeds, useCatCoins, useKatzenladen, useWachstum).
- Zimmer wird nur bei `?zimmer` nachgeladen (eigener Chunk).
- Mit `?zimmer` läuft die alte Katze NICHT – beide würden sonst dieselben
  Werte gleichzeitig verfallen lassen.
- Bewegung per CSS-Übergang auf `transform`, Dauer aus der Wegstrecke.
- E2E: ohne Schalter unverändert; mit Schalter Karte, Zimmer, Füttern.
