import { useEffect, useState } from 'react';

export type ViewWidth = 'fit' | 'panel' | 'full';

export const VIEW_WIDTH_OPTIONS = [
    { value: 'fit', label: 'Přizpůsobit obrazovce' },
    { value: 'panel', label: 'Jako v editaci' },
    { value: 'full', label: 'Na celou šířku' },
] as const satisfies ReadonlyArray<{ value: ViewWidth; label: string }>;

/**
 * Sirka platna. Vyska = sirka * 1.5 (viz layoutFor v engine/geometry).
 * - fit:   dopocitano z vysky viewportu, aby se hriste veslo bez scrollovani
 * - panel: 592px = presne tolik, kolik ma hriste v editoru
 *          (max-w-5xl 1024 - px-4 32 - panel 380 - gap-5 20)
 * - full:  cela sirka obsahu
 */
export const VIEW_WIDTH_CLASSES: Record<ViewWidth, string> = {
    fit: 'mx-auto w-[min(100%,calc((100svh-var(--pitch-chrome))/1.5))]',
    panel: 'mx-auto w-full max-w-[592px]',
    full: 'w-full',
};

const STORAGE_KEY = 'tactic:view-width';

function isViewWidth(value: unknown): value is ViewWidth {
    return value === 'fit' || value === 'panel' || value === 'full';
}

export function useViewWidth() {
    const [viewWidth, setViewWidth] = useState<ViewWidth>(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return isViewWidth(stored) ? stored : 'fit';
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, viewWidth);
    }, [viewWidth]);

    return [viewWidth, setViewWidth] as const;
}