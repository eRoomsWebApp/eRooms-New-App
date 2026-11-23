import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';
import {
  getAppConfig,
  DEFAULT_CONFIG,
  CONFIG_UPDATED_EVENT,
  FIRESTORE_QUOTA_EVENT,
  isFirestoreQuotaExceeded
} from '../db';

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
  quotaExceeded: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(isFirestoreQuotaExceeded());

  const refreshConfig = async () => {
    try {
      const freshConfig = await getAppConfig(true);
      setConfig(freshConfig);
    } catch {
      // keep existing config
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const initialConfig = await getAppConfig();
        setConfig(initialConfig);
      } catch {
        setConfig(DEFAULT_CONFIG);
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

    const handleQuota = () => {
      setQuotaExceeded(true);
    };

    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    window.addEventListener(FIRESTORE_QUOTA_EVENT, handleQuota);
    return () => {
      window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
      window.removeEventListener(FIRESTORE_QUOTA_EVENT, handleQuota);
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, quotaExceeded, refreshConfig }}>
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
