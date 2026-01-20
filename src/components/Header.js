'use client';
import { useTheme } from '../app/ThemeProvider';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <>
            <header className="fixed top-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md shadow-sm flex items-center justify-center"
                style={{
                borderBottom: '1px solid var(--border)',
                color: 'var(--foreground)'
            }}
            >
                <button
                onClick={toggleTheme}
                className="px-6 py-3 rounded-lg font-semibold left-0 absolute ml-4"
                style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)'
                }}
                >
                    {theme === 'light' ? 'Dark' : 'Light'}
                </button>
                <div className="text-xl font-bold text-foreground">

                    Astralis
                </div>
            </header>

        </>

    );
}

export default Header;  