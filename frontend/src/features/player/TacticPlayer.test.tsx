import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { seedLibrary } from '@/data/seed';
import { TacticPlayer } from './TacticPlayer';

const tactic = seedLibrary().tactics[0]!;

describe('TacticPlayer', () => {
  it('vykresli zalozky situaci a text prvni faze', () => {
    render(<TacticPlayer scenarios={tactic.scenarios} players={tactic.players} autoPlay={false} />);

    expect(screen.getAllByRole('tab')).toHaveLength(tactic.scenarios.length);
    expect(screen.getByText(tactic.scenarios[0]!.frames[0]!.text)).toBeInTheDocument();
  });

  it('krokovani dopredu zobrazi text dalsi faze', async () => {
    const user = userEvent.setup();
    render(<TacticPlayer scenarios={tactic.scenarios} players={tactic.players} autoPlay={false} />);

    await user.click(screen.getByLabelText('Další fáze'));

    expect(screen.getByText(tactic.scenarios[0]!.frames[1]!.text)).toBeInTheDocument();
  });

  it('prepnuti zalozky zobrazi jinou situaci', async () => {
    const user = userEvent.setup();
    render(<TacticPlayer scenarios={tactic.scenarios} players={tactic.players} autoPlay={false} />);

    await user.click(screen.getAllByRole('tab')[1]!);

    expect(screen.getByText(tactic.scenarios[1]!.frames[0]!.text)).toBeInTheDocument();
  });

  it('zobrazi trenerske body aktivni situace', () => {
    render(<TacticPlayer scenarios={tactic.scenarios} players={tactic.players} autoPlay={false} />);
    expect(screen.getByText(tactic.scenarios[0]!.keyPoints[0]!)).toBeInTheDocument();
  });
});
