import { create } from 'zustand';
import { CATEGORIES } from './engine/suggestionEngine';

const useStore = create((set, get) => ({
    // Selected items per category
    selected: {
        agents: [],
        commands: [],
        hooks: [],
        mcps: [],
        settings: [],
        skills: [],
    },
    summary: '',

    setSelected: (selected) => set({ selected }),
    setSummary: (summary) => set({ summary }),

    // Add item to a category
    addItem: (categoryKey, item) => set((state) => {
        const current = state.selected[categoryKey] || [];
        if (current.find(i => i.id === item.id)) return state; // already exists
        return {
            selected: {
                ...state.selected,
                [categoryKey]: [...current, item],
            },
        };
    }),

    // Remove item from a category
    removeItem: (categoryKey, itemId) => set((state) => ({
        selected: {
            ...state.selected,
            [categoryKey]: (state.selected[categoryKey] || []).filter(i => i.id !== itemId),
        },
    })),

    // Reset everything
    reset: () => set({
        selected: {
            agents: [], commands: [], hooks: [],
            mcps: [], settings: [], skills: [],
        },
        summary: '',
    }),

    // Generate full install command
    getInstallCommand: () => {
        const { selected } = get();
        const parts = ['npx claude-code-templates@latest'];

        for (const catDef of CATEGORIES) {
            const items = selected[catDef.key] || [];
            for (const item of items) {
                parts.push(`  ${item.installCmd}`);
            }
        }

        if (parts.length <= 1) return '';
        parts.push('  --yes');
        return parts.join(' \\\n');
    },

    // Get total selected count
    getTotalCount: () => {
        const { selected } = get();
        return Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);
    },
}));

export default useStore;
