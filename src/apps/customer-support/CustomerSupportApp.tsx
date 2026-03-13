import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Loader2, Search, Headset, AlertTriangle, CreditCard, Package, ChevronRight } from 'lucide-react';
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

// ── Prompt builders ─────────────────────────────────────────────────

function buildWithoutPrompt(ticket: SupportTicket): string {
  return `You are a customer support agent. A customer submitted this ticket:

Subject: ${ticket.subject}
Body: ${ticket.body}
Customer: ${ticket.customerEmail}

Here are the raw logs from our systems. Figure out what happened and how to resolve it:

[auth-service] 14:22:55 INFO  User jane.smith@example.com authenticated via OAuth
[auth-service] 14:22:56 INFO  Session created: sess-44bf2
[payment-service] 14:23:00 INFO  Payment initiated for ORD-2847: $189.99
[payment-service] 14:23:01 ERROR Gateway timeout: Stripe did not respond within 5000ms
[payment-service] 14:23:03 WARN  Retry #1 for ORD-2847 — previous attempt status unknown
[auth-service] 14:23:05 INFO  User mike@example.com authenticated
[payment-service] 14:23:06 INFO  Payment SUCCESS for ORD-2850: $42.00
[order-service] 14:23:07 INFO  Order ORD-2849 shipped via FedEx
[payment-service] 14:23:08 INFO  Payment SUCCESS for ORD-2847: $189.99 (charge ch_7x2k)
[payment-service] 14:23:09 WARN  Late response from original attempt: Stripe confirms charge ch_6m1j for ORD-2847
[payment-service] 14:23:09 ERROR DUPLICATE CHARGE detected: ORD-2847 has 2 successful charges (ch_6m1j + ch_7x2k)
[order-service] 14:23:10 INFO  Order ORD-2847 marked as completed
[notification-service] 14:23:11 INFO  Confirmation email sent to jane.smith@example.com for ORD-2847
[notification-service] 14:23:12 WARN  Duplicate payment webhook received — second confirmation suppressed

What is the root cause? What should we do?`;
}

function buildWithPrompt(ticket: SupportTicket, result: SupportResult): string {
  return `You are a customer support agent. A customer submitted this ticket:

Subject: ${ticket.subject}
Body: ${ticket.body}
Customer: ${ticket.customerEmail}

Our automated troubleshooting system (powered by footprint.js) already investigated this ticket.
Here is the complete investigation trace — every step, every decision, every piece of data:

${result.narrative.join('\n')}

Root cause: ${result.snapshot.rootCause}
Resolution: ${result.resolution}

Using the trace above, write a clear, empathetic response to the customer explaining:
1. What happened (in plain English, no technical jargon)
2. What we've done to fix it
3. When they can expect the refund`;
}

// ── Main Component ──────────────────────────────────────────────────

type Scene = 'user' | 'admin';

