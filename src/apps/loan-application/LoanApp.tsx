import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toVisualizationSnapshots } from 'footprint-explainable-ui';
import { runLoanPipeline, flowchartSpec, type LoanApplication, type LoanResult } from './pipeline';
import { BehindTheScenes } from './BehindTheScenes';

// ── Prompt builders ─────────────────────────────────────────────────

function buildWithoutPrompt(app: LoanApplication): string {
  return `You are a loan underwriter. Evaluate this application and decide whether to approve or reject:

Applicant: ${app.applicantName}
Annual Income: $${app.annualIncome.toLocaleString()}
Monthly Debts: $${app.monthlyDebts.toLocaleString()}
Credit Score: ${app.creditScore}
Employment: ${app.employmentStatus}, ${app.employmentYears} year(s)
Loan Amount: $${app.loanAmount.toLocaleString()}

Based on standard lending criteria, should this loan be approved or rejected? What are the risk factors? Explain your reasoning.`;
}

function buildWithPrompt(app: LoanApplication, result: LoanResult): string {
  return `You are a loan underwriter. An automated underwriting pipeline (powered by footprint.js) already evaluated this application. Here is the complete decision trace — every check, every threshold, every factor:

Applicant: ${app.applicantName}
Loan Amount: $${app.loanAmount.toLocaleString()}

${result.narrative.join('\n')}

Decision: ${result.decision}
Risk Tier: ${result.riskTier}
Risk Factors: ${result.riskFactors.join(', ') || 'None'}

Using the trace above, explain to the applicant:
1. Why the application was ${result.riskTier === 'low' ? 'approved' : 'rejected'}
2. Which specific factors drove the decision
3. What they could change to get a better outcome`;
}

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
  // Pass narrativeEntries so the adapter distributes rich narrative per-stage
  const snapshots = useMemo(() => {
    if (!result) return [];
    return toVisualizationSnapshots(
      result.runtimeSnapshot as any,
      result.narrativeEntries as any,
    );
  }, [result]);

  const withoutPromptText = useMemo(() => buildWithoutPrompt(form), [form]);
  const withPromptText = useMemo(
    () => (result ? buildWithPrompt(form, result) : ''),
    [form, result],
  );

  const decisionColor = result?.riskTier === 'low'
    ? 'text-amber-600 dark:text-amber-400'
    : result?.riskTier === 'high'
      ? 'text-red-500 dark:text-red-400'
      : 'text-orange-500 dark:text-orange-400';

  const decisionBg = result?.riskTier === 'low'
    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50'
    : result?.riskTier === 'high'
      ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50'
      : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/50';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Page content — hidden on mobile when BTS is open */}
      <div className={showExplain ? 'hidden sm:block' : ''}>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Demos
      </Link>

      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Loan Underwriting</h1>
        <p className="text-sm text-stone-500 dark:text-zinc-400 max-w-md leading-relaxed">
          Submit a loan application and see how <span className="font-medium text-zinc-700 dark:text-zinc-300">footprint.js</span> captures every decision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form — glass card */}
        <form onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-5 rounded-2xl border border-stone-200/60 dark:border-zinc-800/60
            bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm p-6 sm:p-8
            shadow-sm shadow-stone-200/50 dark:shadow-none">

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
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl
              bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm
              shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200"
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

        {/* Result — glass card */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              {/* Decision card */}
              <div className={`rounded-2xl border p-6 backdrop-blur-sm ${decisionBg}`}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                  Decision
                </p>
                <p className={`text-xl font-bold ${decisionColor}`}>
                  {result.decision.split('—')[0].trim()}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
                  {result.riskFactors.length} factor{result.riskFactors.length !== 1 ? 's' : ''} evaluated across credit, income, and employment checks.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowExplain(true)}
                className="w-full flex flex-col items-center gap-1.5 px-4 py-5 rounded-2xl
                  bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200
                  text-white dark:text-zinc-900 font-medium
                  shadow-md shadow-zinc-900/10 dark:shadow-zinc-100/5
                  hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Search className="w-4 h-4" />
                  See How It Works
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Flowchart trace, narrative, and every decision captured
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl
              border border-dashed border-stone-300/60 dark:border-zinc-700/60
              bg-stone-50/50 dark:bg-zinc-900/30">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Play className="w-4 h-4 text-stone-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm text-stone-400 dark:text-zinc-500">
                Submit an application to see the result
              </p>
            </div>
          )}
        </div>
      </div>
      </div>{/* end page content wrapper */}

      {/* Behind the Scenes — modal on desktop, inline on mobile */}
      {showExplain && result && (
        <BehindTheScenes
          snapshots={snapshots}
          narrative={result.narrative}
          spec={flowchartSpec as any}
          appName="Loan Application"
          onClose={() => setShowExplain(false)}
          withoutPrompt={withoutPromptText}
          withPrompt={withPromptText}
        />
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

