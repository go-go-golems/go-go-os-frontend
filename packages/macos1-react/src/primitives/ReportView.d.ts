import type { ActionConfig, ReportSection } from './types';
export interface ReportViewProps {
    sections: ReportSection[];
    actions?: ActionConfig[];
    onAction?: (action: unknown) => void;
}
export declare function ReportView({ sections, actions, onAction }: ReportViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReportView.d.ts.map