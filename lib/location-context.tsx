'use client';
import { localState } from '@/lib/local-state';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationContextType {
  coords: Coordinates | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, cityName: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localState.getItem('muslim-life-location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validCoordinates(parsed?.coords)) { setCoords(parsed.coords); setCity(typeof parsed.city === 'string' ? parsed.city : null); }
      }
    } catch { setError('Les coordonnées enregistrées sont illisibles.'); }
    setLoading(false);
  }, []);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoords(newCoords);
        
        // Reverse geocoding (simple approximation or API call could go here)
        // For now, we'll just say "Current Location"
        const newCity = "Position actuelle";
        setCity(newCity);
        
        localState.setItem('muslim-life-location', JSON.stringify({ coords: newCoords, city: newCity }));
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const setManualLocation = (lat: number, lng: number, cityName: string) => {
    if (!validCoordinates({ lat, lng })) { setError('Coordonnées invalides.'); return; }
    setError(null);
    const newCoords = { lat, lng };
    setCoords(newCoords);
    setCity(cityName);
    localState.setItem('muslim-life-location', JSON.stringify({ coords: newCoords, city: cityName }));
  };

  return (
    <LocationContext.Provider value={{ coords, city, loading, error, requestLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

function validCoordinates(value: Coordinates | null | undefined): value is Coordinates {
  return !!value && Number.isFinite(value.lat) && value.lat >= -90 && value.lat <= 90 && Number.isFinite(value.lng) && value.lng >= -180 && value.lng <= 180;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
