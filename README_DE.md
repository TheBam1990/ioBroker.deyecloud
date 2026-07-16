# ioBroker DeyeCloud Adapter

Dieser Adapter verbindet ioBroker mit der offiziellen DeyeCloud OpenAPI. Er findet Anlagen und die zugehörigen Geräte, fragt die aktuellen Cloud-Werte in einem einstellbaren Intervall ab und legt die passenden ioBroker-Objekte automatisch an.

Die erste Version arbeitet bewusst nur lesend und sendet keine Steuerbefehle an den Wechselrichter.

## Voraussetzungen

- ioBroker js-controller ab Version 6.0.11
- Node.js ab Version 22
- DeyeCloud-Konto mit zugeordnetem Wechselrichter oder Datenlogger
- DeyeCloud-OpenAPI-Anwendung mit App ID und App Secret

## App ID und App Secret erhalten

1. Öffne das [offizielle DeyeCloud Developer Portal](https://developer.deyecloud.com/).
2. Melde dich mit deinem DeyeCloud-Konto an oder registriere ein Entwicklerkonto.
3. Wähle das Rechenzentrum deines DeyeCloud-Kontos. Für Deutschland und andere europäische Länder ist normalerweise **Europe** richtig.
4. Öffne **Applications** und wähle **Create Application**.
5. Erstelle eine Anwendung, beispielsweise mit dem Namen `ioBroker`.
6. Übertrage die vergebene **AppId** und das **AppSecret** in die Adapterkonfiguration.

Das App Secret muss wie ein Passwort behandelt werden. Veröffentliche es nicht in Bildschirmfotos, Issues oder Protokollen.

## Konfiguration

| Einstellung | Beschreibung |
| --- | --- |
| Rechenzentrum | Europe, Americas oder India; muss zur Kontoregistrierung passen. |
| OpenAPI App ID | AppId der im Entwicklerportal erstellten Anwendung. |
| OpenAPI App Secret | AppSecret dieser Anwendung; wird von ioBroker verschlüsselt gespeichert. |
| Anmeldeart | E-Mail, Benutzername oder Mobilnummer. |
| DeyeCloud-Konto | Wert passend zur ausgewählten Anmeldeart. |
| Ländervorwahl | Nur bei Mobilnummer erforderlich, ohne `+`, beispielsweise `49`. |
| DeyeCloud-Passwort | Passwort des normalen DeyeCloud-Kontos; wird verschlüsselt gespeichert. |
| Unternehmens-ID | Optional für Geschäftskonten; bei einem persönlichen Konto leer lassen. |
| Abfrageintervall | Cloud-Abfrageintervall in Sekunden, mindestens 60 Sekunden. |

## Objekte

- `info.connection`: Erfolg der letzten Cloud-Abfrage
- `info.lastUpdate`: Zeitpunkt der letzten erfolgreichen Aktualisierung
- `info.lastError`: letzter Anmelde- oder API-Fehler
- `stations.<id>.info`: Anlagendaten
- `stations.<id>.latest`: aktuelle Anlagenwerte
- `devices.<seriennummer>.info`: Gerätedaten
- `devices.<seriennummer>.latest`: aktuelle Gerätemesswerte

Die verfügbaren Messpunkte hängen vom Wechselrichtermodell und den von DeyeCloud gelieferten Daten ab. Neue Felder legt der Adapter automatisch an, ohne vorhandene Verlaufsdaten zu löschen.

## Fehlerbehebung

- Das Rechenzentrum muss dem bei der DeyeCloud-Registrierung gewählten Rechenzentrum entsprechen.
- AppId und AppSecret im Entwicklerportal kontrollieren.
- Die richtige Anmeldeart für das Konto auswählen.
- Bei Mobilnummer die Ländervorwahl ohne Pluszeichen eintragen.
- Cloud-Werte können gegenüber lokalen Wechselrichterdaten verzögert sein.

## Änderungsverlauf

### 0.1.0

- Erste ausschließlich lesende Integration der offiziellen DeyeCloud OpenAPI.
- Anlagen- und Geräteerkennung mit dynamischen Objekten für aktuelle Werte.

## Lizenz

MIT License, Copyright (c) 2026 TheBam
