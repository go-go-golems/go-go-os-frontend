import type { Task, Column } from './types';

export const INITIAL_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: '📥' },
  { id: 'todo', title: 'To Do', icon: '📋' },
  { id: 'progress', title: 'In Progress', icon: '⚡' },
  { id: 'review', title: 'Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 'task-1', col: 'backlog', title: 'Research competitor pricing', type: 'task', labels: ['frontend'], priority: 'low', desc: 'Compile a comparison sheet' },
  { id: 'task-2', col: 'backlog', title: 'Write API documentation', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Cover all endpoints' },
  { id: 'task-3', col: 'todo', title: 'Fix login redirect loop', type: 'bug', labels: ['urgent', 'backend'], priority: 'high', desc: 'Users stuck on OAuth callback' },
  { id: 'task-4', col: 'todo', title: 'Design onboarding flow', type: 'feature', labels: ['design', 'frontend'], priority: 'medium', desc: '3-step wizard mockup' },
  { id: 'task-5', col: 'todo', title: 'Add dark mode support', type: 'feature', labels: ['design', 'frontend'], priority: 'low', desc: '' },
  { id: 'task-6', col: 'progress', title: 'Implement search indexing', type: 'feature', labels: ['backend'], priority: 'high', desc: 'Elasticsearch integration' },
  { id: 'task-7', col: 'progress', title: 'Fix memory leak in worker', type: 'bug', labels: ['backend'], priority: 'high', desc: 'OOM after 24h uptime' },
  { id: 'task-8', col: 'review', title: 'Update privacy policy', type: 'task', labels: ['docs'], priority: 'medium', desc: 'Legal team reviewed draft' },
  { id: 'task-9', col: 'done', title: 'Set up CI/CD pipeline', type: 'feature', labels: ['backend'], priority: 'medium', desc: 'GitHub Actions + deploy' },
  { id: 'task-10', col: 'done', title: 'Fix date picker timezone bug', type: 'bug', labels: ['frontend'], priority: 'low', desc: '' },
];
