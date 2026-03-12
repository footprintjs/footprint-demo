import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Play, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExplainableShell, toVisualizationSnapshots } from 'footprint-explainable-ui';
import { FlowchartView, specToReactFlow } from 'footprint-explainable-ui/flowchart';
import '@xyflow/react/dist/style.css';
import { runLoanPipeline, flowchartSpec, type LoanApplication, type LoanResult } from './pipeline';

const defaultApp: LoanApplication = {
  applicantName: 'Bob Martinez',
  annualIncome: 42_000,
  monthlyDebts: 2_100,
  creditScore: 580,
  employmentStatus: 'self-employed',
  employmentYears: 1,
  loanAmount: 40_000,
};

export function LoanApp() {
  const [form, setForm] = useState<LoanApplication>({ ...defaultApp });
  const [result, setResult] = useState<LoanResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setResult(null);
    try {
      const r = await runLoanPipeline(form);
      setResult(r);
    } finally {
      setRunning(false);
    }
  };

  // Convert footprint runtime snapshot → explainable-ui StageSnapshots
  const snapshots = useMemo(() => {
    if (!result) return [];
    return toVisualizationSnapshots(result.runtimeSnapshot as any);
  }, [result]);

  // Convert flowchart spec → ReactFlow nodes/edges (static structure)
  const { nodes: rfNodes, edges: rfEdges } = useMemo(
    () => specToReactFlow(flowchartSpec as any),
    [],
  );

  // Flowchart renderer for ExplainableShell
  const renderFlowchart = useCallback(
    (props: { snapshots: any[]; selectedIndex: number; onNodeClick?: (i: number) => void }) => (
      <FlowchartView
        nodes={rfNodes}
        edges={rfEdges}
        snapshots={props.snapshots}
        selectedIndex={props.selectedIndex}
        onNodeClick={props.onNodeClick}
      />
    ),
    [rfNodes, rfEdges],
  );

  const decisionColor = result?.riskTier === 'low'
    ? 'text-emerald-600 dark:text-emerald-400'
    : result?.riskTier === 'high'
      ? 'text-red-500 dark:text-red-400'
      : 'text-amber-500 dark:text-amber-400';

  const decisionBg = result?.riskTier === 'low'
    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
    : result?.riskTier === 'high'
      ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50'
      : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Apps
      </Link>

      <h1 className="text-2xl font-bold mb-1">Loan Application</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Submit a loan application and see how footprint.js captures every decision.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Applicant Name">
            <input
              type="text"
              value={form.applicantName}
              onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual Income ($)">
              <input
                type="number"
                value={form.annualIncome}
                onChange={(e) => setForm((f) => ({ ...f, annualIncome: +e.target.value }))}
                className="input-field"
              />
            </Field>
            <Field label="Monthly Debts ($)">
              <input
                type="number"
                value={form.monthlyDebts}
                onChange={(e) => setForm((f) => ({ ...f, monthlyDebts: +e.target.value }))}
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Credit Score">
            <input
              type="number"
              min={300}
              max={850}
              value={form.creditScore}
              onChange={(e) => setForm((f) => ({ ...f, creditScore: +e.target.value }))}
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Employment Status">
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm((f) => ({ ...f, employmentStatus: e.target.value as LoanApplication['employmentStatus'] }))}
                className="input-field"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </Field>
            <Field label="Years Employed">
              <input
                type="number"
                min={0}
                value={form.employmentYears}
                onChange={(e) => setForm((f) => ({ ...f, employmentYears: +e.target.value }))}
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Loan Amount ($)">
            <input
              type="number"
              value={form.loanAmount}
              onChange={(e) => setForm((f) => ({ ...f, loanAmount: +e.target.value }))}
              className="input-field"
            />
          </Field>

          <button
            type="submit"
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-emerald-600 hover:bg-emerald-700 text-white font-medium
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Submit Application
              </>
            )}
          </button>
        </form>

        {/* Result */}
        <div>
          {result ? (
            <div className="space-y-4">
              {/* Decision card */}
              <div className={`rounded-xl border p-5 ${decisionBg}`}>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Decision
                </p>
                <p className={`text-lg font-bold ${decisionColor}`}>
                  {result.decision}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Credit Tier" value={result.creditTier} />
                <StatCard label="DTI Ratio" value={`${result.dtiPercent}%`} />
                <StatCard label="Risk Tier" value={result.riskTier} />
              </div>

              {/* Risk factors */}
              {result.riskFactors.length > 0 && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                    Risk Factors
                  </p>
                  <ul className="space-y-1">
                    {result.riskFactors.map((f, i) => (
                      <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What happened behind the scenes button */}
              <button
                onClick={() => setShowExplain(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750
                  font-medium text-sm transition-colors"
              >
                <Search className="w-4 h-4 text-emerald-500" />
                What happened behind the scenes?
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
              <p className="text-sm text-zinc-400">
                Submit an application to see the result
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Explainable Shell Modal */}
      {showExplain && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowExplain(false)}
          />
          <div className="relative w-full max-w-5xl h-[80vh] bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700 flex-shrink-0">
              <h2 className="text-sm font-semibold text-zinc-200">
                Behind the Scenes — powered by footprint.js
              </h2>
              <button
                onClick={() => setShowExplain(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ExplainableShell from explainable-ui — with flowchart */}
            <ExplainableShell
              snapshots={snapshots}
              resultData={result.snapshot}
              narrative={result.narrative}
              tabs={['explainable', 'ai-compatible', 'result']}
              defaultTab="explainable"
              renderFlowchart={renderFlowchart}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5 capitalize">{value}</p>
    </div>
  );
}
