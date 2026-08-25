# Taktická tabule

Webová aplikace pro tvorbu, přehrávání a sdílení fotbalových taktických animací.
Trenér rozestaví hráče, po fázích s nimi pohybuje a výsledek přehraje jako plynulou
animaci — nebo pošle odkazem do týmové skupiny.

Vzniklo z jednosouborových HTML animací; engine zůstal stejný, jen je vytažený do
testovatelných modulů a doplněný o editor, knihovnu se složkami a sdílení.

- **Frontend** — React 19 + TypeScript, Vite, TanStack Router/Query, Tailwind 4, zod
- **Backend** — PHP 8.2+, bez frameworku, repository pattern nad JSON soubory nebo PDO

---

## Struktura repozitáře

```
.
├── frontend/          React aplikace (viz frontend/README.md)
├── backend/           PHP API
└── package.json       zkratky pro obojí
```

Kořenový `package.json` jen deleguje do `frontend/`:

```bash
pnpm dev          # dev server na http://localhost:5175
pnpm build        # produkční build frontendu
pnpm lint
pnpm be:install   # composer install v backend/ (bez dev závislostí)
```

---

## Rychlý start

### Bez backendu

Aplikace umí běžet čistě v prohlížeči — data v `localStorage`, knihovna se naplní
dvěma připravenými taktikami. Na vyzkoušení a na vývoj enginu to stačí.

```bash
cd frontend
pnpm install
cp .env.example .env      # VITE_API_MODE=local
pnpm dev
```

Heslo pro úpravy je v tomto režimu v `.env` (`VITE_EDIT_PASSWORD`, výchozí `trener`).

### S backendem

```bash
cd backend
composer install
cp .env.example .env
```

Vygeneruj si hash hesla a vlož ho do `.env` **v jednoduchých uvozovkách** — hash
obsahuje `$` a bez uvozovek ho dotenv zkomolí:

```bash
php -r "echo password_hash('tvoje-heslo', PASSWORD_BCRYPT, ['cost' => 12]), PHP_EOL;"
```

```dotenv
APP_DEBUG=false
STORAGE_DIR=storage
ERROR_LOG=tmp/error/php-error.log
AUTH_PASSWORD_HASH='$2y$12$...'
CORS_ORIGINS=http://localhost:5175
```

Adresář ze `STORAGE_DIR` musí být zapisovatelný pro web server — zakládají se v něm
`sessions.json`, `shares.json`, `folders.json` a `tactics/{id}.json`.

Ve frontendu pak přepni režim:

```dotenv
VITE_API_MODE=http
VITE_API_URL=/api
```

Dev server proxuje `/api` na backend (`vite.config.ts`, cíl v `VITE_API_PROXY_TARGET`).
Na produkci proxy neexistuje — `VITE_API_URL` musí mířit na plnou adresu API.

---

## Architektura

### Frontend

```
src/
  engine/          jádro animací, bez Reactu a plně testovatelné
    types.ts       datový model
    geometry.ts    převod souřadnic hřiště <-> plátno
    interpolate.ts skládání delta-snímků a výpočet scény
    playback.ts    časová osa přehrávání
    renderer.ts    kreslení na canvas
    schema.ts      zod validace (API, import, sdílený odkaz)
  features/
    player/        přehrávač
    builder/       editor (draft reducer, editovatelné hřiště, inspector)
    library/       knihovna se stromem složek
    auth/          heslo pro úpravy
    share/         sdílení odkazem
  api/             kontrakt úložiště + local a http implementace
  routes/          obrazovky
  data/seed/       výchozí obsah knihovny (JSON)
```

Úložiště je schované za jediným rozhraním `TacticsApi` (`src/api/types.ts`). Existují
dvě implementace — `local.ts` nad `localStorage` (používá se i v testech) a `http.ts`
proti PHP API. Aplikace mezi nimi nerozlišuje.

### Backend

```
backend/
├── public/
│   ├── index.php             front controller
│   └── .htaccess             rewrite na front controller
├── src/
│   ├── Config/Env.php        čtení a typování proměnných prostředí
│   ├── Middleware/Cors.php   CORS hlavičky + preflight
│   ├── Controller/           Auth, Folder, Tactic
│   ├── Repository/
│   │   ├── Contract/         rozhraní adaptérů
│   │   ├── Json/             souborové úložiště
│   │   └── Pdo/              MySQL / SQLite
│   ├── Exception/ApiException.php
│   └── Router.php
└── storage/                  data (mimo git)
```

Bez frameworku a bez ORM. Vše je `declare(strict_types=1)`, `readonly` třídy
a promované konstruktory. Přepnutí úložiště je jedna změna v `public/index.php`:

```php
$pdo = new PDO(Env::get('DB_DSN'), Env::get('DB_USER'), Env::get('DB_PASSWORD'));
$tacticRepo = new \App\Repository\Pdo\PdoTacticRepository($pdo);
```

