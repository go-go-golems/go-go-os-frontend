import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { REPL_PARTS as P } from './parts';
import { WidgetStatusBar } from './WidgetStatusBar';
import { ReplInputLine } from './ReplInputLine';
import { executeReplSubmission, resolveReplCompletionState } from './controller';
import { BUILTIN_DEMO_REPL_DRIVER } from './replCommands';
import {
  selectMacReplState,
  createMacReplStateSeed,
  macReplActions,
  macReplReducer,
  MAC_REPL_STATE_KEY,
  type MacReplAction,
  type MacReplState,
} from './replState';
import type { ReplDriver, ReplDriverContext, ReplEffect, TerminalLine } from './types';

export interface MacReplProps {
  initialLines?: TerminalLine[];
  prompt?: string;
  driver?: ReplDriver;
  onEffects?: (effects: ReplEffect[]) => void;
}

function createInitialSeed(props: MacReplProps): MacReplState {
  return createMacReplStateSeed({
    initialLines: props.initialLines,
    prompt: props.prompt,
  });
}

function createDriverContext(state: MacReplState, uptimeMs: number): ReplDriverContext {
  return {
    lines: state.lines,
    historyStack: state.historyStack,
    envVars: state.envVars,
    aliases: state.aliases,
    uptimeMs,
  };
}

function currentPrompt(state: MacReplState): string {
  const prompt = state.envVars.REPL_PROMPT;
  return typeof prompt === 'string' && prompt.trim().length > 0 ? prompt : state.prompt;
}

function prependInputLine(raw: string, lines: TerminalLine[]): TerminalLine[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return lines;
  }
  if (lines[0]?.type === 'input' && lines[0]?.text === trimmed) {
    return lines;
  }
  return [{ type: 'input', text: trimmed }, ...lines];
}

function MacReplFrame({
  state,
  dispatch,
  driver,
  onEffects,
}: {
  state: MacReplState;
  dispatch: (action: MacReplAction) => void;
  driver: ReplDriver;
  onEffects?: (effects: ReplEffect[]) => void;
}) {
  const [input, setInput] = useState('');
  const startTime = useRef(Date.now());
  const [isRunning, setIsRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionIdx, setCompletionIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const driverContext = createDriverContext(state, Date.now() - startTime.current);
  const completionState = resolveReplCompletionState(input, driver, driverContext);
  const suggestion = completionState.suggestion;
  const completions = completionState.items;
  const prompt = currentPrompt(state);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (completionState.items.length === 0 && showCompletion) {
      setShowCompletion(false);
    }
  }, [completionState.items.length, showCompletion]);

  const executeCommand = useCallback(
    async (raw: string) => {
      const result = await executeReplSubmission(
        raw,
        driver,
        createDriverContext(state, Date.now() - startTime.current),
      );

      if (result.clearTranscript) {
        dispatch(macReplActions.setLines([]));
      } else {
        const nextLines = prependInputLine(raw, result.lines);
        if (nextLines.length > 0) {
          dispatch(macReplActions.appendLines(nextLines));
        }
      }
      if (result.envVars) {
        Object.entries(result.envVars).forEach(([key, value]) => {
          dispatch(macReplActions.setEnvVar({ key, value }));
        });
      }
      if (result.aliases) {
        const current = Object.keys(state.aliases);
        current.forEach((alias) => {
          if (!(alias in result.aliases!)) {
            dispatch(macReplActions.removeAlias(alias));
          }
        });
        Object.entries(result.aliases).forEach(([key, value]) => {
          dispatch(macReplActions.setAlias({ key, value }));
        });
      }
      if (result.effects && result.effects.length > 0) {
        onEffects?.(result.effects);
      }
    },
    [dispatch, driver, onEffects, state],
  );

  const handleSubmit = async () => {
    if (isRunning) {
      return;
    }

    const trimmed = input.trim();
    if (trimmed) {
      dispatch(macReplActions.setHistoryStack([...state.historyStack, trimmed]));
    }
    setIsRunning(true);
    try {
      await executeCommand(trimmed);
    } catch (error) {
      dispatch(
        macReplActions.appendLines([
          {
            type: 'error',
            text: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    } finally {
      setIsRunning(false);
    }
    setInput('');
    dispatch(macReplActions.setHistoryIndex(-1));
    setShowCompletion(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (completions.length === 1) {
        setInput(completions[0].value + ' ');
        setShowCompletion(false);
      } else if (completions.length > 1) {
        if (showCompletion) {
          setInput(completions[completionIdx].value + ' ');
          setShowCompletion(false);
        } else {
          setShowCompletion(true);
          setCompletionIdx(0);
        }
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (showCompletion) {
        setCompletionIdx((index) => Math.max(0, index - 1));
      } else if (state.historyStack.length > 0) {
        const newIdx =
          state.historyIndex === -1
            ? state.historyStack.length - 1
            : Math.max(0, state.historyIndex - 1);
        dispatch(macReplActions.setHistoryIndex(newIdx));
        setInput(state.historyStack[newIdx]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (showCompletion) {
        setCompletionIdx((index) => Math.min(completions.length - 1, index + 1));
      } else if (state.historyIndex !== -1) {
        const newIdx = state.historyIndex + 1;
        if (newIdx >= state.historyStack.length) {
          dispatch(macReplActions.setHistoryIndex(-1));
          setInput('');
        } else {
          dispatch(macReplActions.setHistoryIndex(newIdx));
          setInput(state.historyStack[newIdx]);
        }
      }
    } else if (event.key === 'Escape') {
      setShowCompletion(false);
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      dispatch(macReplActions.setLines([]));
    }
  };

  return (
    <div data-part={P.repl}>
      <div data-part={P.replBody} ref={scrollRef} onClick={() => inputRef.current?.focus()}>
        {state.lines.map((line, index) => (
          <div key={index} data-part={P.replLine} data-line-type={line.type}>
            {line.type === 'input' ? (
              <span>
                <span style={{ opacity: 0.6 }}>▸ </span>
                {line.text}
              </span>
            ) : (
              line.text
            )}
          </div>
        ))}

        <ReplInputLine
          prompt={prompt}
          input={input}
          suggestion={suggestion}
          showCompletion={showCompletion}
          completions={completions}
          completionIdx={completionIdx}
          disabled={isRunning}
          inputRef={inputRef}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          onPickCompletion={(completion) => {
            setInput(completion.value + ' ');
            setShowCompletion(false);
          }}
        />
      </div>

      <WidgetStatusBar>
        <span>{state.envVars.HOME}</span>
        <span>{state.historyStack.length} cmds</span>
        <span>{isRunning ? 'running…' : 'idle'}</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneMacRepl(props: MacReplProps) {
  const [state, dispatch] = useReducer(macReplReducer, createInitialSeed(props));
  return (
    <MacReplFrame
      state={state}
      dispatch={dispatch}
      driver={props.driver ?? BUILTIN_DEMO_REPL_DRIVER}
      onEffects={props.onEffects}
    />
  );
}

function ConnectedMacRepl(props: MacReplProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacReplState);

  useEffect(() => {
    reduxDispatch(macReplActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialLines, props.prompt, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <MacReplFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      driver={props.driver ?? BUILTIN_DEMO_REPL_DRIVER}
      onEffects={props.onEffects}
    />
  );
}

export function MacRepl(props: MacReplProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_REPL_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacRepl {...props} />;
  }

  return <StandaloneMacRepl {...props} />;
}
