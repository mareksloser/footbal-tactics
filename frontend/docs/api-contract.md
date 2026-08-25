# API kontrakt (PHP backend)

Frontend s backendem mluví přes rozhraní `TacticsApi` (`src/api/types.ts`).
Dokud backend neexistuje, běží aplikace v režimu `VITE_API_MODE=local` proti `localStorage`.
Přepnutím na `http` se použije `src/api/http.ts` a níže popsané endpointy.

Základ: `VITE_API_URL` (výchozí `/api`). Vše je JSON, kódování UTF-8.

## Autentizace

Jedno sdílené heslo pro úpravy. Čtení je veřejné.

| Metoda | Cesta | Tělo | Odpověď |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "password": "…" }` | `{ "token": "…", "expiresAt": "2026-08-19T20:00:00Z" }` |
| POST | `/auth/logout` | `{}` | `204` |

Token se posílá v hlavičce `Authorization: Bearer <token>`.
Zápisové endpointy bez platného tokenu vrací `401`.

**Doporučení pro PHP:** heslo ukládat jako `password_hash()`, token jako náhodných 32 bajtů
(`random_bytes`) uložených v tabulce `sessions` s expirací. Ověřovat `hash_equals()`.

## Složky

| Metoda | Cesta | Tělo | Odpověď |
| --- | --- | --- | --- |
| GET | `/folders` | — | `Folder[]` |
| POST | `/folders` | `{ "name": "…", "parentId": null }` | `Folder` |
| PATCH | `/folders/{id}` | `{ "name"?: "…", "parentId"?: null }` | `Folder` |
| DELETE | `/folders/{id}` | — | `204` |

```jsonc
// Folder
{ "id": "fd_abc", "name": "Standardní situace", "parentId": "fd_obrana" }
```

Server musí odmítnout přesun složky do sebe nebo do vlastního potomka (`409`).
Smazání složky maže i podsložky; taktiky se přesunou do kořene (`folderId: null`).

## Taktiky

| Metoda | Cesta | Tělo | Odpověď |
| --- | --- | --- | --- |
| GET | `/tactics` | — | `TacticSummary[]` |
| GET | `/tactics/{id}` | — | `Tactic` |
| POST | `/tactics` | `Tactic` | `Tactic` |
| PUT | `/tactics/{id}` | `Tactic` | `Tactic` |
| DELETE | `/tactics/{id}` | — | `204` |

`TacticSummary` je odlehčený výpis pro knihovnu:

```jsonc
{
  "id": "t_abc",
  "title": "Zastupování",
  "description": "…",
  "folderId": "fd_obrana",
  "tags": ["U15"],
  "scenarioCount": 7,
  "updatedAt": "2026-08-19T10:00:00Z"
}
```

Plný tvar `Tactic` odpovídá `src/engine/schema.ts` (zod). Klient odpověď validuje,
takže server musí vracet přesně tuto strukturu — jinak se zobrazí chyba.

Server nastavuje `updatedAt` sám; klientskou hodnotu ignoruje.

## Sdílení

| Metoda | Cesta | Tělo | Odpověď |
| --- | --- | --- | --- |
| POST | `/tactics/{id}/share` | `{}` | `{ "token": "…", "url": "https://…/t/{id}?share={token}" }` |
| GET | `/shared/{token}` | — | `Tactic` |

`GET /shared/{token}` je veřejný (bez tokenu v hlavičce) a vrací jen ke čtení.
Token je náhodný řetězec, volitelně s expirací.

Druhá varianta sdílení nepotřebuje backend vůbec: celá taktika se zabalí do adresy
`/share#<base64url>` (`src/features/share/codec.ts`).

## Chyby

```jsonc
{ "error": { "code": "invalid_password", "message": "Nesprávné heslo" } }
```

Používané stavy: `400` neplatná data, `401` chybí/expirovaný token, `404` nenalezeno,
`409` konflikt (např. cyklus ve složkách), `500` chyba serveru.

## Návrh úložiště

Nejjednodušší varianta bez databáze (soubory na disku, viz `api-php/`):

```
storage/
  folders.json
  tactics/{id}.json
  shares.json
  sessions.json
```

Při zápisu použít `flock()` + zápis do dočasného souboru a `rename()`, aby se soubor
nerozbil při souběžném uložení. Pro víc uživatelů je lepší SQLite (`PDO`), schéma:
`folders(id, name, parent_id)`, `tactics(id, folder_id, title, description, data JSON, updated_at)`,
`shares(token, tactic_id, created_at)`, `sessions(token, expires_at)`.