---

## Datový model

```
Tactic → Scenario[] → Frame[]
```

- **Tactic** — název, složka, soupiska hráčů (`PlayerDef[]`), štítky
- **Scenario** — jedna situace (záložka v přehrávači) s trenérskými body
- **Frame** — jedna fáze: text, změny pozic, míč, oblouk přihrávky, zóna, zvýraznění, časování

Souřadnice jsou v jednotkách hřiště 0–100 (x = šířka, y = délka), `y = 0` je horní branka.

### Delta-snímky

Snímek si drží **jen změny** pozic oproti předchozímu. Autorská práce je pak rychlá —
v každé fázi hýbeš jen s hráči, kteří se opravdu pohnou — a engine z toho složí plné
pozice funkcí `resolveFrames`. První snímek musí obsahovat všechny hráče.

Editor to musí respektovat i při mazání a přeskládání fází, proto na to existují testy
v `src/features/builder/draft.test.ts`.

> **Pozor u backendu:** snímek bez pohybu má `positions: {}`. PHP při `json_decode($x, true)`
> udělá z prázdného objektu prázdné pole a při zpětném `json_encode` z něj vyleze `[]` —
> zod na klientovi to odmítne. Proto se tělo požadavku i uložená data dekódují **jako
> `stdClass`**, ne jako asociativní pole.

---

## API

Základ `/api`, vše JSON v UTF-8. Čtení je veřejné, zápis vyžaduje
`Authorization: Bearer <token>`.

| Metoda | Endpoint | Auth | Popis |
| --- | --- | :---: | --- |
| `POST` | `/api/auth/login` | ne | Ověří heslo, vrátí token a expiraci |
| `POST` | `/api/auth/logout` | ne | Ukončí relaci |
| `GET` | `/api/folders` | ne | Seznam složek |
| `POST` | `/api/folders` | **ano** | Nová složka |
| `PATCH` | `/api/folders/{id}` | **ano** | Přejmenování nebo přesun |
| `DELETE` | `/api/folders/{id}` | **ano** | Smazání složky |
| `GET` | `/api/tactics` | ne | Odlehčený výpis pro knihovnu |
| `GET` | `/api/tactics/{id}` | ne | Plná taktika |
| `POST` | `/api/tactics` | **ano** | Nová taktika |
| `PUT` | `/api/tactics/{id}` | **ano** | Úprava taktiky |
| `DELETE` | `/api/tactics/{id}` | **ano** | Smazání taktiky |
| `POST` | `/api/tactics/{id}/share` | **ano** | Vytvoření sdíleného odkazu |
| `GET` | `/api/shared/{token}` | ne | Čtení sdílené taktiky |

Chybová odpověď:

```jsonc
{ "error": { "code": "invalid_password", "message": "Nesprávné heslo" } }
```

Stavy: `400` neplatná data, `401` chybí nebo vypršel token, `404` nenalezeno,
`409` konflikt, `500` chyba serveru.

Klient odpovědi validuje přes zod (`src/engine/schema.ts`), takže server musí vracet
přesně očekávanou strukturu. Podrobný kontrakt: [`frontend/docs/api-contract.md`](frontend/docs/api-contract.md).

---

## Ovládání editoru

- **Posun** — tažením přesuneš hráče; pozice se uloží jen do aktuální fáze
- **Míč** — klik na hráče (míč u nohy) nebo na volné místo (pevný bod)
- **Zóna** — tažením nakreslíš zvýrazněný obdélník, popisek se doplní v panelu
- Fáze se přidávají, duplikují, přesouvají a mažou v liště pod hřištěm
- Import/export JSON umožní taktiku přenést nebo verzovat v gitu

Klientská zábrana `RequireEditor` je **jen UX** — práva musí vynutit backend.

---

## Sdílení

1. **Odkaz z knihovny** — `POST /tactics/{id}/share` vytvoří token, výsledek je
   `/t/{id}?share={token}` a vždy ukazuje aktuální verzi.
2. **Odkaz s daty** — celá taktika zabalená v `/share#<base64url>`
   (`src/features/share/codec.ts`). Funguje bez serveru i bez přihlášení,
   hodí se na poslání do skupiny.

---

## Testy

```bash
cd frontend
pnpm test         # vitest
pnpm test:watch
pnpm typecheck
```

Testy pokrývají engine (interpolace, přehrávání), draft reducer editoru, strom složek,
codec sdílení a seed data.

---

## Import starých animací

```bash
cd frontend
node scripts/legacy-import.mjs stara-animace.html src/data/seed/nova.json "Název" "Popis"
```

Skript vytáhne pole `SCEN` z původního HTML a přemapuje ho na `Tactic`. Takhle vznikly
obě výchozí taktiky v knihovně.

---

## Licence

MIT