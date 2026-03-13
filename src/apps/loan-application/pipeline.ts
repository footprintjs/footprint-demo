import { FlowChartBuilder, FlowChartExecutor, type ScopeFacade } from 'footprintjs';

// ── Types ──────────────────────────────────────────────────────────────

export interface LoanApplication {
  applicantName: string;
  annualIncome: number;
  monthlyDebts: number;
  creditScore: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employmentYears: number;
  loanAmount: number;
}

export interface LoanResult {
  decision: string;
  creditTier: string;
  dtiPercent: number;
  riskTier: string;
  riskFactors: string[];
  narrative: string[];
  narrativeEntries: unknown[]; // CombinedNarrativeEntry[] from executor.getNarrativeEntries()
  snapshot: Record<string, unknown>;
  runtimeSnapshot: unknown; // raw executor.getSnapshot() for explainable-ui
}

// ── Mock Services ──────────────────────────────────────────────────────

const creditBureau = {
  pullReport: (score: number) => {
    const tier =
      score >= 740 ? 'excellent'
        : score >= 670 ? 'good'
          : score >= 580 ? 'fair'
            : 'poor';
    return {
      tier,
      flags: tier === 'poor' ? ['poor credit history']
        : tier === 'fair' ? ['below-average credit'] : [],
    };
  },
};

const employerVerification = {
  verify: (status: string, years: number) => ({
    verified: status !== 'unemployed',
    flags:
      status === 'unemployed' ? ['applicant is unemployed']
        : status === 'self-employed' && years < 2
          ? [`self-employed for only ${years} year(s)`]
          : [],
  }),
};

// ── Stage Functions ────────────────────────────────────────────────────

const receiveApplication = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<{ app: LoanApplication }>();
  scope.setValue('applicantName', app.applicantName);
  scope.setValue('loanAmount', app.loanAmount);
};

const pullCreditReport = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<{ app: LoanApplication }>();
  await new Promise((r) => setTimeout(r, 40));
  const report = creditBureau.pullReport(app.creditScore);
  scope.setValue('creditScore', app.creditScore);
  scope.setValue('creditTier', report.tier);
  scope.setValue('creditFlags', report.flags);
};

const calculateDTI = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<{ app: LoanApplication }>();
  const monthlyIncome = app.annualIncome / 12;
  const dtiRatio = Math.round((app.monthlyDebts / monthlyIncome) * 100) / 100;
  const dtiPercent = Math.round(dtiRatio * 100);
  scope.setValue('monthlyIncome', Math.round(monthlyIncome));
  scope.setValue('dtiRatio', dtiRatio);
  scope.setValue('dtiPercent', dtiPercent);
  scope.setValue('dtiStatus', dtiRatio > 0.43 ? 'excessive' : 'healthy');
  scope.setValue(
    'dtiFlags',
    dtiRatio > 0.43 ? [`DTI at ${dtiPercent}% exceeds 43% threshold`] : [],
  );
};

const verifyEmployment = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<{ app: LoanApplication }>();
  await new Promise((r) => setTimeout(r, 25));
  const result = employerVerification.verify(app.employmentStatus, app.employmentYears);
  scope.setValue('employmentStatus', app.employmentStatus);
  scope.setValue('employmentYears', app.employmentYears);
  scope.setValue('employmentVerified', result.verified);
  scope.setValue('employmentFlags', result.flags);
};

const assessRisk = async (scope: ScopeFacade) => {
  const creditTier = scope.getValue('creditTier') as string;
  const dtiStatus = scope.getValue('dtiStatus') as string;
  const verified = scope.getValue('employmentVerified') as boolean;

  const riskTier =
    !verified || dtiStatus === 'excessive' || creditTier === 'poor' ? 'high' : 'low';
  scope.setValue('riskTier', riskTier);

  const flags = [
    ...(scope.getValue('creditFlags') as string[]),
    ...(scope.getValue('dtiFlags') as string[]),
    ...(scope.getValue('employmentFlags') as string[]),
  ];
  scope.setValue('riskFactors', flags);
};

const loanDecider = (scope: ScopeFacade): string => {
  const tier = scope.getValue('riskTier') as string;
  const factors = scope.getValue('riskFactors') as string[];

  if (tier === 'low') {
    scope.addDebugInfo('deciderRationale', 'riskTier is "low" — no risk factors found');
    return 'approved';
  }
  if (tier === 'high') {
    scope.addDebugInfo('deciderRationale',
      `riskTier is "high" — ${factors.length} risk factor(s): ${factors.join('; ')}`);
    return 'rejected';
  }
  scope.addDebugInfo('deciderRationale',
    `riskTier is "${tier}" — needs human review`);
  return 'manual-review';
};

const approveApplication = async (scope: ScopeFacade) => {
  const name = scope.getValue('applicantName') as string;
  const amount = scope.getValue('loanAmount') as number;
  scope.setValue('decision', `APPROVED — ${name} qualified for $${amount.toLocaleString()}`);
};

const rejectApplication = async (scope: ScopeFacade) => {
  const name = scope.getValue('applicantName') as string;
  const factors = scope.getValue('riskFactors') as string[];
  scope.setValue('decision', `REJECTED — ${name}: ${factors.join('; ')}`);
};

const manualReview = async (scope: ScopeFacade) => {
  const name = scope.getValue('applicantName') as string;
  scope.setValue('decision', `MANUAL REVIEW — ${name} flagged for human underwriter`);
};

// ── Build the flowchart ────────────────────────────────────────────────

const builder = new FlowChartBuilder()
  .setEnableNarrative()
  .start('ReceiveApplication', receiveApplication, 'receive-application',
    'Receive and validate the loan application')
  .addFunction('PullCreditReport', pullCreditReport, 'pull-credit-report',
    'Pull credit report and classify credit tier')
  .addFunction('CalculateDTI', calculateDTI, 'calculate-dti',
    'Calculate debt-to-income ratio')
  .addFunction('VerifyEmployment', verifyEmployment, 'verify-employment',
    'Verify employment status and history')
  .addFunction('AssessRisk', assessRisk, 'assess-risk',
    'Evaluate all factors and determine risk tier')
  .addDeciderFunction('LoanDecision', loanDecider as any, 'loan-decision',
    'Route to approval, rejection, or manual review based on risk tier')
    .addFunctionBranch('approved', 'Approve', approveApplication,
      'Generate approval with loan terms')
    .addFunctionBranch('rejected', 'Reject', rejectApplication,
      'Generate rejection with denial reasons')
    .addFunctionBranch('manual-review', 'ManualReview', manualReview,
      'Flag for human underwriter review')
    .setDefault('manual-review')
    .end();

export const flowchartSpec = builder.toSpec();
const chart = builder.build();

// ── Run function ───────────────────────────────────────────────────────

export async function runLoanPipeline(app: LoanApplication): Promise<LoanResult> {
  const executor = new FlowChartExecutor(chart);
  await executor.run({ input: { app } });

  const narrative = executor.getNarrative() as string[];
  const narrativeEntries = executor.getNarrativeEntries();
  const runtimeSnapshot = executor.getSnapshot();
  const snapshot = runtimeSnapshot.sharedState as Record<string, unknown>;

  return {
    decision: snapshot.decision as string,
    creditTier: snapshot.creditTier as string,
    dtiPercent: snapshot.dtiPercent as number,
    riskTier: snapshot.riskTier as string,
    riskFactors: (snapshot.riskFactors as string[]) ?? [],
    narrative,
    narrativeEntries,
    snapshot,
    runtimeSnapshot,
  };
}
