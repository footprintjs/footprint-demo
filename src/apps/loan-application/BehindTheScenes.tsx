import { useState, useMemo, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Copy, Check, Eye, Brain, Zap, Settings, AlertTriangle, GitBranch, BarChart3 } from 'lucide-react';
import {
  TimeTravelControls,
  MemoryInspector,
  ScopeDiff,
  NarrativeTrace,
  FootprintTheme,
  useDarkModeTokens,
  type StageSnapshot,
} from 'footprint-explainable-ui';
import { TracedFlowchartView } from 'footprint-explainable-ui/flowchart';
import '@xyflow/react/dist/style.css';
import type { SpecNode } from 'footprint-explainable-ui/flowchart';

// ── Types ───────────────────────────────────────────────────────────────

interface BehindTheScenesProps {
  snapshots: StageSnapshot[];
  narrative: string[];
  spec: SpecNode;
  appName: string;
  onClose: () => void;
  withoutPrompt: string;
  withPrompt: string;
}

// ── Eval prompt builder (generic — works for any app) ────────────────

function buildEvalPrompt(withoutPrompt: string, withPrompt: string): string {
  return `You are an AI systems evaluator. A company is deciding between two approaches for LLM-powered decision making. Below are the exact prompts each approach would send to the LLM.

═══════════════════════════════════════
APPROACH A — Raw Data (No footprint.js)
═══════════════════════════════════════
${withoutPrompt}

═══════════════════════════════════════
APPROACH B — Structured Trace (With footprint.js)
═══════════════════════════════════════
${withPrompt}

═══════════════════════════════════════
EVALUATION
═══════════════════════════════════════
Produce a deployment-ready comparison report. Work through each section step by step.

**1. Reasoning Complexity**
For each approach, list the exact inference steps the LLM must perform to reach the correct answer. Count them. Which approach offloads more work from the LLM?

**2. Accuracy Under Pressure**
Rate each approach (0–100%) on likelihood of correct outcome. Identify specific failure modes — where exactly would the LLM go wrong with each?

**3. The Real Cost Question**
This is the key insight to explore:
- Approach A has fewer input tokens, but REQUIRES a high-end model (GPT-4, Claude Opus) to reason through raw data reliably.
- Approach B has more input tokens, but the reasoning is pre-computed — even a cheap model (GPT-4o-mini, Claude Haiku) can succeed.

Calculate the TOTAL COST for each approach:
  Total cost = input tokens × per-token price of the CHEAPEST model that reliably succeeds

Use approximate pricing:
  - Claude Opus / GPT-4: ~$15/M input tokens
  - Claude Haiku / GPT-4o-mini: ~$0.25/M input tokens

Which approach is actually cheaper when you factor in the model tier required?

**4. Scaling Analysis**
In production, complexity grows — more data, more rules, more edge cases. How does each approach degrade? At what point does Approach A become unreliable even with expensive models?

**5. Hallucination Surface**
For each approach, identify exactly where the LLM might fabricate information. Which approach gives the LLM fewer degrees of freedom to hallucinate?

**6. ROI Summary**
Format as a markdown table:
| Metric | Raw Data (A) | Structured Trace (B) | Winner |
Include rows for: accuracy, model tier required, input token cost, total cost (tokens × model), scalability, hallucination risk, and overall.

**7. Bottom Line**
One clear paragraph: considering that structured traces let you drop from a $15/M-token model to a $0.25/M-token model, what is the actual cost reduction? Would you deploy A or B in production, and why?`;
}

// ── Step definitions ────────────────────────────────────────────────────

const STEPS = [
  { id: 'watch', label: 'Watch it run', icon: Eye },
  { id: 'captured', label: 'We captured everything', icon: Brain },
  { id: 'llm', label: 'Feed it to an LLM', icon: Zap },
  { id: 'control', label: 'You control it', icon: Settings },
] as const;

// ── Main component ──────────────────────────────────────────────────────

