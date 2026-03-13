import { Landmark, Stethoscope, ShoppingCart, Package, Headset } from 'lucide-react';
import { AppCard } from './AppCard';

export function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Demo Apps</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Interactive apps powered by footprint.js. Submit real forms, see real
          decisions, then click <strong>Explain</strong> to see what happened
          inside — in plain English and as AI-ready context.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppCard
          to="/loan-application"
          title="Loan Application"
          description="Submit a loan application and see how credit checks, DTI calculation, and risk assessment produce an approval or rejection."
          icon={<Landmark className="w-8 h-8" />}
          tags={['decider', 'narrative', 'risk scoring']}
          color="emerald"
        />
        <AppCard
          to="/customer-support"
          title="Support Troubleshooting"
          description="Submit a support ticket and watch footprint.js correlate scattered logs across 4 services to find a gateway timeout caused a double charge."
          icon={<Headset className="w-8 h-8" />}
          tags={['log correlation', 'error chain', 'multi-service']}
          color="cyan"
        />
        <AppCard
          to="#"
          title="Patient Triage"
          description="Enter patient vitals and watch the selector pick which screenings to run in parallel."
          icon={<Stethoscope className="w-8 h-8" />}
          tags={['selector', 'parallel', 'coming soon']}
          color="blue"
        />
        <AppCard
          to="#"
          title="Order Fulfillment"
          description="Place an order and follow it through validation, payment, and shipping — state machine meets flowchart."
          icon={<Package className="w-8 h-8" />}
          tags={['subflow', 'state machine', 'coming soon']}
          color="amber"
        />
        <AppCard
          to="#"
          title="E-Commerce Checkout"
          description="Complete a checkout flow with cart validation, discount tiers, and tax calculation."
          icon={<ShoppingCart className="w-8 h-8" />}
          tags={['decider', 'contract', 'coming soon']}
          color="violet"
        />
      </div>
    </div>
  );
}