export function CustomerSupportApp() {
  const [scene, setScene] = useState<Scene>('user');
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

  const withoutPromptText = useMemo(() => buildWithoutPrompt(ticket), [ticket]);
  const withPromptText = useMemo(
    () => (result ? buildWithPrompt(ticket, result) : ''),
    [ticket, result],
  );

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

      {/* ── Scene 1: User-facing ──────────────────────────────────── */}
      {scene === 'user' && (
        <UserScene onContactSupport={() => setScene('admin')} />
      )}

      {/* ── Scene 2: Admin / Support ──────────────────────────────── */}
      {scene === 'admin' && (
        <div className="scene-slide-in">
          {/* Scene header */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Support Investigation</h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 mb-10">
            <button
              onClick={() => { setScene('user'); setResult(null); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              &larr; Back to customer view
            </button>
          </div>

          {/* Ticket form — single card, results appear below button */}
          <form onSubmit={handleSubmit}
            className="max-w-xl space-y-4 rounded-2xl border border-stone-200/60 dark:border-zinc-800/60
              bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm p-6
              shadow-sm shadow-stone-200/50 dark:shadow-none">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ticket ID">
                <input type="text" value={ticket.ticketId}
                  onChange={(e) => setTicket((t) => ({ ...t, ticketId: e.target.value }))}
                  className="input-field" />
              </Field>
              <Field label="Customer Email">
                <input type="email" value={ticket.customerEmail}
                  onChange={(e) => setTicket((t) => ({ ...t, customerEmail: e.target.value }))}
                  className="input-field" />
              </Field>
            </div>
            <Field label="Subject">
              <input type="text" value={ticket.subject}
                onChange={(e) => setTicket((t) => ({ ...t, subject: e.target.value }))}
                className="input-field" />
            </Field>
            <Field label="Ticket Body">
              <textarea rows={3} value={ticket.body}
                onChange={(e) => setTicket((t) => ({ ...t, body: e.target.value }))}
                className="input-field resize-none" />
            </Field>
            <button type="submit" disabled={running || !!result}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl
                bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm
                shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200">
              {running ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Investigating...</>
              ) : result ? (
                <><Search className="w-4 h-4" /> Investigation Complete</>
              ) : (
                <><Play className="w-4 h-4" /> Investigate Ticket</>
              )}
            </button>

            {/* Results — appear below button with flip animation */}
            {result && (
              <div className="bts-flip-in space-y-4 pt-2">
                <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40
                  bg-amber-50/50 dark:bg-amber-950/20 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                    Resolution
                  </p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {result.resolution.split(':')[0]}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Investigated {result.servicesSearched} services, correlated {result.logCount} logs,
                    found {result.errorChain.length} errors in the chain.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExplain(true)}
                  className="w-full flex flex-col items-center gap-1.5 px-4 py-5 rounded-xl
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
                    Flowchart trace, LLM prompts, and every decision captured
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      </div>{/* end page content wrapper */}

      {/* Behind the Scenes — modal on desktop, inline on mobile */}
      {showExplain && result && (
        <BehindTheScenes
          snapshots={snapshots}
          narrative={result.narrative}
          spec={flowchartSpec as any}
          appName="Customer Support Troubleshooting"
          onClose={() => setShowExplain(false)}
          withoutPrompt={withoutPromptText}
          withPrompt={withPromptText}
        />
      )}
    </div>
  );
}

// ── Scene 1: User-facing order view ────────────────────────────────────

function UserScene({ onContactSupport }: { onContactSupport: () => void }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">My Orders</h1>
        <p className="text-sm text-stone-500 dark:text-zinc-400">
          Welcome back, Jane
        </p>
      </div>

      {/* Order card */}
      <div className="rounded-2xl border border-stone-200/60 dark:border-zinc-800/60
        bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden max-w-lg
        shadow-sm shadow-stone-200/50 dark:shadow-none">
        {/* Order header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">ORD-2847</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
              Completed
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Wireless Headphones + USB-C Cable</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Placed Mar 12, 2026 at 2:22 PM</p>
        </div>

        {/* Payment details */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <CreditCard className="w-4 h-4" />
              Visa ending 4242
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">$189.99</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Package className="w-4 h-4" />
              FedEx — Delivered
            </div>
            <span className="text-xs text-zinc-400">Mar 14</span>
          </div>
        </div>

        {/* Alert: double charge */}
        <div className="mx-5 mb-4 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 p-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                Duplicate charge detected
              </p>
              <p className="text-[11px] text-red-600/80 dark:text-red-300/60 mt-1 leading-relaxed">
                Your card was charged <strong>$189.99 twice</strong> for this order.
                The extra charge appears to be a payment processing error.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={onContactSupport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl
              bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200
              text-white dark:text-zinc-900 text-sm font-semibold
              shadow-md shadow-zinc-900/10 dark:shadow-zinc-100/5
              hover:shadow-lg transition-all duration-200"
          >
            <Headset className="w-4 h-4" />
            Contact Support
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-4 max-w-lg italic">
        This simulates the customer&rsquo;s view. Click &ldquo;Contact Support&rdquo; to switch to the admin investigation.
      </p>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

