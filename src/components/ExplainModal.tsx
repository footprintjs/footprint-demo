import { useState } from 'react';
import { X, Copy, Check, Clock, MessageSquare, Bot } from 'lucide-react';

interface ExplainModalProps {
  open: boolean;
  onClose: () => void;
  executionTrace: string[];
  humanNarrative: string[];
  aiContext: string;
}

type Tab = 'trace' | 'narrative' | 'ai';

export function ExplainModal({
  open,
  onClose,
  executionTrace,
  humanNarrative,
  aiContext,
}: ExplainModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trace');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(aiContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'trace', label: 'Execution Trace', icon: Clock },
    { id: 'narrative', label: 'Human Explanation', icon: MessageSquare },
    { id: 'ai', label: 'AI Context', icon: Bot },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Explain This Result</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'trace' && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 mb-4">
                Step-by-step execution trace — what happened in the backend, in order.
              </p>
              <div className="font-mono text-sm space-y-0.5">
                {executionTrace.map((line, i) => (
                  <div
                    key={i}
                    className="py-1 px-3 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="text-zinc-400 mr-3 select-none">{String(i + 1).padStart(2, ' ')}.</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'narrative' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-4">
                Human-readable explanation — no programming knowledge needed.
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {humanNarrative.map((line, i) => (
                  <p key={i} className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  Structured context ready for LLM follow-up. Copy and paste into ChatGPT, Claude, etc.
                </p>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                    bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to clipboard
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {aiContext}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