export function BehindTheScenes({ snapshots, narrative, spec, appName, onClose, withoutPrompt, withPrompt }: BehindTheScenesProps) {
  const fpTokens = useDarkModeTokens();
  const [step, setStep] = useState(0);
  const [snapshotIdx, setSnapshotIdx] = useState(0);

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  return (
    <>
    {/* ── Desktop: modal overlay ──────────────────────────────────────── */}
    <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm bts-backdrop" onClick={onClose} />

      {/* Flash */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full bg-indigo-400/30 dark:bg-indigo-500/20 bts-flash" />
      </div>

      <FootprintTheme tokens={fpTokens}>
      <div className="relative w-[1100px] h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700/50 flex flex-col overflow-hidden bts-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Behind the Scenes
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{appName}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden lg:inline">powered by footprint.js</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-3 sm:px-6 py-2 sm:py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                  ${isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-300 dark:ring-zinc-600'
                    : isDone
                      ? 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {step === 0 && (
            <StepWatch
              snapshots={snapshots}
              spec={spec}
              snapshotIdx={snapshotIdx}
              onSnapshotChange={setSnapshotIdx}
            />
          )}
          {step === 1 && (
            <StepCaptured
              snapshots={snapshots}
              narrative={narrative}
              snapshotIdx={snapshotIdx}
              onSnapshotChange={setSnapshotIdx}
            />
          )}
          {step === 2 && (
            <StepLLM narrative={narrative} withoutPrompt={withoutPrompt} withPrompt={withPrompt} />
          )}
          {step === 3 && (
            <StepControl />
          )}
        </div>

        {/* Footer navigation */}
        <StepFooter step={step} setStep={setStep} canPrev={canPrev} canNext={canNext} onClose={onClose} />
      </div>
      </FootprintTheme>
    </div>

    {/* ── Mobile: inline page replacement ─────────────────────────────── */}
    <FootprintTheme tokens={fpTokens}>
    <div className="sm:hidden bts-flip-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Behind the Scenes
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">footprint.js</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator — scrollable pills */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-300 dark:ring-zinc-600'
                  : isDone
                    ? 'text-zinc-500 dark:text-zinc-400'
                    : 'text-zinc-400 dark:text-zinc-600'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Content — natural height, page scrolls, extra padding for sticky footer */}
      <div className="min-h-[60vh] pb-16">
        {step === 0 && (
          <StepWatch snapshots={snapshots} spec={spec} snapshotIdx={snapshotIdx} onSnapshotChange={setSnapshotIdx} />
        )}
        {step === 1 && (
          <StepCaptured snapshots={snapshots} narrative={narrative} snapshotIdx={snapshotIdx} onSnapshotChange={setSnapshotIdx} />
        )}
        {step === 2 && (
          <StepLLM narrative={narrative} withoutPrompt={withoutPrompt} withPrompt={withPrompt} />
        )}
        {step === 3 && (
          <StepControl />
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10">
        <StepFooter step={step} setStep={setStep} canPrev={canPrev} canNext={canNext} onClose={onClose} />
      </div>
    </div>
    </FootprintTheme>
    </>
  );
}

// ── Step 1: Watch it run ────────────────────────────────────────────────

function StepWatch({
  snapshots,
  spec,
  snapshotIdx,
  onSnapshotChange,
}: {
  snapshots: StageSnapshot[];
  spec: SpecNode;
  snapshotIdx: number;
  onSnapshotChange: (i: number) => void;
}) {
  const currentSnap = snapshots[snapshotIdx];

  const currentMemory = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (let i = 0; i <= Math.min(snapshotIdx, snapshots.length - 1); i++) {
      Object.assign(merged, snapshots[i]?.memory);
    }
    return merged;
  }, [snapshots, snapshotIdx]);

  const prevMemory = useMemo(() => {
    if (snapshotIdx === 0) return null;
    const merged: Record<string, unknown> = {};
    for (let i = 0; i < snapshotIdx; i++) {
      Object.assign(merged, snapshots[i]?.memory);
    }
    return merged;
  }, [snapshots, snapshotIdx]);

  return (
    <div className="h-full flex flex-col">
      {/* Explainer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
          As each stage executes, footprint.js <strong className="text-amber-600 dark:text-amber-400">automatically collects</strong> every
          read, write, and decision as a side effect. Use the controls below to step through.
        </p>
      </div>

      {/* Time travel controls */}
      <div className="px-4 sm:px-6 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0 flex items-center gap-2 sm:gap-4">
        <TimeTravelControls
          snapshots={snapshots}
          selectedIndex={snapshotIdx}
          onIndexChange={onSnapshotChange}
          style={{ flex: 1 }}
        />
        {currentSnap && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0 hidden sm:block">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{currentSnap.stageLabel}</span>
            <span className="ml-2">{currentSnap.durationMs}ms</span>
          </div>
        )}
      </div>

      {/* Main content: flowchart + memory sidebar — stacked on mobile */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Flowchart */}
        <div className="min-h-[250px] h-[40vh] lg:h-auto lg:flex-1 min-w-0 flex-shrink-0">
          <TracedFlowchartView
            spec={spec}
            snapshots={snapshots}
            snapshotIndex={snapshotIdx}
            onNodeClick={(i) => { if (typeof i === 'number') onSnapshotChange(i); }}
          />
        </div>

        {/* Memory sidebar — below flowchart on mobile, right sidebar on desktop */}
        <div className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col lg:overflow-hidden">
          {/* Stage header */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                currentSnap?.status === 'done' ? 'bg-amber-500 dark:bg-amber-400'
                  : currentSnap?.status === 'active' ? 'bg-blue-500 dark:bg-blue-400 animate-pulse'
                    : 'bg-zinc-300 dark:bg-zinc-600'
              }`} />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {currentSnap?.stageLabel ?? 'Ready'}
              </span>
            </div>
            {currentSnap?.description && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{currentSnap.description}</p>
            )}
          </div>

          {/* What changed + Memory state */}
          <div className="flex-1 lg:overflow-y-auto">
            <div className="px-4 py-3">
              <SectionLabel>What changed</SectionLabel>
              <ScopeDiff
                previous={prevMemory}
                current={currentMemory}
                hideUnchanged
                style={{ fontSize: 12 }}
              />
            </div>

            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/50">
              <SectionLabel>Memory state</SectionLabel>
              <MemoryInspector
                snapshots={snapshots}
                selectedIndex={snapshotIdx}
                highlightNew
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: We captured everything ──────────────────────────────────────

function StepCaptured({
  snapshots,
  narrative,
  snapshotIdx,
  onSnapshotChange,
}: {
  snapshots: StageSnapshot[];
  narrative: string[];
  snapshotIdx: number;
  onSnapshotChange: (i: number) => void;
}) {
  // Map snapshot index → narrative line count using "Stage N:" boundaries.
  // CombinedNarrativeRecorder emits "Stage N:" for each stage and [Condition]
  // for decisions. Only count "Stage N:" as boundaries — conditions are part of
  // the preceding decision stage, not a separate group.
  const revealedCount = useMemo(() => {
    if (!narrative.length || !snapshots.length) return narrative.length;

    // Find line indices where "Stage N:" begins a new group
    const stageStartLines: number[] = [];
    for (let i = 0; i < narrative.length; i++) {
      if (/^\s*Stage \d+:/.test(narrative[i])) {
        stageStartLines.push(i);
      }
    }

    if (stageStartLines.length === 0) return narrative.length;

    // snapshotIdx 0 → reveal 1 stage group, snapshotIdx N-1 → reveal all
    const targetGroupCount = Math.min(
      stageStartLines.length,
      Math.floor((snapshotIdx / Math.max(1, snapshots.length - 1)) * stageStartLines.length) + 1,
    );

    if (targetGroupCount >= stageStartLines.length) return narrative.length;

    // Reveal up to the start of the next unrevealed group
    return stageStartLines[targetGroupCount];
  }, [narrative, snapshots, snapshotIdx]);

  return (
    <div className="h-full flex flex-col">
      {/* Explainer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
          Because we collected side effects <strong className="text-blue-600 dark:text-blue-400">during traversal</strong> (not after),
          we can programmatically construct a <strong className="text-blue-600 dark:text-blue-400">structured narrative</strong> that
          both humans and LLMs can follow. Scrub through to see it build up.
        </p>
      </div>

      {/* Time travel controls */}
      <div className="px-4 sm:px-6 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
        <TimeTravelControls
          snapshots={snapshots}
          selectedIndex={snapshotIdx}
          onIndexChange={onSnapshotChange}
          style={{ width: '100%' }}
        />
      </div>

      {/* Narrative trace */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
        <NarrativeTrace
          narrative={narrative}
          revealedCount={revealedCount}
          style={{ maxWidth: 700 }}
        />
      </div>

      {/* Bottom callout */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
        <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
          <Brain className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300/80">
            This narrative was generated <strong>automatically</strong> from the execution trace &mdash;
            no manual logging required. Every stage's reads, writes, and decisions are captured
            as the pipeline runs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Feed it to an LLM ──────────────────────────────────────────

function StepLLM({ narrative, withoutPrompt, withPrompt }: { narrative: string[]; withoutPrompt: string; withPrompt: string }) {
  const [copiedPanel, setCopiedPanel] = useState<'without' | 'with' | 'eval' | null>(null);

  const narrativeText = useMemo(() => narrative.join('\n'), [narrative]);
  const evalPrompt = useMemo(() => buildEvalPrompt(withoutPrompt, withPrompt), [withoutPrompt, withPrompt]);

  const handleCopy = useCallback(async (panel: 'without' | 'with' | 'eval') => {
    const text = panel === 'without' ? withoutPrompt : panel === 'with' ? withPrompt : evalPrompt;
    await navigator.clipboard.writeText(text);
    setCopiedPanel(panel);
    setTimeout(() => setCopiedPanel(null), 2000);
  }, [withoutPrompt, withPrompt, evalPrompt]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Organic intro */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl">
          The structured trace footprint.js produces is <strong className="text-amber-600 dark:text-amber-400">designed for LLM consumption</strong>.
          But don't take our word for it &mdash; copy each prompt below into ChatGPT or Claude and see the difference yourself.
        </p>

        {/* Organic summary — why this matters */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
          <div className="flex-1 rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20 p-3">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">Without footprint.js</p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Raw data dumped into a prompt. The LLM has to correlate, infer causality, and guess at thresholds.
              Requires expensive models. Inconsistent across runs.
            </p>
          </div>
          <div className="flex-1 rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">With footprint.js</p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Structured trace &mdash; {narrative.length} lines (~{Math.ceil(narrativeText.length / 4)} tokens).
              Causal links pre-computed. Works with cheap models. Deterministic.
            </p>
          </div>
        </div>
      </div>

      {/* Three copyable prompts */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {/* Prompt 1: Without */}
        <PromptPanel
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          title="Without footprint.js"
          subtitle="Raw data, no trace"
          accent="stone"
          text={withoutPrompt}
          copied={copiedPanel === 'without'}
          onCopy={() => handleCopy('without')}
        />

        {/* Prompt 2: With */}
        <PromptPanel
          icon={<GitBranch className="w-3.5 h-3.5" />}
          title="With footprint.js"
          subtitle="Structured execution trace"
          accent="amber"
          text={withPrompt}
          copied={copiedPanel === 'with'}
          onCopy={() => handleCopy('with')}
        />

        {/* Prompt 3: Evaluate */}
        <PromptPanel
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          title="Evaluate Both"
          subtitle="Ask the LLM: total cost = tokens × model tier — which is actually cheaper?"
          accent="violet"
          text={evalPrompt}
          copied={copiedPanel === 'eval'}
          onCopy={() => handleCopy('eval')}
        />

        {/* Bottom callout — organic, not numbered */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 max-w-3xl">
          <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300/80">
            <strong>Try it now:</strong> Copy any prompt and paste it into Claude Haiku or GPT-4o-mini.
            The structured trace gives even cheap models enough context to reason about the full execution &mdash;
            no expensive model required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Prompt panel component ───────────────────────────────────────────

function PromptPanel({
  icon,
  title,
  subtitle,
  accent,
  text,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: 'stone' | 'amber' | 'violet';
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const styles = {
    stone: {
      border: 'border-zinc-200 dark:border-zinc-800',
      iconColor: 'text-stone-500',
      btnBg: 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
      textColor: 'text-zinc-500 dark:text-zinc-400',
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-800/40',
      iconColor: 'text-amber-500',
      btnBg: 'bg-amber-100 dark:bg-amber-600/20 hover:bg-amber-200 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600/30',
      textColor: 'text-amber-400/80 dark:text-amber-300/70',
    },
    violet: {
      border: 'border-violet-200 dark:border-violet-800/40',
      iconColor: 'text-violet-500',
      btnBg: 'bg-violet-100 dark:bg-violet-600/20 hover:bg-violet-200 dark:hover:bg-violet-600/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-600/30',
      textColor: 'text-violet-400/80 dark:text-violet-300/70',
    },
  };

  const s = styles[accent];

  return (
    <div className={`rounded-xl border ${s.border} overflow-hidden`}>
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 min-w-0">
          <span className={s.iconColor}>{icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 ml-2 hidden sm:inline">{subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            {expanded ? 'Collapse' : 'Preview'}
          </button>
          <button
            onClick={onCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${s.btnBg}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy prompt'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="overflow-y-auto max-h-52 px-4 sm:px-5 py-3 bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
          <pre className={`text-[10px] sm:text-[11px] ${s.textColor} font-mono whitespace-pre-wrap leading-relaxed`}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Step 4: You control it ──────────────────────────────────────────────

function StepControl() {
  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Explainer */}
      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl">
        Worried about storage or network overhead? <strong className="text-violet-600 dark:text-violet-400">You choose the narrative strategy.</strong>{' '}
        footprint.js ships <strong>8 built-in strategies</strong> that plug in at build time &mdash;
        from full verbosity to heavily compressed summaries. The pipeline runs identically either way.
      </p>

      {/* Strategy table */}
      <div className="max-w-4xl">
        <SectionLabel>Built-in narrative strategies</SectionLabel>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">Strategy</th>
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">What it does</th>
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">Best for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {STRATEGIES.map((s) => (
                <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-violet-600 dark:text-violet-400 whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{s.desc}</td>
                  <td className="px-4 py-2 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">{s.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        {/* Full narrative */}
        <CodeCard
          title="Default: full narrative"
          subtitle="Every read, write, and decision"
          accent="amber"
          code={`import { FlowChartBuilder, FlowChartExecutor } from 'footprintjs';

const chart = new FlowChartBuilder()
  .setEnableNarrative()  // ← enables default strategy
  .start('Receive', receiveFn, 'receive')
  .addFunction('Process', processFn, 'process')
  .build();

const executor = new FlowChartExecutor(chart);
await executor.run({ input: data });

// Combined narrative: flow + data interleaved during traversal
const narrative = executor.getNarrative();
// Structured entries with metadata (type, stage, depth)
const entries = executor.getNarrativeEntries();
// Flow-only narrative (no data operations)
const flowOnly = executor.getFlowNarrative();`}
        />

        {/* Attach strategy */}
        <CodeCard
          title="Plug in a strategy"
          subtitle="Attach any recorder before execution"
          accent="violet"
          code={`import {
  FlowChartExecutor,
  WindowedNarrativeFlowRecorder,
  SilentNarrativeFlowRecorder,
  AdaptiveNarrativeFlowRecorder,
} from 'footprintjs';

const executor = new FlowChartExecutor(chart);

// Show first 3 + last 2 loop iterations, skip middle
executor.attachFlowRecorder(
  new WindowedNarrativeFlowRecorder(3, 2)
);

// Or: suppress all loop detail, emit one-line summary
executor.attachFlowRecorder(
  new SilentNarrativeFlowRecorder()
);

// Or: full detail until iteration 5, then sample every 10th
executor.attachFlowRecorder(
  new AdaptiveNarrativeFlowRecorder(5, 10)
);

await executor.run({ input: data });`}
        />

        {/* Combined narrative control */}
        <CodeCard
          title="Data-level detail"
          subtitle="Control how scope operations appear in narrative"
          accent="blue"
          code={`import { CombinedNarrativeRecorder } from 'footprintjs';

// Default: flow + data interleaved with step numbers and values
// Stage 1: The process began: Receive the application.
//   Step 1: Write applicantName = "Bob"
//   Step 2: Write loanAmount = 40000

// Hide step numbers
const recorder = new CombinedNarrativeRecorder({
  includeStepNumbers: false,
});

// Hide values (show keys only)
const keysOnly = new CombinedNarrativeRecorder({
  includeValues: false,
});

// Truncate long values (default: 80 chars)
const compact = new CombinedNarrativeRecorder({
  maxValueLength: 40,
});

// Inside stage functions — you control what's tracked:
const myStage = async (scope) => {
  scope.setValue('result', data);          // ← tracked
  scope.addDebugInfo('timing', { ms: 42 }); // ← debug only
};`}
        />

        {/* Disabled */}
        <CodeCard
          title="Disabled: zero overhead"
          subtitle="Production mode — no collection"
          accent="zinc"
          code={`// Simply don't enable narrative — no overhead at all
const chart = new FlowChartBuilder()
  // no .setEnableNarrative()
  .start('Receive', receiveFn, 'receive')
  .addFunction('Process', processFn, 'process')
  .build();

const executor = new FlowChartExecutor(chart);
await executor.run({ input: data });

// No narrative collected — pipeline runs identically
executor.getNarrative();  // → []

// Snapshot still available (timing + final state)
executor.getSnapshot();   // → { sharedState, stages, ... }`}
        />
      </div>

      {/* Bottom callout */}
      <div className="max-w-4xl flex items-start gap-3 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/30">
        <Settings className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-violet-800 dark:text-violet-300/90 font-medium">
            Collect during traversal &mdash; not after.
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-300/60 mt-1">
            All strategies hook into the same single traversal pass that executes your pipeline.
            There's no post-processing walk, no separate collection phase.
            Swap strategies with one line — the pipeline behavior stays identical.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared footer ────────────────────────────────────────────────────────

function StepFooter({ step, setStep, canPrev, canNext, onClose }: {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  canPrev: boolean;
  canNext: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
      <button
        onClick={() => setStep((s) => s - 1)}
        disabled={!canPrev}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
          text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <span className="text-xs text-zinc-400 dark:text-zinc-600">
        {step + 1} / {STEPS.length}
      </span>

      {canNext ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
            bg-amber-600 hover:bg-amber-500 text-white transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
            bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-all"
        >
          Done
        </button>
      )}
    </div>
  );
}

