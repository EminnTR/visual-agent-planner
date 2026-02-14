import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Settings store — persisted to localStorage
// Manages API keys, provider selection, and model overrides
const useSettingsStore = create(
    persist(
        (set, get) => ({
            // API keys (runtime, stored in localStorage)
            // API keys (runtime, stored in localStorage)
            apiKeys: {
                openrouter: '',
            },

            // API Mode: 'backend' (Proxy/Demo) | 'local' (Direct/Personal Key)
            apiMode: 'backend',

            // Model override (empty = use provider default)
            modelOverride: '',

            // Settings modal visibility
            isOpen: false,

            // Actions
            setApiKey: (providerId, key) =>
                set((state) => ({
                    apiKeys: { ...state.apiKeys, [providerId]: key },
                })),

            setApiMode: (mode) => set({ apiMode: mode }),
            setModelOverride: (modelOverride) => set({ modelOverride }),
            openSettings: () => set({ isOpen: true }),
            closeSettings: () => set({ isOpen: false }),

            // Get the effective API key for OpenRouter
            // Priority: localStorage (runtime) > .env (build-time)
            getEffectiveKey: () => {
                const { apiKeys } = get();
                const runtimeKey = apiKeys.openrouter;
                if (runtimeKey) return runtimeKey;

                // Fallback to .env
                return import.meta.env.VITE_OPENROUTER_API_KEY || '';
            },

            // Check if current provider has a valid key
            // Start of valid key check logic
            hasValidKey: () => {
                const { getEffectiveKey } = get();
                return !!getEffectiveKey();
            },
        }),
        {
            name: 'vap-settings',
            // Only persist these fields (not isOpen)
            partialize: (state) => ({
                apiKeys: state.apiKeys,
                apiMode: state.apiMode,
                modelOverride: state.modelOverride,
            }),
        }
    )
);

export default useSettingsStore;
