import { FlowChartBuilder, FlowChartExecutor, type ScopeFacade } from 'footprintjs';

// ── Types ──────────────────────────────────────────────────────────────

export interface SupportTicket {
  ticketId: string;
  customerEmail: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface SupportResult {
  resolution: string;
  resolutionType: 'auto-refund' | 'escalate' | 'manual-review';
  category: string;
  priority: string;
  customerName: string;
  customerTier: string;
  orderAmount: number;
  errorChain: string[];
  logCount: number;
  servicesSearched: number;
  narrative: string[];
  narrativeEntries: unknown[];
  snapshot: Record<string, unknown>;
  runtimeSnapshot: unknown;
}

// ── Mock Databases ────────────────────────────────────────────────────

const customerDB: Record<string, {
  name: string;
  tier: 'standard' | 'gold' | 'vip';
  accountAge: number;
  totalOrders: number;
  openTickets: number;
  recentComplaints: number;
  paymentMethod: string;
}> = {
  'jane.smith@example.com': {
    name: 'Jane Smith',
    tier: 'vip',
    accountAge: 36,
    totalOrders: 147,
    openTickets: 0,
    recentComplaints: 0,
    paymentMethod: 'Visa ending 4242',
  },
  'bob.jones@example.com': {
    name: 'Bob Jones',
    tier: 'standard',
    accountAge: 3,
    totalOrders: 5,
    openTickets: 2,
    recentComplaints: 1,
    paymentMethod: 'Mastercard ending 8888',
  },
};

const orderDB: Record<string, {
  orderId: string;
  amount: number;
  status: string;
  items: string[];
  paymentAttempts: { timestamp: string; status: string; gateway: string; amount: number }[];
}> = {
  'ORD-2847': {
    orderId: 'ORD-2847',
    amount: 189.99,
    status: 'completed',
    items: ['Wireless Headphones', 'USB-C Cable'],
    paymentAttempts: [
      { timestamp: '2026-03-12T14:23:01Z', status: 'timeout', gateway: 'stripe', amount: 189.99 },
      { timestamp: '2026-03-12T14:23:08Z', status: 'success', gateway: 'stripe', amount: 189.99 },
      { timestamp: '2026-03-12T14:23:09Z', status: 'success', gateway: 'stripe', amount: 189.99 },
    ],
  },
};

interface LogEntry {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

const scatteredLogs: LogEntry[] = [
  // Auth service logs
  { timestamp: '2026-03-12T14:22:55Z', service: 'auth-service', level: 'info',
    message: 'User jane.smith@example.com authenticated via OAuth', traceId: 'tr-9a3f' },
  { timestamp: '2026-03-12T14:22:56Z', service: 'auth-service', level: 'info',
    message: 'Session created: sess-44bf2', traceId: 'tr-9a3f' },

  // Payment service logs — this is where the error chain starts
  { timestamp: '2026-03-12T14:23:00Z', service: 'payment-service', level: 'info',
    message: 'Payment initiated for ORD-2847: $189.99', traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', amount: 189.99, gateway: 'stripe' } },
  { timestamp: '2026-03-12T14:23:01Z', service: 'payment-service', level: 'error',
    message: 'Gateway timeout: Stripe did not respond within 5000ms', traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', errorCode: 'GATEWAY_TIMEOUT', retryable: true } },
  { timestamp: '2026-03-12T14:23:03Z', service: 'payment-service', level: 'warn',
    message: 'Retry #1 for ORD-2847 — previous attempt status unknown', traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', retryCount: 1 } },
  { timestamp: '2026-03-12T14:23:08Z', service: 'payment-service', level: 'info',
    message: 'Payment SUCCESS for ORD-2847: $189.99 (charge ch_7x2k)', traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', chargeId: 'ch_7x2k' } },
  { timestamp: '2026-03-12T14:23:09Z', service: 'payment-service', level: 'warn',
    message: 'Late response from original attempt: Stripe confirms charge ch_6m1j for ORD-2847',
    traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', chargeId: 'ch_6m1j', lateResponse: true } },
  { timestamp: '2026-03-12T14:23:09Z', service: 'payment-service', level: 'error',
    message: 'DUPLICATE CHARGE detected: ORD-2847 has 2 successful charges (ch_6m1j + ch_7x2k)',
    traceId: 'tr-9a3f',
    metadata: { orderId: 'ORD-2847', charges: ['ch_6m1j', 'ch_7x2k'], totalCharged: 379.98 } },

  // Order service logs
  { timestamp: '2026-03-12T14:23:10Z', service: 'order-service', level: 'info',
    message: 'Order ORD-2847 marked as completed', traceId: 'tr-9a3f' },

  // Notification service logs
  { timestamp: '2026-03-12T14:23:11Z', service: 'notification-service', level: 'info',
    message: 'Confirmation email sent to jane.smith@example.com for ORD-2847', traceId: 'tr-9a3f' },
  { timestamp: '2026-03-12T14:23:12Z', service: 'notification-service', level: 'warn',
    message: 'Duplicate payment webhook received — second confirmation suppressed', traceId: 'tr-9a3f' },

  // Unrelated noise logs (different traces)
  { timestamp: '2026-03-12T14:23:05Z', service: 'auth-service', level: 'info',
    message: 'User mike@example.com authenticated', traceId: 'tr-bb22' },
  { timestamp: '2026-03-12T14:23:06Z', service: 'payment-service', level: 'info',
    message: 'Payment SUCCESS for ORD-2850: $42.00', traceId: 'tr-bb22' },
  { timestamp: '2026-03-12T14:23:07Z', service: 'order-service', level: 'info',
    message: 'Order ORD-2849 shipped via FedEx', traceId: 'tr-cc33' },
];

// ── Stage Functions ────────────────────────────────────────────────────

const receiveTicket = async (scope: ScopeFacade) => {
  const { ticket } = scope.getArgs<{ ticket: SupportTicket }>();
  scope.setValue('ticketId', ticket.ticketId);
  scope.setValue('customerEmail', ticket.customerEmail);
  scope.setValue('subject', ticket.subject);
  scope.setValue('body', ticket.body);
  scope.setValue('receivedAt', new Date().toISOString());
};

// ── Workflow 1: Classify Ticket ───────────────────────────────────────

const classifyTicket = async (scope: ScopeFacade) => {
  const subject = scope.getValue('subject') as string;
  const body = scope.getValue('body') as string;
  const text = `${subject} ${body}`.toLowerCase();
  await new Promise((r) => setTimeout(r, 30));

  // Simple keyword-based classification
  let category = 'general';
  if (text.includes('charge') || text.includes('payment') || text.includes('refund') || text.includes('billing')) {
    category = 'billing';
  } else if (text.includes('error') || text.includes('bug') || text.includes('crash') || text.includes('broken')) {
    category = 'technical';
  } else if (text.includes('shipping') || text.includes('delivery') || text.includes('tracking')) {
    category = 'shipping';
  }

  // Sentiment / urgency
  const urgent = text.includes('twice') || text.includes('overcharged') || text.includes('fraud')
    || text.includes('unauthorized');
  const priority = urgent ? 'P1' : category === 'billing' ? 'P2' : 'P3';

  scope.setValue('category', category);
  scope.setValue('priority', priority);
  scope.setValue('classificationConfidence', urgent ? 0.95 : 0.82);
  scope.setValue('urgentFlag', urgent);
};

// ── Workflow 2: Gather Customer Context ───────────────────────────────

const lookupCustomer = async (scope: ScopeFacade) => {
  const email = scope.getValue('customerEmail') as string;
  await new Promise((r) => setTimeout(r, 20));

  // Simulate a gateway timeout on CRM lookup (first attempt)
  scope.setValue('crmAttempt', 1);
  scope.addDebugInfo('crmLookup', 'First CRM request timed out after 3000ms');
  await new Promise((r) => setTimeout(r, 15));

  // Retry succeeds
  scope.setValue('crmAttempt', 2);
  const customer = customerDB[email];
  if (!customer) {
    scope.setValue('customerFound', false);
    scope.setValue('customerName', 'Unknown');
    scope.setValue('customerTier', 'standard');
    return;
  }

  scope.setValue('customerFound', true);
  scope.setValue('customerName', customer.name);
  scope.setValue('customerTier', customer.tier);
  scope.setValue('accountAge', customer.accountAge);
  scope.setValue('totalOrders', customer.totalOrders);
  scope.setValue('openTickets', customer.openTickets);
  scope.setValue('paymentMethod', customer.paymentMethod);
};

const lookupOrder = async (scope: ScopeFacade) => {
  const body = scope.getValue('body') as string;
  await new Promise((r) => setTimeout(r, 25));

  // Extract order ID from ticket body
  const orderMatch = body.match(/ORD-\d+/);
  if (!orderMatch) {
    scope.setValue('orderFound', false);
    return;
  }

  const orderId = orderMatch[0];
  const order = orderDB[orderId];
  if (!order) {
    scope.setValue('orderFound', false);
    scope.setValue('extractedOrderId', orderId);
    return;
  }

  scope.setValue('orderFound', true);
  scope.setValue('orderId', order.orderId);
  scope.setValue('orderAmount', order.amount);
  scope.setValue('orderStatus', order.status);
  scope.setValue('orderItems', order.items);
  scope.setValue('paymentAttempts', order.paymentAttempts);

  // Flag anomalies
  const successfulCharges = order.paymentAttempts.filter((a) => a.status === 'success');
  scope.setValue('chargeCount', successfulCharges.length);
  scope.setValue('totalCharged', successfulCharges.reduce((s, a) => s + a.amount, 0));
  if (successfulCharges.length > 1) {
    scope.setValue('duplicateChargeDetected', true);
    scope.setValue('overchargeAmount', (successfulCharges.length - 1) * order.amount);
  }
};

// ── Workflow 3: Analyze Logs ──────────────────────────────────────────

const searchLogs = async (scope: ScopeFacade) => {
  const email = scope.getValue('customerEmail') as string;
  const body = scope.getValue('body') as string;
  await new Promise((r) => setTimeout(r, 35));

  // Search across all services
  const services = ['auth-service', 'payment-service', 'order-service', 'notification-service'];
  scope.setValue('servicesSearched', services.length);
  scope.setValue('totalLogsScanned', scatteredLogs.length);

  // Filter logs by customer (via trace ID correlation)
  // First find the trace ID from auth logs matching the email
  const authLog = scatteredLogs.find(
    (l) => l.service === 'auth-service' && l.message.includes(email),
  );
  const traceId = authLog?.traceId;
  scope.setValue('correlatedTraceId', traceId ?? 'none');

  if (!traceId) {
    scope.setValue('relevantLogs', []);
    scope.setValue('relevantLogCount', 0);
    return;
  }

  const relevantLogs = scatteredLogs
    .filter((l) => l.traceId === traceId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  scope.setValue('relevantLogs', relevantLogs);
  scope.setValue('relevantLogCount', relevantLogs.length);

  // Extract the order ID to cross-reference
  const orderMatch = body.match(/ORD-\d+/);
  if (orderMatch) {
    const orderLogs = relevantLogs.filter(
      (l) => l.message.includes(orderMatch[0]),
    );
    scope.setValue('orderRelatedLogCount', orderLogs.length);
  }
};

const buildErrorChain = async (scope: ScopeFacade) => {
  const logs = scope.getValue('relevantLogs') as LogEntry[];
  await new Promise((r) => setTimeout(r, 20));

  const errors = logs.filter((l) => l.level === 'error' || l.level === 'warn');
  const chain: string[] = [];

  for (const log of errors) {
    chain.push(`[${log.service}] ${log.message}`);
  }

  scope.setValue('errorChain', chain);
  scope.setValue('errorCount', errors.length);

  // Determine root cause
  const hasTimeout = errors.some((e) => e.message.includes('timeout'));
  const hasDuplicate = errors.some((e) => e.message.includes('DUPLICATE'));

  if (hasTimeout && hasDuplicate) {
    scope.setValue('rootCause', 'Gateway timeout caused retry, resulting in duplicate charge');
    scope.setValue('rootCauseService', 'payment-service');
    scope.setValue('rootCauseType', 'gateway-timeout-duplicate');
  } else if (hasDuplicate) {
    scope.setValue('rootCause', 'Duplicate charge without clear timeout trigger');
    scope.setValue('rootCauseType', 'unknown-duplicate');
  } else {
    scope.setValue('rootCause', 'No clear error pattern identified');
    scope.setValue('rootCauseType', 'unknown');
  }
};

// ── Merge & Decision ──────────────────────────────────────────────────

const mergeFindings = async (scope: ScopeFacade) => {
  // Combine all gathered intelligence into a summary
  const category = scope.getValue('category') as string;
  const priority = scope.getValue('priority') as string;
  const customerTier = scope.getValue('customerTier') as string;
  const duplicateCharge = scope.getValue('duplicateChargeDetected') as boolean;
  const rootCauseType = scope.getValue('rootCauseType') as string;
  const errorChain = scope.getValue('errorChain') as string[];

  scope.setValue('findingSummary', {
    category,
    priority,
    customerTier,
    duplicateCharge: !!duplicateCharge,
    rootCauseType,
    errorChainLength: errorChain?.length ?? 0,
  });
};

const resolutionDecider = (scope: ScopeFacade): string => {
  const duplicateCharge = scope.getValue('duplicateChargeDetected') as boolean;
  const rootCauseType = scope.getValue('rootCauseType') as string;
  const customerTier = scope.getValue('customerTier') as string;

  // Clear duplicate from gateway timeout → auto-refund
  if (duplicateCharge && rootCauseType === 'gateway-timeout-duplicate') {
    scope.addDebugInfo('deciderRationale',
      `Duplicate charge confirmed from gateway timeout. Root cause: ${rootCauseType}. Customer tier: ${customerTier}. Auto-refund is safe.`);
    return 'auto-refund';
  }

  // Duplicate but unclear cause → escalate
  if (duplicateCharge) {
    scope.addDebugInfo('deciderRationale',
      `Duplicate charge detected but root cause unclear (${rootCauseType}). Escalating to billing team.`);
    return 'escalate';
  }

  // No duplicate found → manual review
  scope.addDebugInfo('deciderRationale',
    'No duplicate charge found in payment records. Needs manual investigation.');
  return 'manual-review';
};

const autoRefund = async (scope: ScopeFacade) => {
  const name = scope.getValue('customerName') as string;
  const amount = scope.getValue('overchargeAmount') as number;
  const orderId = scope.getValue('orderId') as string;
  await new Promise((r) => setTimeout(r, 20));

  scope.setValue('refundAmount', amount);
  scope.setValue('refundStatus', 'processed');
  scope.setValue('resolution',
    `AUTO-REFUND: $${amount.toFixed(2)} refunded to ${name} for duplicate charge on ${orderId}. Root cause: payment gateway timeout triggered retry resulting in double charge.`);
  scope.setValue('resolutionType', 'auto-refund');
};

const escalateTicket = async (scope: ScopeFacade) => {
  const name = scope.getValue('customerName') as string;
  const orderId = scope.getValue('orderId') as string;

  scope.setValue('escalatedTo', 'billing-team');
  scope.setValue('resolution',
    `ESCALATED: Ticket for ${name} (${orderId}) sent to billing team. Duplicate charge detected but root cause requires investigation.`);
  scope.setValue('resolutionType', 'escalate');
};

const manualReviewTicket = async (scope: ScopeFacade) => {
  const name = scope.getValue('customerName') as string;

  scope.setValue('assignedTo', 'support-agent-queue');
  scope.setValue('resolution',
    `MANUAL REVIEW: Ticket for ${name} assigned to support agent queue. No automated resolution possible.`);
  scope.setValue('resolutionType', 'manual-review');
};

// ── Build the flowchart ────────────────────────────────────────────────

const builder = new FlowChartBuilder()

  .start('ReceiveTicket', receiveTicket, 'receive-ticket',
    'Receive and parse the support ticket')
  .addFunction('ClassifyTicket', classifyTicket, 'classify-ticket',
    'Classify ticket category and priority using keyword analysis')
  .addFunction('LookupCustomer', lookupCustomer, 'lookup-customer',
    'Look up customer profile in CRM database (with retry on timeout)')
  .addFunction('LookupOrder', lookupOrder, 'lookup-order',
    'Find the referenced order and check payment history for anomalies')
  .addFunction('SearchLogs', searchLogs, 'search-logs',
    'Search scattered logs across 4 services and correlate by trace ID')
  .addFunction('BuildErrorChain', buildErrorChain, 'build-error-chain',
    'Reconstruct the error chain and identify root cause from correlated logs')
  .addFunction('MergeFindings', mergeFindings, 'merge-findings',
    'Combine classification, customer context, and log analysis into unified findings')
  .addDeciderFunction('ResolutionDecision', resolutionDecider as any, 'resolution-decision',
    'Route to auto-refund, escalation, or manual review based on findings')
    .addFunctionBranch('auto-refund', 'AutoRefund', autoRefund,
      'Process automatic refund for confirmed duplicate charge')
    .addFunctionBranch('escalate', 'Escalate', escalateTicket,
      'Escalate to billing team for further investigation')
    .addFunctionBranch('manual-review', 'ManualReview', manualReviewTicket,
      'Assign to support agent queue for manual review')
    .setDefault('manual-review')
    .end();

export const flowchartSpec = builder.toSpec();
const chart = builder.build();

// ── Default Ticket ────────────────────────────────────────────────────

export const defaultTicket: SupportTicket = {
  ticketId: 'TKT-10042',
  customerEmail: 'jane.smith@example.com',
  subject: 'Charged twice for my order',
  body: 'I placed order ORD-2847 yesterday and I see two charges of $189.99 on my credit card statement. I should only have been charged once. Please refund the duplicate charge.',
  timestamp: '2026-03-13T09:15:00Z',
};

// ── Run function ───────────────────────────────────────────────────────

export async function runSupportPipeline(ticket: SupportTicket): Promise<SupportResult> {
  const executor = new FlowChartExecutor(chart);
  executor.enableNarrative();
  await executor.run({ input: { ticket } });

  const narrative = executor.getNarrative() as string[];
  const narrativeEntries = executor.getNarrativeEntries();
  const runtimeSnapshot = executor.getSnapshot();
  const snapshot = runtimeSnapshot.sharedState as Record<string, unknown>;

  return {
    resolution: snapshot.resolution as string,
    resolutionType: snapshot.resolutionType as SupportResult['resolutionType'],
    category: snapshot.category as string,
    priority: snapshot.priority as string,
    customerName: snapshot.customerName as string,
    customerTier: snapshot.customerTier as string,
    orderAmount: snapshot.orderAmount as number,
    errorChain: (snapshot.errorChain as string[]) ?? [],
    logCount: snapshot.relevantLogCount as number,
    servicesSearched: snapshot.servicesSearched as number,
    narrative,
    narrativeEntries,
    snapshot,
    runtimeSnapshot,
  };
}
