import type { KanbanBoardProps } from './KanbanBoard';
import { DEFAULT_KANBAN_TAXONOMY } from './types';

export interface KanbanExampleBoard {
  id: string;
  name: string;
  icon: string;
  props: KanbanBoardProps;
}

export const KANBAN_EXAMPLE_BOARDS: readonly KanbanExampleBoard[] = [
  {
    id: 'kanban-sprint-board',
    name: 'Sprint Radar',
    icon: '\uD83C\uDFC1',
    props: {
      title: 'Sprint Radar',
      subtitle: 'Five-lane delivery board with a louder top summary.',
      primaryActionLabel: '+ Slice',
      highlights: [
        { id: 'committed', label: 'Committed', value: '34 pts', caption: 'Sprint 12', tone: 'accent', trend: [22, 24, 26, 29, 31, 34] },
        { id: 'blocked', label: 'Blocked', value: 2, caption: 'Waiting on review', tone: 'warning', progress: 0.22 },
        { id: 'shipped', label: 'Shipped', value: '61%', caption: 'Cards already in done', tone: 'success', progress: 0.61 },
      ],
      initialTaxonomy: DEFAULT_KANBAN_TAXONOMY,
      initialColumns: [
        { id: 'ideas', title: 'Ideas', icon: '\uD83D\uDCA1' },
        { id: 'backlog', title: 'Backlog', icon: '\uD83D\uDCE5' },
        { id: 'ready', title: 'Ready', icon: '\uD83D\uDCCB' },
        { id: 'progress', title: 'In Progress', icon: '\u26A1' },
        { id: 'review', title: 'Review', icon: '\uD83D\uDC40' },
        { id: 'done', title: 'Done', icon: '\u2705' },
      ],
      initialTasks: [
        { id: 'sprint-0', col: 'ideas', title: 'Explore command-center shell widgets', type: 'feature', labels: ['frontend'], priority: 'low', desc: 'Potential APP-20 follow-on for richer incident surfaces.' },
        { id: 'sprint-1', col: 'backlog', title: 'Define runtime pack review checklist', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Write the acceptance checklist for new runtime packs.' },
        { id: 'sprint-2', col: 'ready', title: 'Wire kanban.v1 authoring examples', type: 'feature', labels: ['backend'], priority: 'high', desc: 'Add inventory prompt examples and artifact fixtures.' },
        { id: 'sprint-3', col: 'progress', title: 'Refactor drag payload validation', type: 'feature', labels: ['urgent', 'backend'], priority: 'high', desc: 'Tighten host-side event payload guards for moveTask.' },
        { id: 'sprint-4', col: 'progress', title: 'Audit Storybook alias coverage', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Verify all runtime-pack subpath imports resolve in Storybook.' },
        { id: 'sprint-5', col: 'review', title: 'Review runtime pack playbook revisions', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Check the slice ordering and validation notes.' },
        { id: 'sprint-6', col: 'done', title: 'Extract KanbanBoardView', type: 'feature', labels: ['frontend'], priority: 'medium', desc: 'Completed in APP-15 slice 3.' },
      ],
    },
  },
  {
    id: 'kanban-bug-triage',
    name: 'Bug Triage Desk',
    icon: '\uD83D\uDC1B',
    props: {
      title: 'Bug Triage Desk',
      subtitle: 'Four-lane review flow with stronger emphasis on hot issues.',
      primaryActionLabel: '+ Intake',
      highlights: [
        { id: 'hot', label: 'Hot', value: 3, caption: 'Need triage in the next hour', tone: 'danger', trend: [1, 1, 2, 4, 3, 3] },
        { id: 'regressions', label: 'Regressions', value: '42%', caption: 'Of current queue', tone: 'warning', progress: 0.42 },
      ],
      initialTaxonomy: {
        issueTypes: [
          { id: 'crash', label: 'Crash', icon: '💥' },
          { id: 'regression', label: 'Regression', icon: '↩️' },
          { id: 'support', label: 'Support', icon: '🧵' },
        ],
        priorities: DEFAULT_KANBAN_TAXONOMY.priorities,
        labels: [
          { id: 'ios', label: 'iOS', icon: '📱' },
          { id: 'android', label: 'Android', icon: '🤖' },
          { id: 'perf', label: 'Perf', icon: '⚡' },
          { id: 'docs', label: 'Docs', icon: '📚' },
        ],
      },
      initialColumns: [
        { id: 'reported', title: 'Reported', icon: '\uD83D\uDCEC' },
        { id: 'confirmed', title: 'Confirmed', icon: '\uD83D\uDD0E' },
        { id: 'fixing', title: 'Fixing', icon: '\uD83D\uDD27' },
        { id: 'verifying', title: 'Verifying', icon: '\uD83E\uDDEA' },
        { id: 'resolved', title: 'Resolved', icon: '\u2705' },
      ],
      initialTasks: [
        { id: 'bug-1', col: 'reported', title: 'Chat window loses scroll position', type: 'crash', labels: ['ios'], priority: 'high', desc: 'Scrolling resets when a timeline row rerenders.' },
        { id: 'bug-2', col: 'reported', title: 'Launcher folder double-open race', type: 'support', labels: ['android'], priority: 'medium', desc: 'Opening a widget twice can produce overlapping windows.' },
        { id: 'bug-3', col: 'confirmed', title: 'runtime.pack missing after projection', type: 'regression', labels: ['docs'], priority: 'high', desc: 'Frontend parser was reading the wrong payload level.' },
        { id: 'bug-4', col: 'fixing', title: 'Rich widget theme leaks into shell modal', type: 'regression', labels: ['perf'], priority: 'medium', desc: 'Modal styles need stricter part selectors.' },
        { id: 'bug-5', col: 'verifying', title: 'Kanban filter toggle payload mismatch', type: 'support', labels: ['android'], priority: 'medium', desc: 'Verify filter handlers receive the normalized payload shape.' },
        { id: 'bug-6', col: 'resolved', title: 'Hypercard tools stale VM API crash', type: 'crash', labels: ['ios'], priority: 'high', desc: 'Fixed during the APP-11 migration sweep.' },
      ],
      initialFilterPriority: 'high',
    },
  },
  {
    id: 'kanban-personal-planner',
    name: 'Focus Inbox',
    icon: '\uD83C\uDFAF',
    props: {
      title: 'Focus Inbox',
      subtitle: 'One-lane capture board for the next few hours only.',
      primaryActionLabel: '+ Capture',
      showFilterBar: false,
      highlights: [
        { id: 'energy', label: 'Energy', value: 'High', caption: 'Good time for deep work', tone: 'success' },
        { id: 'streak', label: 'Streak', value: '3 days', caption: 'Inbox kept under five items', tone: 'accent', trend: [2, 3, 4, 4, 3, 5] },
      ],
      initialTaxonomy: DEFAULT_KANBAN_TAXONOMY,
      initialColumns: [
        { id: 'focus', title: 'Today', icon: '\uD83C\uDFAF' },
      ],
      initialTasks: [
        { id: 'personal-1', col: 'focus', title: 'Review APP-15 launcher examples', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Make sure the folder entries feel discoverable.' },
        { id: 'personal-2', col: 'focus', title: 'Prototype kanban.v1 card payload', type: 'feature', labels: ['backend'], priority: 'high', desc: 'Try a real card in inventory chat and verify projection.' },
        { id: 'personal-3', col: 'focus', title: 'Write handoff note for interns', type: 'task', labels: ['docs'], priority: 'low', desc: 'Summarize the pack discriminator and validation path.' },
        { id: 'personal-4', col: 'focus', title: 'Call out source-display follow-up', type: 'task', labels: ['design'], priority: 'low', desc: 'Prepare the next debugger iteration.' },
      ],
      statusMetrics: [
        { label: 'captured', value: 4 },
        { label: 'today', value: 'single lane' },
      ],
    },
  },
  {
    id: 'kanban-incident-command',
    name: 'Incident Command',
    icon: '\uD83D\uDEA8',
    props: {
      title: 'Incident Command',
      subtitle: 'Three-lane command surface with ops-style telemetry.',
      primaryActionLabel: '+ Escalate',
      highlights: [
        { id: 'sev1', label: 'SEV-1', value: 1, caption: 'Customer-visible outage', tone: 'danger', trend: [0, 1, 1, 2, 1, 1] },
        { id: 'mitigation', label: 'Mitigation', value: '74%', caption: 'Rollback progressing', tone: 'warning', progress: 0.74 },
        { id: 'latency', label: 'Latency', value: '182ms', caption: 'API p95', tone: 'accent', trend: [120, 140, 160, 210, 190, 182] },
      ],
      initialTaxonomy: {
        issueTypes: [
          { id: 'outage', label: 'Outage', icon: '🚨' },
          { id: 'regression', label: 'Regression', icon: '↩️' },
          { id: 'investigation', label: 'Investigation', icon: '🔬' },
        ],
        priorities: [
          { id: 'sev1', label: 'SEV-1', icon: '🟥' },
          { id: 'sev2', label: 'SEV-2', icon: '🟧' },
          { id: 'sev3', label: 'SEV-3', icon: '🟨' },
        ],
        labels: [
          { id: 'api', label: 'API', icon: '🔌' },
          { id: 'db', label: 'DB', icon: '🗄️' },
          { id: 'customer', label: 'Customer', icon: '☎️' },
        ],
      },
      initialColumns: [
        { id: 'new', title: 'Detected', icon: '📟' },
        { id: 'mitigating', title: 'Mitigating', icon: '🧯' },
        { id: 'resolved', title: 'Resolved', icon: '✅' },
      ],
      initialTasks: [
        { id: 'inc-1', col: 'new', title: 'Auth refresh loop', type: 'outage', labels: ['customer'], priority: 'sev1', desc: 'Users are being signed out every 30 minutes.' },
        { id: 'inc-2', col: 'mitigating', title: 'DB pool saturation', type: 'investigation', labels: ['db'], priority: 'sev2', desc: 'Workers are draining after the config rollback.' },
        { id: 'inc-3', col: 'resolved', title: 'Webhook retry storm', type: 'regression', labels: ['api'], priority: 'sev2', desc: 'Resolved but still watching for repeat spikes.' },
      ],
      statusMetrics: [
        { label: 'open', value: 2 },
        { label: 'sev1', value: 1 },
        { label: 'owner', value: 'platform' },
      ],
    },
  },
  {
    id: 'kanban-release-cutline',
    name: 'Release Cutline',
    icon: '\uD83D\uDE80',
    props: {
      title: 'Release Cutline',
      subtitle: 'Two-lane launch board: blocked vs ready-to-ship.',
      primaryActionLabel: '+ Add Gate',
      showFilterBar: false,
      highlights: [
        { id: 'readiness', label: 'Readiness', value: '82%', caption: 'Across platform gates', tone: 'success', progress: 0.82 },
        { id: 'blockers', label: 'Blockers', value: 2, caption: 'Holding the cut', tone: 'danger' },
      ],
      initialTaxonomy: {
        issueTypes: [
          { id: 'launch', label: 'Launch', icon: '🚀' },
          { id: 'risk', label: 'Risk', icon: '⚠️' },
          { id: 'qa', label: 'QA', icon: '🧪' },
        ],
        priorities: [
          { id: 'blocker', label: 'Blocker', icon: '⛔' },
          { id: 'watch', label: 'Watch', icon: '👀' },
          { id: 'stable', label: 'Stable', icon: '✅' },
        ],
        labels: [
          { id: 'ios', label: 'iOS', icon: '📱' },
          { id: 'android', label: 'Android', icon: '🤖' },
          { id: 'ops', label: 'Ops', icon: '🛰️' },
        ],
      },
      initialColumns: [
        { id: 'gates', title: 'Launch Gates', icon: '🚧' },
        { id: 'ship', title: 'Shipping', icon: '📦' },
      ],
      initialTasks: [
        { id: 'rel-1', col: 'gates', title: 'Android subscription fallback', type: 'risk', labels: ['android'], priority: 'blocker', desc: 'Must be green before we start staged rollout.' },
        { id: 'rel-2', col: 'gates', title: 'Ops rollback checklist', type: 'launch', labels: ['ops'], priority: 'watch', desc: 'Needs one more review pass.' },
        { id: 'rel-3', col: 'ship', title: 'iOS testflight verification', type: 'qa', labels: ['ios'], priority: 'stable', desc: 'Smoke tests are clean.' },
      ],
      statusMetrics: [
        { label: 'gates', value: 2 },
        { label: 'ship', value: 1 },
      ],
    },
  },
];
