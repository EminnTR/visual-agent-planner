import { useState } from 'react';
import { Settings, X, Eye, EyeOff, Check } from 'lucide-react';
import useSettingsStore from '../settingsStore';
import { PROVIDERS } from '../engine/suggestionEngine';

const SettingsModal = () => {
    const {
        isOpen, openSettings, closeSettings,
        apiMode, setApiMode,
        apiKeys, setApiKey,
        modelOverride, setModelOverride,
        getEffectiveKey,
    } = useSettingsStore();

    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            closeSettings();
        }, 800);
    };

    const hasKey = !!getEffectiveKey();
    const isDemo = apiMode === 'backend' || !hasKey;

    return (
        <>
            {/* Gear trigger button */}
            <button
                className="settings-trigger"
                onClick={openSettings}
                title="Settings"
            >
                <Settings size={18} />
            </button>

            {/* Modal overlay */}
            {isOpen && (
                <div className="settings-overlay" onClick={closeSettings}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="settings-header">
                            <div className="settings-title">
                                <Settings size={18} />
                                <span>Settings</span>
                            </div>
                            <button className="settings-close" onClick={closeSettings}>
                                <X size={18} />
                            </button>
                        </div>




                        {/* Connection Mode */}
                        <div className="settings-section">
                            <label className="settings-label">Connection Mode</label>
                            <div className="settings-provider-btns">
                                <button
                                    className={`settings-provider-btn ${apiMode === 'backend' ? 'active' : ''}`}
                                    onClick={() => setApiMode('backend')}
                                    title="Use our secure proxy with daily limits"
                                >
                                    🌍 Demo
                                </button>
                                <button
                                    className={`settings-provider-btn ${apiMode === 'local' ? 'active' : ''}`}
                                    onClick={() => setApiMode('local')}
                                    title="Use your own OpenRouter key directly"
                                >
                                    🔑 Personal Key
                                </button>
                            </div>
                        </div>

                        {/* API Key Input (Only if Local Mode) */}
                        {apiMode === 'local' && (
                            <div className="settings-section">
                                <label className="settings-label">
                                    OpenRouter API Key
                                    <span className="settings-label-hint">(Required for Local Mode)</span>
                                </label>
                                <div className="settings-key-row">
                                    <div className="settings-key-input-wrap">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            className="settings-key-input"
                                            placeholder="sk-or-..."
                                            value={apiKeys.openrouter || ''}
                                            onChange={(e) => setApiKey('openrouter', e.target.value)}
                                        />
                                        <button
                                            className="settings-key-toggle"
                                            onClick={() => setShowKey(!showKey)}
                                            title={showKey ? 'Hide' : 'Show'}
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Model Override */}
                        <div className="settings-section">
                            <label className="settings-label">
                                Model
                                <span className="settings-label-hint">
                                    (defaults to {apiMode === 'backend' ? 'minimax/minimax-m2.5' : PROVIDERS.openrouter.defaultModel})
                                </span>
                            </label>
                            <input
                                type="text"
                                className={`settings-model-input ${apiMode === 'backend' ? 'disabled' : ''}`}
                                placeholder={apiMode === 'backend' ? 'minimax/minimax-m2.5' : PROVIDERS.openrouter.defaultModel}
                                value={apiMode === 'backend' ? 'minimax/minimax-m2.5' : modelOverride}
                                onChange={(e) => apiMode !== 'backend' && setModelOverride(e.target.value)}
                                disabled={apiMode === 'backend'}
                            />
                        </div>

                        {/* Status + Save */}
                        <div className="settings-footer">
                            <div className={`settings-status ${isDemo ? 'warn' : 'ok'}`}>
                                {apiMode === 'backend'
                                    ? `⚠️ Using Free Demo (${import.meta.env.VITE_DEMO_LIMIT || 5}/day)`
                                    : (hasKey ? '✓ Key Configured' : '❌ Key Missing')}
                            </div>
                            <button className={`settings-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
                                {saved ? <><Check size={16} /> Saved</> : 'Done'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SettingsModal;
