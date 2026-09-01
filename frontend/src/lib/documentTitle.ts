import { useEffect } from 'react';

export const APP_NAME = 'Taktická tabule';

export function formatTitle(...parts: Array<string | null | undefined>): string {
    const segments = parts
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part));
    return [...segments, APP_NAME].join(' · ');
}

export function useDocumentTitle(...parts: Array<string | null | undefined>): void {
    const title = formatTitle(...parts);
    useEffect(() => {
        document.title = title;
    }, [title]);
}