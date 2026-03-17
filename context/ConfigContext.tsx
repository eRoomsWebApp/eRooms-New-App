
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { getAppConfig, CONFIG_UPDATED_EVENT } from '../db';

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const initialConfig = await getAppConfig();
        setConfig(initialConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setConfig(detail);
      }
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
