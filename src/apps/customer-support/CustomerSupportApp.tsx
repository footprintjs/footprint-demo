import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toVisualizationSnapshots } from 'footprint-explainable-ui';
import {
  runSupportPipeline,
  flowchartSpec,
  defaultTicket,
  type SupportTicket,
  type SupportResult,
} from './pipeline';
import { BehindTheScenes } from '../loan-application/BehindTheScenes';

export function CustomerSupportApp() {
  const [ticket, setTicket] = useState<SupportTicket>({ ...defaultTicket });
  const [result, setResult] = useState<SupportResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setResult(null);
    try {
      const r = await runSupportPipeline(ticket);
      setResult(r);
    } finally {
      setRunning(false);
    }
  };

  const snapshots = useMemo(() => {
    if (!result) return [];
    return toVisualizationSnapshots(
      result.runtimeSnapshot as any,
      result.narrativeEntries as any,
    );
  }, [result]);

  const resColor = result?.resolutionType === 'auto-refund'
    ? 'text-emerald-600 dark:text-emerald-400'
    : result?.resolutionType === 'escalate'
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-red-500 dark:text-red-400';

  const resBg = result?.resolutionType === 'auto-refund'
    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
    : result?.resolutionType === 'escalate'
      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50'
      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Apps
      </Link>

      <h1 className="text-2xl font-bold mb-1">Customer Support Troubleshooting</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Submit a support ticket and watch footprint.js connect scattered logs across 4 services to find the root cause.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ticket ID">
              <input
                type="text"
                value={ticket.ticketId}
                onChange={(e) => setTicket((t) => ({ ...t, ticketId: e.target.value }))}
                className="input-field"
              />
            </Field>
            <Field label="Customer Email">
              <input
                type="email"
                value={ticket.customerEmail}
                onChange={(e) => setTicket((t) => ({ ...t, customerEmail: e.target.value }))}
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Subject">
            <input
              type="text"
              value={ticket.subject}
              onChange={(e) => setTicket((t) => ({ ...t, subject: e.target.value }))}
              className="input-field"
            />
          </Field>

          <Field label="Ticket Body">
            <textarea
              rows={4}
              value={ticket.body}
              onChange={(e) => setTicket((t) => ({ ...t, body: e.target.value }))}
              className="input-field resize-none"
            />
          </Field>

          {/* Scattered logs preview */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Scattered Logs (across 4 services)
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
              <LogLine service="auth" level="info" msg="User authenticated via OAuth" />
              <LogLine service="payment" level="error" msg="Gateway timeout: Stripe 5000ms" />
              <LogLine service="payment" level="warn" msg="Retry #1 — status unknown" />
              <LogLine service="payment" level="info" msg="Payment SUCCESS: $189.99" />
              <LogLine service="payment" level="error" msg="DUPLICATE CHARGE detected" />
              <LogLine service="order" level="info" msg="Order marked completed" />
              <LogLine service="notif" level="warn" msg="Duplicate webhook suppressed" />
              <LogLine service="auth" level="info" msg="(noise) mike@ authenticated" />
              <LogLine service="payment" level="info" msg="(noise) ORD-2850 $42.00" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 italic">
              Can you spot the root cause? footprint.js will connect the dots.
            </p>
          </div>

          <button
            type="submit"
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-cyan-600 hover:bg-cyan-700 text-white font-medium
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Investigating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Troubleshooting
              </>
            )}
          </button>
        </form>

        {/* Result */}
        <div>
          {result ? (
            <div className="space-y-4">
              {/* Resolution card */}
              <div className={`rounded-xl border p-5 ${resBg}`}>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Resolution
                </p>
                <p className={`text-sm font-bold ${resColor}`}>
                  {result.resolution}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Category" value={result.category} />
                <StatCard label="Priority" value={result.priority} />
                <StatCard label="Customer" value={result.customerTier} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Logs Found" value={String(result.logCount)} />
                <StatCard label="Services" value={String(result.servicesSearched)} />
                <StatCard label="Order" value={`$${result.orderAmount?.toFixed(2) ?? '—'}`} />
              </div>

              {/* Error chain */}
              {result.errorChain.length > 0 && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                    Error Chain (reconstructed from scattered logs)
                  </p>
                  <ul className="space-y-1.5">
                    {result.errorChain.map((e, i) => (
                      <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2 font-mono">
                        <span className="text-red-400 mt-0.5 shrink-0">{i + 1}.</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Behind the scenes */}
              <button
                onClick={() => setShowExplain(true)}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl
                  bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600
                  text-white font-semibold text-sm shadow-lg shadow-cyan-500/25
                  ring-2 ring-cyan-400/30 dark:ring-cyan-400/20
                  hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.01]
                  transition-all duration-200 animate-[pulse_3s_ease-in-out_1]"
              >
                <Search className="w-4 h-4" />
                How did it connect the dots?
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6">
              <p className="text-sm text-zinc-400 text-center">
                Run the troubleshooting to see how footprint.js<br />
                correlates scattered logs into a root cause
              </p>
            </div>
          )}
        </div>
      </div>

      {showExplain && result && (
        <BehindTheScenes
          snapshots={snapshots}
          narrative={result.narrative}
          spec={flowchartSpec as any}
          onClose={() => setShowExplain(false)}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function LogLine({ service, level, msg }: { service: string; level: string; msg: string }) {
  const color = level === 'error'
    ? 'text-red-500'
    : level === 'warn'
      ? 'text-amber-500'
      : 'text-zinc-400 dark:text-zinc-500';
  const svcColor = {
    auth: 'text-blue-400',
    payment: 'text-violet-400',
    order: 'text-emerald-400',
    notif: 'text-amber-400',
  }[service] ?? 'text-zinc-400';

  return (
    <div className="flex gap-2">
      <span className={`${svcColor} shrink-0 w-16 text-right`}>[{service}]</span>
      <span className={color}>{msg}</span>
    </div>
  );
}
