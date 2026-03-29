import { useCallback, useContext, useEffect, useReducer } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { DEFAULT_MARKDOWN } from './sampleData';
import { MacSlidesView } from './MacSlidesView';
import {
  createMacSlidesStateSeed,
  macSlidesActions,
  macSlidesReducer,
  MAC_SLIDES_STATE_KEY,
  selectMacSlidesState,
  type MacSlidesAction,
} from './macSlidesState';

export interface MacSlidesProps {
  initialMarkdown?: string;
  fileName?: string;
  initialSlide?: number;
  initialShowPalette?: boolean;
  initialShowPresentation?: boolean;
}

function createInitialSeed(props: MacSlidesProps): ReturnType<typeof createMacSlidesStateSeed> {
  return createMacSlidesStateSeed({
    initialMarkdown: props.initialMarkdown ?? DEFAULT_MARKDOWN,
    initialSlide: props.initialSlide,
    paletteOpen: props.initialShowPalette,
    presentationOpen: props.initialShowPresentation,
  });
}

function StandaloneMacSlides(props: MacSlidesProps) {
  const [state, dispatch] = useReducer(macSlidesReducer, createInitialSeed(props));

  return (
    <MacSlidesView
      state={state}
      dispatch={dispatch}
      fileName={props.fileName ?? 'Untitled Presentation'}
    />
  );
}

function ConnectedMacSlides(props: MacSlidesProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacSlidesState);

  useEffect(() => {
    reduxDispatch(macSlidesActions.initializeIfNeeded(createInitialSeed(props)));
  }, [
    props.initialMarkdown,
    props.initialShowPalette,
    props.initialShowPresentation,
    props.initialSlide,
    reduxDispatch,
  ]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback(
    (action: MacSlidesAction) => {
      reduxDispatch(action);
    },
    [reduxDispatch],
  );

  return (
    <MacSlidesView
      state={effectiveState}
      dispatch={dispatch}
      fileName={props.fileName ?? 'Untitled Presentation'}
    />
  );
}

export function MacSlides(props: MacSlidesProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_SLIDES_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacSlides {...props} />;
  }

  return <StandaloneMacSlides {...props} />;
}
