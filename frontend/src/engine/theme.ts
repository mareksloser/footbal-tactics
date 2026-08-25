export interface BoardTheme {
  grassTop: string;
  grassMid: string;
  grassBottom: string;
  line: string;
  homeFill: string;
  homeRing: string;
  homeText: string;
  homeArrow: string;
  homeGlow: string;
  awayFill: string;
  awayRing: string;
  awayText: string;
  awayArrow: string;
  zoneFill: string;
  zoneLine: string;
  flashTint: string;
}

/** Modro-cervena (klubova). */
export const themeClub: BoardTheme = {
  grassTop: '#14523a',
  grassMid: '#1a6344',
  grassBottom: '#12492f',
  line: 'rgba(255,255,255,.5)',
  homeFill: '#2f5fd0',
  homeRing: '#e0233f',
  homeText: '#ffffff',
  homeArrow: 'rgba(126,163,245,.85)',
  homeGlow: 'rgba(224,35,63,.22)',
  awayFill: '#dfe4ee',
  awayRing: '#7d8698',
  awayText: '#1a2130',
  awayArrow: 'rgba(255,255,255,.4)',
  zoneFill: 'rgba(224,35,63,.13)',
  zoneLine: 'rgba(224,35,63,.55)',
  flashTint: 'rgba(224,35,63,.16)',
};

/** Zluta trenerska (vychozi). */
export const themeCoach: BoardTheme = {
  ...themeClub,
  homeFill: '#f2b134',
  homeRing: '#a9690a',
  homeText: '#251903',
  homeArrow: 'rgba(242,177,52,.9)',
  homeGlow: 'rgba(242,177,52,.28)',
  zoneFill: 'rgba(242,177,52,.14)',
  zoneLine: 'rgba(242,177,52,.6)',
  flashTint: 'rgba(242,177,52,.14)',
};

export const themes = { coach: themeCoach, club: themeClub } as const;
export type ThemeName = keyof typeof themes;
