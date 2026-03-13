import { Landmark, Headset, User, ShieldCheck, ArrowDown } from 'lucide-react';
import { AppCard } from './AppCard';

export function Dashboard() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-10 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Interactive Demos
        </h1>
        <p className="mt-3 text-sm sm:text-base text-stone-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          See how <span className="font-medium text-zinc-800 dark:text-zinc-200">footprint.js</span> captures
          every decision in a pipeline — then turns it into structured context
          that even cheap LLMs can reason over.
        </p>
      </div>

      {/* ── Two-app story ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* App 1: User-facing */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex flex-col items-center pt-5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-stone-400 dark:text-zinc-400" />
            </div>
            <div className="w-px flex-1 bg-stone-200 dark:bg-zinc-800 mt-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">
              User-facing app
            </p>
            <AppCard
              to="/loan-application"
              title="Loan Underwriting"
              description="Credit checks, DTI ratios, and risk scoring — submit an application and see the full decision trace."
              icon={<Landmark className="w-7 h-7" />}
              tags={['decider', 'narrative', 'risk scoring']}
            />
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-3 sm:gap-4 pl-[3px]">
          <div className="flex flex-col items-center flex-shrink-0 w-8">
            <ArrowDown className="w-4 h-4 text-stone-300 dark:text-zinc-600" />
          </div>
          <p className="text-[10px] text-stone-400 dark:text-zinc-600 italic">
            footprint.js captures structured logs during execution — the support team gets connected traces, not scattered noise.
          </p>
        </div>

        {/* App 2: Admin-facing */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex flex-col items-center pt-5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-stone-400 dark:text-zinc-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">
              Admin / support
            </p>
            <AppCard
              to="/customer-support"
              title="Support Troubleshooting"
              description="Correlate structured traces across 4 services to find that a gateway timeout caused a double charge."
              icon={<Headset className="w-7 h-7" />}
              tags={['log correlation', 'error chain', 'multi-service']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
