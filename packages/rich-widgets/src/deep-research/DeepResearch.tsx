import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn, Checkbox } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { ResearchStep, DepthLevel } from './types';
import { DEPTH_LEVELS } from './types';
import { DEMO_STEPS, generateReport } from './sampleData';

// ── Source Card ──────────────────────────────────────────────────────
function SourceCard({
  index,
  title,
  url,
  snippet,
}: {
  index: number;
  title: string;
  url: string;
  snippet: string;
}) {
  return (
    <div data-part={RICH_PARTS.drStepSource}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <span data-part={RICH_PARTS.drSourceIndex}>{index}</span>
        <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
          {title}
        </span>
      </div>
      <div data-part={RICH_PARTS.drSourceUrl}>
        {'\uD83D\uDCC4'} {url}
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.4 }}>{snippet}</div>
    </div>
  );
}

// ── Progress Bar ────────────────────────────────────────────────────
function ProgressBar({
  progress,
  indeterminate,
}: {
  progress: number;
  indeterminate: boolean;
}) {
  return (
    <div data-part={RICH_PARTS.drProgressBar}>
      <div
        data-part={RICH_PARTS.drProgressFill}
        data-state={indeterminate ? 'indeterminate' : undefined}
        style={indeterminate ? undefined : { width: `${progress}%` }}
      />
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────
export interface DeepResearchProps {
  initialSteps?: ResearchStep[];
}

// ── Main Component ──────────────────────────────────────────────────
export function DeepResearch({ initialSteps }: DeepResearchProps) {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [steps, setSteps] = useState<ResearchStep[]>(
    initialSteps ?? [],
  );
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState('');
  const [depthLevel, setDepthLevel] = useState<DepthLevel>('standard');
  const [webSearch, setWebSearch] = useState(true);
  const [academicOnly, setAcademicOnly] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [steps, scrollToBottom]);

  const startResearch = () => {
    if (!query.trim() || isResearching) return;
    setIsResearching(true);
    setSteps([]);
    setReport('');
    setProgress(0);

    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < DEMO_STEPS.length) {
        const step = DEMO_STEPS[i];
        setSteps((prev) => [...prev, step]);
        setProgress(((i + 1) / DEMO_STEPS.length) * 100);
        if (step.type === 'done') {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsResearching(false);
          setReport(generateReport(query, depthLevel));
        }
        i++;
      }
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sourceCount = steps.filter((s) => s.type === 'source').length;
  const visibleSteps = steps.filter((s) => s.type !== 'done');

  return (
    <div data-part={RICH_PARTS.deepResearch}>
      {/* ── Left: Controls ── */}
      <div data-part={RICH_PARTS.drSidebar}>
        {/* Query input */}
        <div>
          <div data-part={RICH_PARTS.drLabel}>Research Query:</div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to research?"
            disabled={isResearching}
            data-part={RICH_PARTS.drQueryInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) startResearch();
            }}
          />
        </div>

        {/* Depth selector */}
        <div>
          <div data-part={RICH_PARTS.drLabel}>Research Depth:</div>
          {DEPTH_LEVELS.map((level) => (
            <label
              key={level.value}
              data-part={RICH_PARTS.drDepthOption}
              data-state={
                depthLevel === level.value ? 'active' : undefined
              }
            >
              <span
                onClick={() =>
                  !isResearching && setDepthLevel(level.value)
                }
                data-part={RICH_PARTS.drRadio}
              >
                {depthLevel === level.value && (
                  <span data-part={RICH_PARTS.drRadioDot} />
                )}
              </span>
              {level.label}
              <span
                style={{
                  color: 'var(--hc-color-muted)',
                  fontSize: 10,
                }}
              >
                ({level.time})
              </span>
            </label>
          ))}
        </div>

        {/* Options */}
        <div data-part={RICH_PARTS.drOptionsSection}>
          <div data-part={RICH_PARTS.drLabel}>Options:</div>
          <Checkbox
            checked={webSearch}
            onChange={() => setWebSearch((v) => !v)}
            label="Web search"
          />
          <Checkbox
            checked={academicOnly}
            onChange={() => setAcademicOnly((v) => !v)}
            label="Academic sources only"
          />
        </div>

        <div style={{ flex: 1 }} />

        <Btn
          onClick={startResearch}
          disabled={!query.trim() || isResearching}
        >
          {isResearching
            ? 'Researching\u2026'
            : '\u2318 Begin Research'}
        </Btn>

        {isResearching && (
          <div data-part={RICH_PARTS.drSourceCount}>
            {'\uD83D\uDCE1'} {sourceCount} source
            {sourceCount !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* ── Right: Research Activity ── */}
      <div data-part={RICH_PARTS.drActivity}>
        {/* Progress bar */}
        {(isResearching || report) && (
          <div data-part={RICH_PARTS.drProgressSection}>
            <ProgressBar
              progress={progress}
              indeterminate={isResearching && progress < 15}
            />
            <div data-part={RICH_PARTS.drProgressStatus}>
              <span>
                {isResearching
                  ? 'Researching\u2026'
                  : '\u2713 Complete'}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Steps / Report area */}
        <div data-part={RICH_PARTS.drStepsArea}>
          {/* Empty state */}
          {!isResearching && steps.length === 0 && !report && (
            <div data-part={RICH_PARTS.drEmptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {'\uD83D\uDD0D'}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                Deep Research
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                Enter a research query and click "Begin Research" to
                start. I'll search multiple sources, analyze findings,
                and synthesize a comprehensive report.
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 10,
                  color: 'var(--hc-color-muted)',
                  borderTop:
                    '1px solid var(--hc-color-row-odd, #ccc)',
                  paddingTop: 8,
                }}
              >
                {'\u2318'}+Enter to start {'\u00B7'} Tip: be specific
                for better results
              </div>
            </div>
          )}

          {/* Activity log */}
          {visibleSteps.map((step, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {step.type === 'status' && (
                <div data-part={RICH_PARTS.drStepStatus}>
                  {isResearching && i === visibleSteps.length - 1 ? (
                    <span data-part={RICH_PARTS.drBlink}>
                      {'\u25B6'}
                    </span>
                  ) : (
                    <span>{'\u2713'}</span>
                  )}
                  {step.text}
                </div>
              )}
              {step.type === 'source' && (
                <SourceCard
                  index={
                    steps
                      .slice(0, steps.indexOf(step) + 1)
                      .filter((s) => s.type === 'source').length
                  }
                  title={step.title}
                  url={step.url}
                  snippet={step.snippet}
                />
              )}
              {step.type === 'thinking' && (
                <div data-part={RICH_PARTS.drStepThinking}>
                  {'\uD83D\uDCAD'} {step.text}
                </div>
              )}
            </div>
          ))}

          {/* Final report */}
          {report && (
            <div data-part={RICH_PARTS.drReport}>
              <div data-part={RICH_PARTS.drReportHeader}>
                {'\uD83D\uDCCB'} RESEARCH REPORT
              </div>
              <div data-part={RICH_PARTS.drReportBody}>{report}</div>
            </div>
          )}
          <div ref={stepsEndRef} />
        </div>
      </div>
    </div>
  );
}
