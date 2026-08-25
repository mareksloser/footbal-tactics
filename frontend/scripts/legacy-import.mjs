/**
 * Prevede puvodni jednosouborove HTML animace na JSON ve formatu aplikace.
 *
 *   node scripts/legacy-import.mjs <soubor.html> <vystup.json> "<nazev>" "<popis>"
 *
 * Skript nacte pole SCEN z puvodniho skriptu a premapuje ho na strukturu Tactic.
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , input, output, title, description = ''] = process.argv;
if (!input || !output || !title) {
  console.error('Použití: node scripts/legacy-import.mjs <vstup.html> <vystup.json> "<název>" ["<popis>"]');
  process.exit(1);
}

const source = fs.readFileSync(input, 'utf8');
const start = source.indexOf('var PAL');
const end = source.indexOf('SCEN.forEach');
if (start < 0 || end < 0) {
  console.error('V souboru se nepodařilo najít definici PAL/SCEN.');
  process.exit(1);
}

const legacy = new Function(`${source.slice(start, end)}\nreturn { PAL, OPP, SCEN };`)();
const { PAL, OPP, SCEN } = legacy;

const slug = (value, fallback) =>
  (value || fallback)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || fallback;

const usedIds = new Set();
for (const scenario of SCEN) {
  for (const frame of scenario.frames) {
    for (const id of Object.keys(frame.pos ?? {})) usedIds.add(id);
  }
}

const players = [...usedIds]
  .map((id) => ({
    id,
    label: PAL[id] ?? OPP[id] ?? id,
    team: PAL[id] !== undefined ? 'home' : 'away',
  }))
  .sort((a, b) => (a.team === b.team ? a.id.localeCompare(b.id) : a.team === 'home' ? -1 : 1));

const scenarios = SCEN.map((scenario, scenarioIndex) => ({
  id: `s_${slug(scenario.key, `situace-${scenarioIndex + 1}`)}`,
  name: scenario.key,
  badge: scenario.sub ?? '',
  title: scenario.name ?? scenario.key,
  keyPoints: scenario.keys ?? [],
  frames: scenario.frames.map((frame, frameIndex) => {
    const converted = {
      id: `f_${scenarioIndex + 1}_${frameIndex + 1}`,
      text: frame.text,
      positions: frame.pos ?? {},
      ball: frame.ball,
    };
    if (frame.arc) converted.arc = frame.arc;
    if (frame.ballSpeed) converted.ballSpeed = frame.ballSpeed;
    if (frame.focus) converted.focus = frame.focus;
    if (frame.zone) converted.zone = frame.zone;
    if (frame.flash) converted.flash = frame.flash;
    if (frame.goal) converted.flash = 'GÓL';
    if (frame.dur) converted.durMs = frame.dur;
    if (frame.hold) converted.holdMs = frame.hold;
    return converted;
  }),
}));

const tactic = {
  id: `t_${slug(title, 'taktika')}`,
  title,
  description,
  folderId: null,
  players,
  scenarios,
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(tactic, null, 2)}\n`);
console.log(
  `Hotovo: ${output} — ${scenarios.length} situací, ${scenarios.reduce((sum, s) => sum + s.frames.length, 0)} fází, ${players.length} hráčů.`,
);
