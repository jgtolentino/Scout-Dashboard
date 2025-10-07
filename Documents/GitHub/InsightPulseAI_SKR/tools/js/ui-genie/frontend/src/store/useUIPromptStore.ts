import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPrompt {
  id: string;
  prompt: string;
  generatedCode: string;
  createdAt: Date;
}

interface UIPromptStore {
  // Current state
  currentPrompt: string;
  isGenerating: boolean;
  generatedUI: string;
  
  // Saved UIs
  savedUIs: UIPrompt[];
  
  // Actions
  setCurrentPrompt: (prompt: string) => void;
  setGeneratingState: (isGenerating: boolean) => void;
  setGeneratedUI: (code: string) => void;
  saveCurrentUI: () => void;
  loadSavedUI: (id: string) => void;
  deleteSavedUI: (id: string) => void;
}

export const useUIPromptStore = create<UIPromptStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPrompt: '',
      isGenerating: false,
      generatedUI: '',
      savedUIs: [],
      
      // Actions
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      
      setGeneratingState: (isGenerating) => set({ isGenerating }),
      
      setGeneratedUI: (code) => set({ generatedUI: code }),
      
      saveCurrentUI: () => {
        const { currentPrompt, generatedUI, savedUIs } = get();
        if (!currentPrompt || !generatedUI) return;
        
        const newUI: UIPrompt = {
          id: Date.now().toString(),
          prompt: currentPrompt,
          generatedCode: generatedUI,
          createdAt: new Date()
        };
        
        set({ savedUIs: [newUI, ...savedUIs] });
      },
      
      loadSavedUI: (id) => {
        const { savedUIs } = get();
        const savedUI = savedUIs.find(ui => ui.id === id);
        
        if (savedUI) {
          set({
            currentPrompt: savedUI.prompt,
            generatedUI: savedUI.generatedCode
          });
        }
      },
      
      deleteSavedUI: (id) => {
        const { savedUIs } = get();
        set({ savedUIs: savedUIs.filter(ui => ui.id !== id) });
      }
    }),
    {
      name: 'ui-genie-storage',
      partialize: (state) => ({ savedUIs: state.savedUIs })
    }
  )
);