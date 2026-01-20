'use client';

import { useTheme } from './ThemeProvider';
import Card from '../components/Card';
import ThemedAreaChart from '../components/AreaChart';
import Header from '../components/Header';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Header /> 
      <main className="min-h-screen p-8 pt-24"> 
        <Card>
          <h1 className="text-4xl font-bold mb-4 text-center text-foreground">Test Card</h1>
        </Card>
        
        <div className="mt-8">
           <Card>
             <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Area Chart</h2>
             <ThemedAreaChart />
           </Card>
           <Card>
             <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Area Chart</h2>
             <ThemedAreaChart />
           </Card>
           <Card>
             <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Area Chart</h2>
             <ThemedAreaChart />
           </Card>
           <Card>
             <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Area Chart</h2>
             <ThemedAreaChart />
           </Card>
           <Card>
             <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Area Chart</h2>
             <ThemedAreaChart />
           </Card>
        </div>
      </main>
    </>
  );
}