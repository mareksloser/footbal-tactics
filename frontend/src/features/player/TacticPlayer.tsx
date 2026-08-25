import { useEffect, useState } from 'react';
import type { PlayerDef, Scenario } from '@/engine/types';
import { themes, type ThemeName } from '@/engine/theme';
import { cn } from '@/lib/cn';
import { PitchCanvas } from './PitchCanvas';
import { usePlayback } from './usePlayback';

export interface TacticPlayerProps {
  scenarios: readonly Scenario[];
  players: readonly PlayerDef[];
  theme?: ThemeName;
  autoPlay?: boolean;
}

export function TacticPlayer({ scenarios, players, theme = 'coach', autoPlay = true }: TacticPlayerProps) {
  const [active, setActive] = useState(0);
  const scenario = scenarios[Math.min(active, scenarios.length - 1)];

  useEffect(() => {
    setActive(0);
  }, [scenarios]);

  const playback = usePlayback(scenario?.frames ?? [], players, { autoPlay });
  if (!scenario) return null;

  const frame = scenario.frames[Math.min(playback.index, scenario.frames.length - 1)]!;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2.5 [scrollbar-width:none]" role="tablist">
        {scenarios.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'shrink-0 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition',
              i === active
                ? 'border-transparent bg-linear-[114deg,var(--color-amber),var(--color-deep)] text-[#1a1204]'
                : 'border-edge bg-panel text-muted hover:border-[#42525f] hover:text-chalk',
            )}
          >
            {item.badge ? (
              <span className="block text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">
                {item.badge}
              </span>
            ) : null}
            {item.name}
          </button>
        ))}
      </div>

      <PitchCanvas players={players} getScene={playback.getScene} theme={themes[theme]} />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={playback.prev}
          aria-label="Předchozí fáze"
          className="h-11 w-11 rounded-lg border border-edge bg-panel"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={playback.toggle}
          className="h-11 rounded-lg border border-transparent bg-linear-[114deg,var(--color-amber),var(--color-deep)] px-5 font-extrabold text-[#1a1204]"
        >
          {playback.playing ? '❙❙ Pauza' : '▶ Přehrát'}
        </button>
        <button
          type="button"
          onClick={playback.next}
          aria-label="Další fáze"
          className="h-11 w-11 rounded-lg border border-edge bg-panel"
        >
          ▶
        </button>
        <button
          type="button"
          onClick={playback.restart}
          aria-label="Od začátku"
          className="h-11 w-11 rounded-lg border border-edge bg-panel"
        >
          ↺
        </button>
        <label className="ml-auto flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
          Tempo
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.25}
            value={playback.speed}
            onChange={(event) => playback.setSpeed(Number(event.target.value))}
            className="w-24 accent-[var(--color-amber)]"
            aria-label="Rychlost přehrávání"
          />
        </label>
      </div>

      <div className="mt-3 flex gap-1.5">
        {scenario.frames.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Fáze ${i + 1}`}
            onClick={() => playback.goTo(i)}
            className={cn(
              'h-1.5 flex-1 rounded-full transition',
              i === playback.index ? 'bg-amber' : i < playback.index ? 'bg-[#5a4520]' : 'bg-[#222c36]',
            )}
          />
        ))}
      </div>

      <div className="mt-3.5 min-h-[104px] rounded-xl border border-edge border-l-[3px] border-l-amber bg-panel p-4">
        <p className="mb-1.5 text-[11px] font-extrabold tracking-[0.18em] text-amber-soft uppercase">
          {scenario.title ?? scenario.name} · fáze {playback.index + 1}/{scenario.frames.length}
        </p>
        <p className="text-[15px] leading-relaxed">{frame.text}</p>
      </div>

      {scenario.keyPoints.length > 0 ? (
        <>
          <h2 className="mt-6 mb-2.5 text-[12px] font-extrabold tracking-[0.2em] text-muted uppercase">
            Trenérské body
          </h2>
          <ul className="grid gap-2.5">
            {scenario.keyPoints.map((point) => (
              <li
                key={point}
                className="relative rounded-lg border border-edge bg-panel-soft/30 py-2.5 pr-3 pl-8 text-sm leading-relaxed text-[#d3dbe2]"
              >
                <span className="absolute top-4 left-3 h-2 w-2 rounded-xs bg-linear-[114deg,var(--color-amber),var(--color-deep)]" />
                {point}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
