# Informacje o grze i integracji API

Ten katalog zachowuje notatki kontraktowe przydatne przy implementowaniu przyszłych funkcji. Aplikacja nie zawiera obecnie stron ani logiki domenowej korzystającej z tych endpointów.

## Planowana integracja podróży

| Krok | Żądanie                               | Działanie                      |
| ---- | ------------------------------------- | ------------------------------ |
| 1    | `POST /api/characters`                | Utworzenie postaci             |
| 2    | `GET /api/characters/{id}`            | Pobranie postaci               |
| 3    | `GET /api/areas`                      | Pobranie listy lokacji         |
| 4    | `PATCH /api/characters/{id}/location` | Ustawienie początkowej lokacji |
| 5    | `GET /api/areas/{id}/available-paths` | Pobranie dostępnych przejść    |
| 6    | `GET /api/travels/estimation`         | Estymacja podróży              |
| 7    | `POST /api/travels`                   | Rejestracja podróży            |
| 8    | `GET /api/travels/{id}`               | Pobranie szczegółów podróży    |

Backend definiuje `CharacterLocationType.Area = 0` oraz `CharacterLocationType.Path = 1`. Wartości enumów i stan oznaczeń `deprecated` zależą od dokumentu OpenAPI, z którego NSwag generuje klienta.

## NSwag

Profil generatora znajduje się w [`src/app/core/api/api-client.nswag`](../../src/app/core/api/api-client.nswag), a wygenerowany klient w [`src/app/core/api/api-client.ts`](../../src/app/core/api/api-client.ts). Nie modyfikuj ręcznie pliku wynikowego; zmieniaj profil lub źródło OpenAPI i generuj klienta ponownie.

Wygenerowane typy będą odzwierciedlały dokument OpenAPI. Atrybut `[Obsolete]` w kodzie C# nie oznacza automatycznie `deprecated: true` w specyfikacji. Aby NSwag oznaczył operację jako przestarzałą, metadane OpenAPI muszą zawierać to oznaczenie.

## Mapa świata

Oryginalna mapa projektu jest zachowana w `public/assets/` jako zasób do wykorzystania przez przyszłą funkcję świata. API nie zwraca współrzędnych lokacji, więc powiązanie lokacji z mapą wymaga osobnego ustalenia danych.
