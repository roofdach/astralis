'use client';

import { useTheme } from './ThemeProvider';
import Card from '../components/Card';
import ThemedAreaChart from '../components/AreaChart';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen p-8">
      <button
          onClick={toggleTheme}
          className="px-6 py-3 rounded-lg font-semibold mb-8"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <Card>
          <h1 className="text-4xl font-bold mb-4 text-center">Test Card</h1>
          
          
          
        </Card>
        <br />
        <Card>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-center">Area Chart</h2>
            <ThemedAreaChart />
          </div>
        </Card>
    </main>
  );
}
