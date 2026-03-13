import { useState, useMemo, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Copy, Check, Eye, Brain, Zap, Settings } from 'lucide-react';
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
  onClose: () => void;
}

// ── Step definitions ────────────────────────────────────────────────────

const STEPS = [
  { id: 'watch', label: 'Watch it run', icon: Eye },
  { id: 'captured', label: 'We captured everything', icon: Brain },
  { id: 'llm', label: 'Feed it to an LLM', icon: Zap },
  { id: 'control', label: 'You control it', icon: Settings },
] as const;

// ── Main component ──────────────────────────────────────────────────────

export function BehindTheScenes({ snapshots, narrative, spec, onClose }: BehindTheScenesProps) {
  const fpTokens = useDarkModeTokens();
  const [step, setStep] = useState(0);
  const [snapshotIdx, setSnapshotIdx] = useState(0);

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — full screen on mobile, constrained on desktop */}
      <FootprintTheme tokens={fpTokens}>
      <div className="relative w-full h-full sm:max-w-6xl sm:h-[85vh] bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              Behind the Scenes
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">powered by footprint.js</span>
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
            <StepLLM narrative={narrative} />
          )}
          {step === 3 && (
            <StepControl />
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
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
                bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
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
      </div>
      </FootprintTheme>
    </div>
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
          As each stage executes, footprint.js <strong className="text-emerald-600 dark:text-emerald-400">automatically collects</strong> every
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
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Flowchart */}
        <div className="flex-1 min-w-0 min-h-[200px]">
          <TracedFlowchartView
            spec={spec}
            snapshots={snapshots}
            snapshotIndex={snapshotIdx}
            onNodeClick={(i) => { if (typeof i === 'number') onSnapshotChange(i); }}
            showTree={false}
          />
        </div>

        {/* Memory sidebar — below flowchart on mobile, right sidebar on desktop */}
        <div className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
          {/* Stage header */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                currentSnap?.status === 'done' ? 'bg-emerald-500 dark:bg-emerald-400'
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
          <div className="flex-1 overflow-y-auto">
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

function StepLLM({ narrative }: { narrative: string[] }) {
  const [copied, setCopied] = useState(false);

  const narrativeText = useMemo(() => narrative.join('\n'), [narrative]);

  const promptText = useMemo(() =>
`You are analyzing a loan application pipeline execution. Here is the structured execution trace:

${narrativeText}

Based on this trace:
1. Why was this application rejected/approved?
2. What were the key risk factors?
3. If the applicant improved their credit score to 700, would the outcome change?`,
    [narrativeText]
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [promptText]);

  return (
    <div className="h-full flex flex-col">
      {/* Explainer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
          The structured trace is <strong className="text-amber-600 dark:text-amber-400">ready for LLM consumption</strong>.
          Because decisions, conditions, and state changes are captured with causal links,
          even <strong className="text-amber-600 dark:text-amber-400">cheaper models</strong> can reason about what happened &mdash;
          no need to dump raw state or conversation history.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left: the narrative */}
        <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between flex-shrink-0">
            <SectionLabel>Execution trace ({narrative.length} lines)</SectionLabel>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                bg-amber-100 dark:bg-amber-600/20 hover:bg-amber-200 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/30 transition-all"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
            <pre className="text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
              {narrativeText}
            </pre>
          </div>
        </div>

        {/* Right: why this matters */}
        <div className="w-full lg:w-80 flex-shrink-0 p-5 overflow-y-auto space-y-4">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Why structured traces?</h3>

          <ComparisonCard
            title="Without footprint.js"
            bad
            items={[
              'Dump raw state \u2192 20K+ tokens',
              'LLM guesses causality',
              'Requires expensive models',
              'Inconsistent explanations',
            ]}
          />

          <ComparisonCard
            title="With footprint.js"
            items={[
              `Structured trace \u2192 ${narrative.length} lines (~${Math.ceil(narrativeText.length / 4)} tokens)`,
              'Causal links pre-computed',
              'Works with cheaper models',
              'Deterministic, reproducible',
            ]}
          />

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
            <p className="text-xs text-amber-800 dark:text-amber-300/80">
              <strong>Try it:</strong> Copy the prompt above and paste it into Claude Haiku or
              GPT-4o-mini. The structured trace gives cheap models enough context to
              reason about the full pipeline execution.
            </p>
          </div>
        </div>
      </div>
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
          accent="emerald"
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

function ComparisonCard({
  title,
  items,
  bad = false,
}: {
  title: string;
  items: string[];
  bad?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      bad
        ? 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20'
        : 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-950/20'
    }`}>
      <p className={`text-xs font-semibold mb-2 ${bad ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
            <span className={`mt-0.5 ${bad ? 'text-red-500' : 'text-emerald-500'}`}>
              {bad ? '\u2717' : '\u2713'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
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
    emerald: 'border-emerald-200 dark:border-emerald-800/40',
    amber: 'border-amber-200 dark:border-amber-800/40',
    zinc: 'border-zinc-300 dark:border-zinc-700/60',
    blue: 'border-blue-200 dark:border-blue-800/40',
    violet: 'border-violet-200 dark:border-violet-800/40',
  };

  const titleColor: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
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
