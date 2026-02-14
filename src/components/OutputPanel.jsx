import { useState } from 'react';
import useStore from '../store';
import { Copy, Download, Check, Terminal } from 'lucide-react';

const OutputPanel = () => {
    const [copied, setCopied] = useState(false);

    const { getInstallCommand, getTotalCount } = useStore();
    const installCmd = getInstallCommand();
    const totalCount = getTotalCount();

    if (totalCount === 0) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(installCmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = installCmd;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([installCmd], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'install-claude-config.sh';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="output-panel">
            <div className="output-header">
                <div className="output-title">
                    <Terminal size={16} />
                    <span>Install Command</span>
                    <span className="output-badge">{totalCount} components</span>
                </div>
                <div className="output-actions">
                    <button className="output-btn" onClick={handleCopy}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button className="output-btn" onClick={handleDownload}>
                        <Download size={14} />
                        <span>Download</span>
                    </button>
                </div>
            </div>
            <pre className="output-code">{installCmd}</pre>
            <div className="output-hint">
                Run this command in your project root to install all selected components.
            </div>
        </div>
    );
};

export default OutputPanel;
