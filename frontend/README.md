# Taktická tabule

React aplikace pro tvorbu a přehrávání fotbalových taktických animací.
Vznikla z jednosouborových HTML animací — engine je stejný, jen je vytažený
do testovatelných modulů a doplněný o builder, knihovnu a sdílení.

## Rychlý start

```bash
pnpm install
cp .env.example .env
pnpm dev          # http://localhost:5175
```

Bez backendu běží aplikace v režimu `VITE_API_MODE=local` (data v `localStorage`,
knihovna se naplní dvěma připravenými taktikami). Heslo pro úpravy je v `.env`
(`VITE_EDIT_PASSWORD`, výchozí `trener`).

```bash
pnpm test         # vitest
pnpm typecheck
pnpm build
```

## Struktura

```
src/
  engine/          jádro animací (bez Reactu, plně testovatelné)
    types.ts       datový model
    geometry.ts    převod souřadnic hřiště <-> plátno
    interpolate.ts skládání delta-snímků a výpočet scény
    playback.ts    časová osa přehrávání
    renderer.ts    kreslení na canvas
    schema.ts      zod validace (API, import, sdílený odkaz)
  features/
    player/        přehrávač (PitchCanvas, usePlayback, TacticPlayer)
    builder/       editor (draft reducer, editovatelné hřiště, inspector)
    library/       knihovna se stromem složek
    auth/          heslo pro úpravy
    share/         sdílení odkazem
  api/             kontrakt úložiště + local a http implementace
  routes/          obrazovky
  data/seed/       výchozí obsah knihovny (JSON)
```

### Proč delta-snímky

Snímek si drží jen změny pozic oproti předchozímu. Autorská práce je pak rychlá
(v každé fázi hýbeš jen s hráči, kteří se opravdu pohnou) a engine z toho složí
plné pozice funkcí `resolveFrames`. Editor to musí respektovat i při mazání
a přeskládání fází — proto na to existují testy v `src/features/builder/draft.test.ts`.

## Datový model

```ts
Tactic → Scenario[] → Frame[]
```

- `Tactic` má název, složku a soupisku hráčů (`PlayerDef[]`).
- `Scenario` je jedna situace (záložka v přehrávači) s trenérskými body.
- `Frame` je jedna fáze: text, změny pozic, míč, oblouk, zóna, zvýraznění, časování.

Souřadnice jsou v jednotkách 0–100 (x = šířka, y = délka). `y = 0` je horní branka.

## Ovládání builderu

- **Posun** — tažením přesuneš hráče; pozice se uloží jen do aktuální fáze.
- **Míč** — klik na hráče (míč u nohy) nebo na volné místo (pevný bod).
- **Zóna** — tažením nakreslíš zvýrazněný obdélník, popisek se doplní v panelu.
- Fáze se přidávají, duplikují, přesouvají a mažou v liště pod hřištěm.
- Import/export JSON umožní taktiku přenést nebo verzovat v gitu.

## Backend

Aplikace mluví s úložištěm přes rozhraní `TacticsApi` (`src/api/types.ts`).
Existují dvě implementace:

- `src/api/local.ts` — localStorage, funguje hned a používá se i v testech,
- `src/api/http.ts` — REST klient pro PHP API.

Kontrakt endpointů: [`docs/api-contract.md`](docs/api-contract.md).
Kostra backendu s TODO místy: [`api-php/index.php`](api-php/index.php).

Přepnutí na backend:

```dotenv
VITE_API_MODE=http
VITE_API_URL=/api
```

Heslo se v tomto režimu ověřuje na serveru, token jde v `Authorization: Bearer`.
Klientská zábrana (`RequireEditor`) je jen UX — práva musí vynutit backend.

## Sdílení

1. **Odkaz z knihovny** — `POST /tactics/{id}/share` vytvoří token,
   výsledek je `/t/{id}?share={token}` a vždy ukazuje aktuální verzi.
2. **Odkaz s daty** — celá taktika zabalená v `/share#<base64url>`.
   Funguje bez serveru i bez přihlášení, hodí se na poslání do skupiny.

## Import starých animací

```bash
node scripts/legacy-import.mjs stara-animace.html src/data/seed/nova.json "Název" "Popis"
```

Skript vytáhne pole `SCEN` z původního HTML a přemapuje ho na `Tactic`.
Takhle vznikly obě výchozí taktiky v knihovně.
