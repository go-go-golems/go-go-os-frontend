import type { ReplCompletionItem, ReplDriver, ReplDriverContext, ReplExecutionResult } from './types';

export interface ReplCompletionState {
  suggestion: string;
  items: ReplCompletionItem[];
}

export function resolveReplCompletionState(
  input: string,
  driver: ReplDriver,
  context: ReplDriverContext,
): ReplCompletionState {
  if (input.length === 0 || !driver.getCompletions) {
    return { suggestion: '', items: [] };
  }

  const items = driver.getCompletions(input, context);
  const suggestion =
    items.length === 1 && items[0].value !== input
      ? items[0].value.slice(input.length)
      : '';

  return {
    suggestion,
    items,
  };
}

export function executeReplSubmission(
  raw: string,
  driver: ReplDriver,
  context: ReplDriverContext,
): Promise<ReplExecutionResult> {
  return Promise.resolve(driver.execute(raw, context));
}
