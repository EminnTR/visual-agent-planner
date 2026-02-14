import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, PenLine, Cpu, Package } from 'lucide-react';
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

const PromptBar = ({ onSuggest, onPreset, isLoading, compact = false }) => {
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef(null);

    const examples = PRESETS.map(p => p.prompt);

    useEffect(() => {
        if (inputRef.current && !compact) {
            inputRef.current.focus();
        }
    }, [compact]);

    const handleSubmit = async (text) => {
        const projectDesc = text || prompt;
        if (!projectDesc.trim() || isLoading) return;
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
                <div className="prompt-compact-inner">
                    <Sparkles size={16} className="prompt-sparkle" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="prompt-input-compact"
                        placeholder="Describe a new project..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
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

                <div className="prompt-hero-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        className="prompt-hero-input"
                        placeholder="e.g. Build a coloring game web app with AI-generated images..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
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

                {!isLoading && (
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
