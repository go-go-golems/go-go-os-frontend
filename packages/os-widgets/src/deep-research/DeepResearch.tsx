import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { Btn, Checkbox, RadioButton } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import type { ResearchStep, DepthLevel } from './types';
import { DEPTH_LEVELS } from './types';
import { DEMO_STEPS, generateReport, WEB_ONLY_INDICES, ACADEMIC_INDICES } from './sampleData';
import {
  createDeepResearchStateSeed,
  DEEP_RESEARCH_STATE_KEY,
  deepResearchActions,
  deepResearchReducer,
  selectDeepResearchState,
  type DeepResearchAction,
  type DeepResearchState,
} from './deepResearchState';

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
    <div data-part={P.drStepSource}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <span data-part={P.drSourceIndex}>{index}</span>
        <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
          {title}
        </span>
      </div>
      <div data-part={P.drSourceUrl}>
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
    <div data-part={P.drProgressBar}>
      <div
        data-part={P.drProgressFill}
        data-state={indeterminate ? 'indeterminate' : undefined}
        style={indeterminate ? undefined : { width: `${progress}%` }}
      />
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────
export interface DeepResearchProps {
  initialSteps?: ResearchStep[];
  initialQuery?: string;
}

function createInitialSeed(props: DeepResearchProps) {
  return createDeepResearchStateSeed({
    query: props.initialQuery,
    initialSteps: props.initialSteps,
  });
}

function DeepResearchFrame({
  state,
  dispatch,
}: {
  state: DeepResearchState;
  dispatch: (action: DeepResearchAction) => void;
}) {
  const {
    query,
    isResearching,
    steps,
    progress,
    report,
    depthLevel,
    webSearch,
    academicOnly,
    runRevision,
  } = state;
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [steps, scrollToBottom]);

  const startResearch = useCallback(() => {
    if (!query.trim() || isResearching) return;
    dispatch(deepResearchActions.startResearchRun());
  }, [dispatch, isResearching, query]);

  useEffect(() => {
    if (!isResearching || runRevision === 0 || !query.trim()) {
      return;
    }

    // Filter demo steps based on web search and academic toggles
    const filteredSteps = DEMO_STEPS.filter((_step, idx) => {
      if (academicOnly && WEB_ONLY_INDICES.has(idx)) return false;
      if (!webSearch && !ACADEMIC_INDICES.has(idx) && DEMO_STEPS[idx].type === 'source') return false;
      return true;
    });

    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < filteredSteps.length) {
        const step = filteredSteps[i];
        dispatch(deepResearchActions.appendStep(step));
        dispatch(deepResearchActions.setProgress(((i + 1) / filteredSteps.length) * 100));
        if (step.type === 'done') {
          if (timerRef.current) clearInterval(timerRef.current);
          dispatch(
            deepResearchActions.finishResearch(
              generateReport(query, depthLevel, { webSearch, academicOnly }),
            ),
          );
        }
        i++;
      }
    }, 900);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [academicOnly, depthLevel, dispatch, isResearching, query, runRevision, webSearch]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sourceCount = steps.filter((s) => s.type === 'source').length;
  const visibleSteps = steps.filter((s) => s.type !== 'done');

  return (
    <div data-part={P.deepResearch}>
      {/* ── Left: Controls ── */}
      <div data-part={P.drSidebar}>
        {/* Query input */}
        <div>
          <div data-part={P.drLabel}>Research Query:</div>
          <textarea
            value={query}
            onChange={(e) => dispatch(deepResearchActions.setQuery(e.target.value))}
            placeholder="What would you like to research?"
            disabled={isResearching}
            data-part={P.drQueryInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) startResearch();
            }}
          />
        </div>

        {/* Depth selector */}
        <div>
          <div data-part={P.drLabel}>Research Depth:</div>
          {DEPTH_LEVELS.map((level) => (
            <RadioButton
              key={level.value}
              label={`${level.label} (${level.time})`}
              selected={depthLevel === level.value}
              onChange={() => dispatch(deepResearchActions.setDepthLevel(level.value))}
              disabled={isResearching}
            />
          ))}
        </div>

        {/* Options */}
        <div data-part={P.drOptionsSection}>
          <div data-part={P.drLabel}>Options:</div>
          <Checkbox
            checked={webSearch}
            onChange={() => dispatch(deepResearchActions.setWebSearch(!webSearch))}
            label="Web search"
          />
          <Checkbox
            checked={academicOnly}
            onChange={() => dispatch(deepResearchActions.setAcademicOnly(!academicOnly))}
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
          <div data-part={P.drSourceCount}>
            {'\uD83D\uDCE1'} {sourceCount} source
            {sourceCount !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* ── Right: Research Activity ── */}
      <div data-part={P.drActivity}>
        {/* Progress bar */}
        {(isResearching || report) && (
          <div data-part={P.drProgressSection}>
            <ProgressBar
              progress={progress}
              indeterminate={isResearching && progress < 15}
            />
            <div data-part={P.drProgressStatus}>
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
        <div data-part={P.drStepsArea}>
          {/* Empty state */}
          {!isResearching && steps.length === 0 && !report && (
            <EmptyState
              icon={'\uD83D\uDD0D'}
              message={
                <>
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>
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
                      borderTop: '1px solid var(--hc-color-row-odd, #ccc)',
                      paddingTop: 8,
                    }}
                  >
                    {'\u2318'}+Enter to start {'\u00B7'} Tip: be specific
                    for better results
                  </div>
                </>
              }
            />
          )}

          {/* Activity log */}
          {visibleSteps.map((step, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {step.type === 'status' && (
                <div data-part={P.drStepStatus}>
                  {isResearching && i === visibleSteps.length - 1 ? (
                    <span data-part={P.drBlink}>
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
                <div data-part={P.drStepThinking}>
                  {'\uD83D\uDCAD'} {step.text}
                </div>
              )}
            </div>
          ))}

          {/* Final report */}
          {report && (
            <div data-part={P.drReport}>
              <div data-part={P.drReportHeader}>
                {'\uD83D\uDCCB'} RESEARCH REPORT
              </div>
              <div data-part={P.drReportBody}>{report}</div>
            </div>
          )}
          <div ref={stepsEndRef} />
        </div>
      </div>
    </div>
  );
}

function StandaloneDeepResearch(props: DeepResearchProps) {
  const [state, dispatch] = useReducer(deepResearchReducer, createInitialSeed(props));

  return <DeepResearchFrame state={state} dispatch={dispatch} />;
}

function ConnectedDeepResearch(props: DeepResearchProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectDeepResearchState);

  useEffect(() => {
    reduxDispatch(deepResearchActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialQuery, props.initialSteps, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback((action: DeepResearchAction) => {
    reduxDispatch(action);
  }, [reduxDispatch]);

  return <DeepResearchFrame state={effectiveState} dispatch={dispatch} />;
}

// ── Main Component ──────────────────────────────────────────────────
export function DeepResearch(props: DeepResearchProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    DEEP_RESEARCH_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedDeepResearch {...props} />;
  }

  return <StandaloneDeepResearch {...props} />;
}
