import { useState, useCallback } from 'react';
import useStore from '../store';
import useSettingsStore from '../settingsStore';
import { suggestAgentTeam, CATEGORIES, searchCatalog, getCategoryItems } from '../engine/suggestionEngine';
import PromptBar from './PromptBar';
import SettingsModal from './SettingsModal';
import OutputPanel from './OutputPanel';
import { RotateCcw, Plus, X, Search } from 'lucide-react';

const Canvas = () => {
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [browseCategory, setBrowseCategory] = useState(null);
    const [error, setError] = useState(null);

    const { selected, setSelected, setSummary, summary, reset, addItem, removeItem } = useStore();
    const { provider, getEffectiveKey, modelOverride, openSettings } = useSettingsStore();

    const handleSuggest = useCallback(async (description) => {
        setIsLoading(true);
        setError(null);
        try {
            const config = {
                providerId: provider,
                apiKey: getEffectiveKey(provider),
                model: modelOverride || undefined,
            };
            const result = await suggestAgentTeam(description, config);
            setSelected(result.selected);
            setSummary(result.summary || '');
            setHasGenerated(true);
        } catch (err) {
            console.error('Suggestion failed:', err);
            if (err.message.includes('401') || err.message.includes('403')) {
                setError('API key is invalid or expired. Open Settings to update it.');
            } else if (err.message.includes('No API key')) {
                setError(err.message);
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [setSelected, setSummary, provider, getEffectiveKey, modelOverride]);

    const handleReset = useCallback(() => {
        reset();
        setHasGenerated(false);
        setBrowseCategory(null);
    }, [reset]);

    const handlePreset = useCallback((preset) => {
        setSelected(preset.result.selected);
        setSummary(preset.result.summary || '');
        setHasGenerated(true);
    }, [setSelected, setSummary]);

    const totalCount = Object.values(selected).reduce((s, a) => s + a.length, 0);

    // STATE 1: Hero prompt (empty)
    if (!hasGenerated && totalCount === 0) {
        return (
            <div className="canvas-hero">
                <PromptBar
                    onSuggest={handleSuggest}
                    onPreset={handlePreset}
                    isLoading={isLoading}
                    error={error}
                    onClearError={() => setError(null)}
                />
                <SettingsModal />
            </div>
        );
    }

    // Browse Modal
    const browseItems = browseCategory
        ? (browseSearch
            ? (searchCatalog(browseSearch, browseCategory)[browseCategory] || [])
            : getCategoryItems(browseCategory))
        : [];

    const selectedIds = browseCategory
        ? new Set((selected[browseCategory] || []).map(i => i.id))
        : new Set();

    const catDef = browseCategory
        ? CATEGORIES.find(c => c.key === browseCategory)
        : null;

    // STATE 2: Results
    return (
        <div className="canvas-results">
            <header className="results-header">
                <button className="reset-btn" onClick={handleReset} title="Start over">
                    <RotateCcw size={16} />
                    <span>New</span>
                </button>
                <PromptBar
                    onSuggest={handleSuggest}
                    isLoading={isLoading}
                    error={error}
                    onClearError={() => setError(null)}
                    compact
                />
            </header>

            <div className="results-body">
                {/* Overview Badges */}
                <div className="category-overview">
                    {CATEGORIES.map((cat) => {
                        const count = (selected[cat.key] || []).length;
                        return (
                            <div
                                key={cat.key}
                                className={`category-badge ${count > 0 ? 'active' : ''}`}
                                style={{ '--cat-color': cat.color }}
                            >
                                <span className="category-badge-icon">{cat.icon}</span>
                                <span className="category-badge-name">{cat.label}</span>
                                <span className="category-badge-count">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {summary && (
                    <div className="results-summary">
                        <span className="summary-text">{summary}</span>
                        <span className="summary-hint">Use <strong>+ Add</strong> to include any component from the catalog.</span>
                    </div>
                )}

                {/* Category Sections */}
                {CATEGORIES.map((cat) => {
                    const items = selected[cat.key] || [];
                    return (
                        <section
                            key={cat.key}
                            className="category-section"
                            style={{ '--cat-color': cat.color }}
                        >
                            <div className="category-section-header">
                                <span className="category-section-icon">{cat.icon}</span>
                                <h2 className="category-section-title">{cat.label}</h2>
                                <span className="category-section-count">{items.length}</span>
                                <button
                                    className="category-add-btn"
                                    onClick={() => { setBrowseCategory(cat.key); setBrowseSearch(''); }}
                                    title={`Browse & add ${cat.label}`}
                                >
                                    <Plus size={14} />
                                    <span>Add</span>
                                </button>
                            </div>

                            <div className="category-items">
                                {items.length === 0 ? (
                                    <div className="category-empty">
                                        No {cat.label.toLowerCase()} selected
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="category-item">
                                            <div className="category-item-info">
                                                <span className="category-item-name">{item.name}</span>
                                                <span className="category-item-desc">
                                                    {item.category}/{item.id}
                                                </span>
                                            </div>
                                            <button
                                                className="category-item-remove"
                                                onClick={() => removeItem(cat.key, item.id)}
                                                title="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    );
                })}

                {/* Output Panel */}
                <OutputPanel />

                <footer className="results-footer">
                    <span>Templates from </span>
                    <a href="https://aitmpl.com" target="_blank" rel="noopener noreferrer">aitmpl.com</a>
                </footer>
            </div>

            {/* Browse Modal */}
            {browseCategory && catDef && (
                <div className="browse-overlay" onClick={() => setBrowseCategory(null)}>
                    <div className="browse-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="browse-header" style={{ '--cat-color': catDef.color }}>
                            <span className="browse-icon">{catDef.icon}</span>
                            <h3>Browse {catDef.label}</h3>
                            <button className="browse-close" onClick={() => setBrowseCategory(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="browse-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${catDef.label.toLowerCase()}...`}
                                value={browseSearch}
                                onChange={(e) => setBrowseSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="browse-list">
                            {browseItems.slice(0, 100).map((item) => {
                                const isSelected = selectedIds.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`browse-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (isSelected) {
                                                removeItem(browseCategory, item.id);
                                            } else {
                                                addItem(browseCategory, item);
                                            }
                                        }}
                                    >
                                        <div className="browse-item-check">
                                            {isSelected ? '✓' : '+'}
                                        </div>
                                        <div className="browse-item-info">
                                            <span className="browse-item-name">{item.name}</span>
                                            <span className="browse-item-path">{item.category}/{item.id}</span>
                                            {item.description && (
                                                <span className="browse-item-desc">{item.description}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {browseItems.length === 0 && (
                                <div className="browse-empty">No results found</div>
                            )}
                            {browseItems.length > 100 && (
                                <div className="browse-more">
                                    Showing first 100 of {browseItems.length} results. Refine your search.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal />
        </div>
    );
};

export default Canvas;
