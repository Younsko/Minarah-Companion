'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import ModeSwitcher from '@/components/ModeSwitcher';
import AdultDashboard from '@/components/adult/Dashboard';
import KidsDashboard from '@/components/kids/Dashboard';

import { RamadanProvider } from '@/lib/ramadan-context';
import { LocationProvider } from '@/lib/location-context';
import { I18nProvider } from '@/lib/i18n-context';

export default function Home() {
  const [mode, setMode] = useState<'adult' | 'kids'>('adult');
  const [theme, setTheme] = useState<'pistachio' | 'dark'>('dark'); // Default to dark

  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage OR system preference
  useEffect(() => {
    const savedTheme = localState.getItem('theme') as 'pistachio' | 'dark' | null;
    const savedMode = localState.getItem('mode') as 'adult' | 'kids';

    if (savedTheme) {
      // User has a saved preference, use it
      setTheme(savedTheme);
    } else {
      // No saved preference, detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'pistachio');
    }

    if (savedMode) setMode(savedMode);
    setMounted(true);

    // Listen for system theme changes (only if user hasn't set manual preference)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const userTheme = localState.getItem('theme');
      if (!userTheme) {
        // Only auto-switch if user hasn't manually set a preference
        setTheme(e.matches ? 'dark' : 'pistachio');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Apply theme and mode to document element and save to localStorage (only after mount)
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    // Also cleanup body attributes if they exist from previous versions to avoid confusion
    if (document.body.hasAttribute('data-theme')) document.body.removeAttribute('data-theme');
    if (document.body.hasAttribute('data-mode')) document.body.removeAttribute('data-mode');

    localState.setItem('theme', theme);
    localState.setItem('mode', mode);
  }, [theme, mode, mounted]);

  return (
    <I18nProvider>
      <LocationProvider>
        <RamadanProvider>
          <div style={{ minHeight: '100vh', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <ModeSwitcher
                mode={mode}
                onModeChange={setMode}
                theme={theme}
                onThemeChange={setTheme}
              />
            </div>

            {mode === 'adult' ? <AdultDashboard /> : <KidsDashboard />}
          </div>
        </RamadanProvider>
      </LocationProvider>
    </I18nProvider>
  );
}