// ── Strategy data ───────────────────────────────────────────────────────

const STRATEGIES = [
  { name: 'NarrativeFlowRecorder', desc: 'Full narrative — every stage, decision, fork', bestFor: 'Dev / debugging' },
  { name: 'WindowedFlowRecorder', desc: 'Show first N + last M iterations, skip middle', bestFor: '10-200 iteration loops' },
  { name: 'SilentFlowRecorder', desc: 'Suppress per-iteration detail, emit one summary', bestFor: 'Noisy loops' },
  { name: 'AdaptiveFlowRecorder', desc: 'Full detail until threshold, then sample', bestFor: 'Unknown loop counts' },
  { name: 'ProgressiveFlowRecorder', desc: 'Exponential sampling (1, 2, 4, 8, 16...)', bestFor: 'Convergence loops' },
  { name: 'MilestoneFlowRecorder', desc: 'Emit every Nth iteration', bestFor: 'High-iteration progress' },
  { name: 'RLEFlowRecorder', desc: 'Run-length encode consecutive identical loops', bestFor: 'Simple retry loops' },
  { name: 'SeparateFlowRecorder', desc: 'Keep main narrative clean, store loops separately', bestFor: 'UI / collapsible sections' },
];

// ── Shared helpers ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
      {children}
    </p>
  );
}

function CodeCard({
  title,
  subtitle,
  accent,
  code,
}: {
  title: string;
  subtitle: string;
  accent: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const borderColor: Record<string, string> = {
    amber: 'border-amber-200 dark:border-amber-800/40',
    stone: 'border-stone-200 dark:border-stone-800/40',
    zinc: 'border-zinc-300 dark:border-zinc-700/60',
    blue: 'border-blue-200 dark:border-blue-800/40',
    violet: 'border-violet-200 dark:border-violet-800/40',
  };

  const titleColor: Record<string, string> = {
    amber: 'text-amber-700 dark:text-amber-400',
    stone: 'text-stone-600 dark:text-stone-400',
    zinc: 'text-zinc-600 dark:text-zinc-400',
    blue: 'text-blue-700 dark:text-blue-400',
    violet: 'text-violet-700 dark:text-violet-400',
  };

  return (
    <div className={`rounded-lg border ${borderColor[accent] ?? borderColor.zinc} bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/50">
        <div>
          <p className={`text-xs font-semibold ${titleColor[accent] ?? titleColor.zinc}`}>{title}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600">{subtitle}</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="px-4 py-3 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
