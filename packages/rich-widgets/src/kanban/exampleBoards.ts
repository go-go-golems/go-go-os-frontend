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
    name: 'Kanban Sprint Board',
    icon: '\uD83C\uDFC1',
    props: {
      initialTaxonomy: DEFAULT_KANBAN_TAXONOMY,
      initialColumns: [
        { id: 'backlog', title: 'Backlog', icon: '\uD83D\uDCE5' },
        { id: 'ready', title: 'Ready', icon: '\uD83D\uDCCB' },
        { id: 'progress', title: 'In Progress', icon: '\u26A1' },
        { id: 'review', title: 'Review', icon: '\uD83D\uDC40' },
        { id: 'done', title: 'Done', icon: '\u2705' },
      ],
      initialTasks: [
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
    name: 'Kanban Bug Triage',
    icon: '\uD83D\uDC1B',
    props: {
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
    name: 'Kanban Personal Planner',
    icon: '\uD83C\uDF3F',
    props: {
      initialTaxonomy: DEFAULT_KANBAN_TAXONOMY,
      initialColumns: [
        { id: 'today', title: 'Today', icon: '\u2600\uFE0F' },
        { id: 'this-week', title: 'This Week', icon: '\uD83D\uDCC6' },
        { id: 'waiting', title: 'Waiting', icon: '\u23F3' },
        { id: 'done', title: 'Done', icon: '\u2705' },
      ],
      initialTasks: [
        { id: 'personal-1', col: 'today', title: 'Review APP-15 launcher examples', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Make sure the folder entries feel discoverable.' },
        { id: 'personal-2', col: 'today', title: 'Prototype kanban.v1 card payload', type: 'feature', labels: ['backend'], priority: 'high', desc: 'Try a real card in inventory chat and verify projection.' },
        { id: 'personal-3', col: 'this-week', title: 'Sketch second runtime pack candidate', type: 'feature', labels: ['design', 'frontend'], priority: 'medium', desc: 'Identify whether another widget wants the same host-render contract.' },
        { id: 'personal-4', col: 'this-week', title: 'Write handoff note for interns', type: 'task', labels: ['docs'], priority: 'low', desc: 'Summarize the pack discriminator and validation path.' },
        { id: 'personal-5', col: 'waiting', title: 'Decide on nested folder UX', type: 'task', labels: ['design'], priority: 'low', desc: 'Only needed if rich-widgets wants deeper categorization later.' },
        { id: 'personal-6', col: 'done', title: 'Group Kanban stories in Storybook', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Now visible under RichWidgets/Kanban/*.' },
      ],
      initialCollapsedCols: {
        waiting: true,
      },
    },
  },
];
