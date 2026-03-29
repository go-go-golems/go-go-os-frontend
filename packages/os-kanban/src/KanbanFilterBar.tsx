import { Btn } from '@go-go-golems/os-core';
import { WidgetToolbar } from '@go-go-golems/os-widgets';
import { Separator } from '@go-go-golems/os-widgets';
import { formatKanbanOption, type KanbanPriorityId, type KanbanIssueTypeId, type KanbanTaxonomy } from './types';

export interface KanbanFilterBarProps {
  taxonomy: KanbanTaxonomy;
  filterType: KanbanIssueTypeId | null;
  filterPriority: KanbanPriorityId | null;
  searchQuery: string;
  onSetFilterType: (type: KanbanIssueTypeId | null) => void;
  onSetFilterPriority: (priority: KanbanPriorityId | null) => void;
  onClearFilters: () => void;
}

export function KanbanFilterBar({
  taxonomy,
  filterType,
  filterPriority,
  searchQuery,
  onSetFilterType,
  onSetFilterPriority,
  onClearFilters,
}: KanbanFilterBarProps) {
  const hasFilters = Boolean(filterType || filterPriority || searchQuery);

  return (
    <WidgetToolbar>
      {taxonomy.issueTypes.map((issueType) => (
        <Btn
          key={issueType.id}
          onClick={() => onSetFilterType(filterType === issueType.id ? null : issueType.id)}
          data-state={filterType === issueType.id ? 'active' : undefined}
          style={{ fontSize: 9, padding: '1px 5px' }}
        >
          {formatKanbanOption(issueType, issueType.id)}
        </Btn>
      ))}

      <Separator />

      {taxonomy.priorities.map((priority) => (
        <Btn
          key={priority.id}
          onClick={() => onSetFilterPriority(filterPriority === priority.id ? null : priority.id)}
          data-state={filterPriority === priority.id ? 'active' : undefined}
          style={{ fontSize: 9, padding: '1px 5px' }}
        >
          {formatKanbanOption(priority, priority.id)}
        </Btn>
      ))}

      {hasFilters ? (
        <>
          <Separator />
          <Btn onClick={onClearFilters} style={{ fontSize: 9 }}>
            ✕ Clear
          </Btn>
        </>
      ) : null}
    </WidgetToolbar>
  );
}
