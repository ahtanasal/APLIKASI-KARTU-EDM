import React, { createContext, useContext, useState, useEffect } from 'react';
import { Umat } from '../types';

export type QRCodePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface CardField {
  id: string;
  label: string;
  chLabel: string;
  key?: keyof Umat | 'custom';
  customValue?: string;
  show: boolean;
  order: number;
  isLarge?: boolean;
}

export interface CardDesignSettings {
  frontBg: string;
  backBg: string;
  qrPosition: QRCodePosition;
  showNameOnBack: boolean;
  frontLogoOpacity: number;
  fields: CardField[];
}

const defaultFields: CardField[] = [
  { id: 'date', label: 'TANGGAL', chLabel: '日期', key: 'tanggalMasehi', show: true, order: 0 },
  { id: 'pandita', label: 'PANDITA', chLabel: '點傳師', key: 'pandita', show: true, order: 1, isLarge: true },
  { id: 'pengajak', label: 'PENGAJAK', chLabel: '引師', key: 'pengajak', show: true, order: 2, isLarge: true },
  { id: 'penanggung', label: 'PENANGGUNG', chLabel: '保師', key: 'penanggung', show: true, order: 3, isLarge: true },
  { id: 'vihara', label: 'VIHARA', chLabel: '壇名', key: 'vihara', show: true, order: 4, isLarge: true },
  { id: 'nama', label: 'NAMA', chLabel: '求道人', key: 'nama', show: true, order: 5, isLarge: true },
];

const defaultSettings: CardDesignSettings = {
  frontBg: '/src/assets/front_logo.png',
  backBg: '/src/assets/JiGong-12.jpeg',
  qrPosition: 'bottom-right',
  showNameOnBack: false,
  frontLogoOpacity: 0.9,
  fields: defaultFields,
};

interface DesignContextType {
  settings: CardDesignSettings;
  updateSettings: (newSettings: Partial<CardDesignSettings>) => void;
  resetSettings: () => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CardDesignSettings>(() => {
    const saved = localStorage.getItem('edm_card_design');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved design settings', e);
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<CardDesignSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('edm_card_design', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('edm_card_design');
  };

  return (
    <DesignContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};
