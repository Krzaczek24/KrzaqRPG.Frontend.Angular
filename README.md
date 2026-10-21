# Kraina Legend — frontend

Pusty szkielet aplikacji Angular przygotowany pod rozwój frontendu gry. Nie zawiera przykładowych stron, funkcji ani serwisów domenowych. Zachowuje wygenerowanego klienta API i konfigurację połączenia z backendem.

## Struktura

```text
src/app/
├── core/
│   ├── api/                 # Wygenerowany klient API i konfiguracja DI
│   └── services/            # Wspólne serwisy aplikacji
├── features/                # Funkcje gry; każda otrzymuje własne katalogi
├── app.config.ts
├── app.routes.ts            # Puste miejsce na routing stron
└── app.component.ts         # Główny komponent z router-outlet
```

Nowe funkcje dodawaj w `src/app/features/<nazwa>/`, np. `pages/` dla stron, `services/` dla logiki funkcji oraz `data-access/` dla komunikacji z API. Wspólny kod aplikacji umieszczaj w `src/app/core/`.

## Klient API

Wygenerowany przez NSwag klient znajduje się w `src/app/core/api/api-client.ts`, a jego profil w `src/app/core/api/api-client.nswag`. Nie edytuj ręcznie wygenerowanego pliku klienta. `provideApiClient` rejestruje klienta i token `API_BASE_URL`.

Adres API jest ustawiany w `src/environments/`: development kieruje do `http://127.0.0.1:5000`, a produkcja do `https://api.krzaqrpg.bieda.it`. Lokalny backend musi zezwalać w CORS na origin frontendu (domyślnie `http://127.0.0.1:4200`).

## Uruchomienie

Wymagane: Node.js i npm.

```bash
npm install
npm start
```

Serwer deweloperski domyślnie działa pod `http://127.0.0.1:4200/`.

## Walidacja

```bash
npm test
npm run build
```
