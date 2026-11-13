import { create } from 'zustand';
import { Brand } from '../types';

interface BrandState {
  selectedBrandId: string | 'ALL';
  availableBrands: Brand[];
  setSelectedBrandId: (id: string | 'ALL') => void;
  setAvailableBrands: (brands: Brand[]) => void;
  getSelectedBrand: () => Brand | undefined;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  selectedBrandId: 'ALL',
  availableBrands: [],

  setSelectedBrandId: (id) => set({ selectedBrandId: id }),

  setAvailableBrands: (brands) => {
    const current = get().selectedBrandId;
    // If current selected brand is not ALL and not in the new brand list, reset to first brand or ALL
    const exists = brands.some((b) => b.id === current);
    const fallback = brands.length > 0 ? (exists ? current : brands[0].id) : 'ALL';
    set({ availableBrands: brands, selectedBrandId: fallback });
  },

  getSelectedBrand: () => {
    const { selectedBrandId, availableBrands } = get();
    if (selectedBrandId === 'ALL') return undefined;
    return availableBrands.find((b) => b.id === selectedBrandId);
  },
}));
