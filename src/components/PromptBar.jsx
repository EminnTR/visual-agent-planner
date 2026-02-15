import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, PenLine, Cpu, Package, AlertCircle, X } from 'lucide-react';
import PRESETS from '../data/presets';

const CATEGORIES = [
    { icon: '🤖', label: 'Agents', color: '#60a5fa' },
    { icon: '📜', label: 'Commands', color: '#fb7185' },
    { icon: '🪝', label: 'Hooks', color: '#fbbf24' },
    { icon: '🔗', label: 'MCPs', color: '#34d399' },
    { icon: '⚙️', label: 'Settings', color: '#818cf8' },
    { icon: '🎨', label: 'Skills', color: '#a78bfa' },
];

const HOW_IT_WORKS = [
    {
        icon: PenLine,
        title: 'Describe',
        desc: 'Tell us about your project in one sentence.',
        color: '#60a5fa',
    },
    {
        icon: Cpu,
        title: 'AI Selects',
        desc: 'AI picks the best Agents, Skills, MCPs & more.',
        color: '#a78bfa',
    },
    {
        icon: Package,
        title: 'Install',
        desc: 'Get a single npx command — ready to run.',
        color: '#34d399',
    },
];

const PromptBar = ({ onSuggest, onPreset, isLoading, compact = false, error, onClearError }) => {
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef(null);

    const examples = PRESETS.map(p => p.prompt);

    useEffect(() => {
        if (inputRef.current && !compact) {
            inputRef.current.focus();
        }
    }, [compact]);

    const handleSubmit = async (text) => {
        if (onClearError) onClearError();
        const projectDesc = text || prompt;

        if (!projectDesc.trim() || isLoading) return;

        if (projectDesc.length > 235) {
            // Error logic needs to use a callback or set error state if available
            // Since PromptBar receives 'error' as prop, it might not be able to set it directly if it's controlled by parent.
            // checking props: error, onClearError.
            // Wait, PromptBar doesn't have a setError prop, it receives error.
            // But wait, look at lines 35: const PromptBar = ({ ..., error, onClearError })
            // If I want to trigger an error, I might need to notify the parent or handle it locally if no parent handler.
            // However, the previous implementation of SuggestionEngine has error handling.
            // Actually, I can just use `alert` or if the parent has a way. 
            // Better: The parent `Canvas` controls the error state. I should probably modify Canvas to accept an error, OR specific validation here.
            // Actually, `Canvas` passes `setImageError`? No, `setError`.
            // Let's check Canvas.jsx again.
            // Canvas passes `error` and `onClearError`. It doesn't pass `setError`.
            // So PromptBar cannot *set* the error state if it's lifted to Canvas.
            // I might need to change Canvas.jsx to pass `setError` or `onError`.
            // Let's assume for a moment I can't change the prop signature easily without checking Canvas.
            // NOTE: Canvas passes `onSuggest`. I can wrap `onSuggest` to check length?
            // "onSuggest(projectDesc.trim())"

            // Let's just use window.alert for now? No, that's ugly.
            // I should verify if I can pass error back.
            // Actually, if I can't set error, I can't show the inline error.
            // Checking Canvas.jsx again is wise.

            // Re-reading Canvas.jsx view from earlier:
            // 5: import PromptBar from './PromptBar';
            // ...
            // 64: <PromptBar onSuggest={handleSuggest} onPreset={handlePreset} isLoading={isLoading} error={error} onClearError={() => setError(null)} />
            // ...
            // 99: <PromptBar ... onClearError={() => setError(null)} ... />

            // It only passes onClearError. It does NOT pass onError.
            // So strictly speaking, PromptBar cannot set the error state shown in the UI.
            // I have two options:
            // 1. Modify Canvas.jsx to pass `onError` or `setError`.
            // 2. Handle validation *inside* handleSuggest in Canvas.jsx? 
            // validation in Canvas.jsx is cleaner since it controls the error state.

            // BUT, the prompt state is inside PromptBar.
            // If I do it in Canvas.jsx `handleSuggest(description)`, I can check description.length there.
            // YES. That is the correct place. PromptBar sends the text to onSuggest. Canvas handles it.
            // So in PromptBar, I just remove the maxLength and counter.
            // Then in Canvas.jsx I add the check.
        }

        onSuggest(projectDesc.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Compact mode (shown after generation)
    if (compact) {
        return (
            <div className="prompt-compact">
                <div className={`prompt-compact-inner ${error ? 'has-error' : ''}`}>
                    <Sparkles size={16} className="prompt-sparkle" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="prompt-input-compact"
                        placeholder="Describe a new project..."
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            if (error && onClearError) onClearError();
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="prompt-submit-compact"
                        onClick={() => handleSubmit()}
                        disabled={!prompt.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="spinning" />
                        ) : (
                            <ArrowRight size={16} />
                        )}
                    </button>
                </div>
                {error && (
                    <div className="prompt-error-inline compact">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                        <button onClick={onClearError}><X size={12} /></button>
                    </div>
                )}
            </div>
        );
    }

    // Hero mode (initial state)
    return (
        <div className="prompt-hero">
            <div className="prompt-hero-glow" />

            <div className="prompt-hero-content">
                <h1 className="prompt-hero-title">
                    Visual Agent Planner
                    <span className="prompt-hero-gradient"> (VAP)</span>
                </h1>

                <p className="prompt-hero-subtitle">
                    Explore <strong>1477+</strong> Claude Code templates from the{' '}
                    <a href="https://aitmpl.com" target="_blank" rel="noopener noreferrer">aitmpl.com</a>{' '}
                    catalog. Describe your project, get a ready-to-use config in seconds.
                </p>

                <div className={`prompt-hero-input-wrapper ${error ? 'has-error' : ''}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="prompt-hero-input"
                        placeholder="e.g. Build a coloring game web app with AI-generated images..."
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            if (error && onClearError) onClearError();
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="prompt-hero-submit"
                        onClick={() => handleSubmit()}
                        disabled={!prompt.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="spinning" />
                        ) : (
                            <>
                                <Sparkles size={18} />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="prompt-error-inline hero">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                        <button onClick={onClearError}><X size={14} /></button>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="prompt-examples">
                        <p className="examples-label">Try an example:</p>
                        <div className="examples-pills">
                            {PRESETS.map((preset, i) => (
                                <button
                                    key={i}
                                    className="example-pill"
                                    onClick={() => {
                                        setPrompt(preset.prompt);
                                        if (onPreset) {
                                            onPreset(preset);
                                        } else {
                                            handleSubmit(preset.prompt);
                                        }
                                    }}
                                >
                                    {preset.prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="prompt-loading">
                        <div className="loading-dots">
                            <span /><span /><span />
                        </div>
                        <span className="loading-text">Analyzing your project...</span>
                    </div>
                )}
            </div>

            {/* How It Works */}
            <div className="how-it-works">
                <h2 className="how-it-works-title">How It Works</h2>
                <div className="how-it-works-grid">
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={i} className="how-step" style={{ '--step-color': step.color }}>
                            <div className="how-step-icon">
                                <step.icon size={24} />
                            </div>
                            <div className="how-step-number">{i + 1}</div>
                            <h3 className="how-step-title">{step.title}</h3>
                            <p className="how-step-desc">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Catalog Overview */}
            <div className="hero-catalog">
                <h2 className="hero-catalog-title">What's Inside</h2>
                <div className="hero-catalog-badges">
                    {CATEGORIES.map((cat, i) => (
                        <div key={i} className="hero-cat-badge" style={{ '--cat-color': cat.color }}>
                            <span className="hero-cat-icon">{cat.icon}</span>
                            <span className="hero-cat-label">{cat.label}</span>
                        </div>
                    ))}
                </div>
                <p className="hero-catalog-count">
                    <strong>1477+</strong> templates — ready to install
                </p>
            </div>

            <div className="prompt-hero-footer">
                <span>Templates from </span>
                <a href="https://aitmpl.com" target="_blank" rel="noopener noreferrer">aitmpl.com</a>
            </div>
        </div>
    );
};

export default PromptBar;
