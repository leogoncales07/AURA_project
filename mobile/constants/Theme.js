export const Colors = {
    // Dark theme (matches Next.js dark mode)
    dark: {
        bg: '#020617', // --bg-background
        surface: 'rgba(15, 23, 42, 0.85)', // --bg-sidebar
        surfaceAlt: 'rgba(2, 6, 23, 0.95)', // --bg-scrolled
        card: 'rgba(30, 41, 59, 0.72)', // --bg-card
        border: 'rgba(255, 255, 255, 0.18)', // --border-primary
        divider: 'rgba(255, 255, 255, 0.12)',

        textPrimary: '#f8fafc', // --fg-foreground
        textSecondary: 'rgba(248, 250, 252, 0.92)', // --fg-muted
        textTertiary: 'rgba(148, 163, 184, 0.65)', // --fg-placeholder

        primary: '#10b981', // --brand-primary
        primaryDim: 'rgba(16, 185, 129, 0.12)', // shadow-aura / faint highlight
        secondary: '#06b6d4', // --brand-secondary
        
        accentMint: '#30D158',
        accentBlue: '#4FC3F7',
        accentPink: '#FF6B9D',
        accentAmber: '#FFB340',

        tabBar: '#020617',
        tabBorder: 'rgba(255,255,255,0.18)',
    },
};

export const COLORS = Colors.dark;

// Fallbacks for React Native if fonts aren't loaded, default to System with tailored weights
export const Fonts = {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    semibold: { fontFamily: 'System', fontWeight: '600' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
    serif: { fontFamily: 'System', fontWeight: '400' }, // Ideal for Fraunces
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Mapped exactly to globals.css --radius
export const Radius = {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
};

