// src/lib/guestStore.js

import { create } from 'zustand';

export const useGuestStore = create((set) => ({
  guestData: null,
  
  setGuestData: (data) => set({ guestData: data }),
  
  clearGuestData: () => set({ guestData: null }),
  
  hasGuestData: () => {
    const state = useGuestStore.getState();
    return state.guestData !== null;
  }
}));