import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { DemoData } from '../types';
import { CONFIG } from '../config/constants';
import { DEFAULT_DEMO_DATA } from '../config/demo-data';
import { loadDemoData, saveDemoData as persistDemoData } from '../services/storage';
import { createAPI, type APIType } from '../services/api';

interface DemoDataContextValue {
  data: DemoData;
  updateData: (updater: (prev: DemoData) => DemoData) => void;
  api: APIType;
  loading: boolean;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

const EMPTY_DATA: DemoData = {
  encuestas: [],
  resultados: {},
  estadisticas: { total_votos: 0, total_encuestas: 0, regiones: 0, precision: 0 },
  votosRegistrados: {},
  noticias: [],
  denuncias: [],
  foro: [],
  imagenes: [],
};

function initializeData(): DemoData {
  // Production mode: start empty, data will be fetched from API
  if (!CONFIG.DEMO_MODE) return EMPTY_DATA;

  const saved = loadDemoData();
  if (saved) {
    saved.votosRegistrados = saved.votosRegistrados || {};
    saved.estadisticas = saved.estadisticas || DEFAULT_DEMO_DATA.estadisticas;
    saved.noticias = saved.noticias || [];
    // Merge any new default encuestas not in saved data
    DEFAULT_DEMO_DATA.encuestas.forEach(defEnc => {
      if (!saved.encuestas.find(e => e.id === defEnc.id)) {
        saved.encuestas.push(JSON.parse(JSON.stringify(defEnc)));
        if (DEFAULT_DEMO_DATA.resultados[defEnc.id]) {
          saved.resultados[defEnc.id] = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.resultados[defEnc.id]));
        }
      }
    });
    // Merge any new default noticias not in saved data
    DEFAULT_DEMO_DATA.noticias.forEach(defNews => {
      if (!saved.noticias.find((n: any) => n.id === defNews.id)) {
        saved.noticias.push(JSON.parse(JSON.stringify(defNews)));
      }
    });
    // Merge denuncias
    saved.denuncias = saved.denuncias || [];
    DEFAULT_DEMO_DATA.denuncias.forEach(d => {
      if (!saved.denuncias.find((x: any) => x.id === d.id)) {
        saved.denuncias.push(JSON.parse(JSON.stringify(d)));
      }
    });
    // Merge foro
    saved.foro = saved.foro || [];
    DEFAULT_DEMO_DATA.foro.forEach(f => {
      if (!saved.foro.find((x: any) => x.id === f.id)) {
        saved.foro.push(JSON.parse(JSON.stringify(f)));
      }
    });
    saved.imagenes = saved.imagenes || [];
    saved.estadisticas = DEFAULT_DEMO_DATA.estadisticas;
    return saved;
  }
  return JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(initializeData);
  const [loading, setLoading] = useState(!CONFIG.DEMO_MODE);

  const dataRef = useRef(data);
  dataRef.current = data;

  const updateData = useCallback((updater: (prev: DemoData) => DemoData) => {
    setData(prev => {
      const next = updater(prev);
      if (CONFIG.DEMO_MODE) persistDemoData(next);
      return next;
    });
  }, []);

  const apiRef = useRef<APIType | null>(null);
  if (!apiRef.current) {
    apiRef.current = createAPI(
      () => dataRef.current,
      updateData,
    );
  }

  // In production mode, fetch initial data from API
  useEffect(() => {
    if (!CONFIG.DEMO_MODE && apiRef.current) {
      apiRef.current.fetchAllPublicData().finally(() => setLoading(false));
    }
  }, []);

  return (
    <DemoDataContext.Provider value={{ data, updateData, api: apiRef.current, loading }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData(): DemoDataContextValue {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error('useDemoData must be used within DemoDataProvider');
  return ctx;
}
