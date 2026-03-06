import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type FC,
} from 'react';
import { Btn, RadioButton } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { SearchBar } from '../primitives/SearchBar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { STREAMS, CHAT_MESSAGES } from './sampleData';
import { drawStreamThumb } from './streamArt';
import {
  createStreamLauncherStateSeed,
  streamLauncherActions,
  streamLauncherReducer,
  STREAM_LAUNCHER_STATE_KEY,
  selectStreamLauncherState,
  type StreamLauncherAction,
  type StreamLauncherState,
} from './streamLauncherState';
import type { StreamLauncherProps } from './types';
import type { Stream, StreamSort } from './types';
import { CATEGORIES, SORT_OPTIONS } from './types';

const StreamThumb: FC<{
  stream: Stream;
  isPlaying: boolean;
  size?: 'normal' | 'large';
  onClick?: () => void;
}> = ({ stream, isPlaying, size = 'normal', onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = size === 'large' ? 280 : 130;
  const height = size === 'large' ? 180 : 80;

  useEffect(() => {
    if (canvasRef.current) {
      drawStreamThumb(canvasRef.current, stream.thumb, width, height, isPlaying);
    }
  }, [stream.thumb, isPlaying, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      data-part={P.slCanvas}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    />
  );
};

const StreamCard: FC<{
  stream: Stream;
  isActive: boolean;
  onSelect: (id: string) => void;
}> = ({ stream, isActive, onSelect }) => {
  const isLive = stream.status === 'live';
  const isVod = stream.status === 'vod';

  return (
    <div
      data-part={P.slStreamCard}
      data-active={isActive || undefined}
      onClick={() => onSelect(stream.id)}
    >
      <StreamThumb stream={stream} isPlaying={isActive} onClick={() => onSelect(stream.id)} />
      <div data-part={P.slCardInfo}>
        <div data-part={P.slCardBadges}>
          {isLive && <span data-part={P.slBadgeLive}>● LIVE</span>}
          {isVod && <span data-part={P.slBadgeVod}>📼 VOD</span>}
          {stream.status === 'offline' && (
            <span data-part={P.slBadgeOffline}>○ OFFLINE</span>
          )}
        </div>
        <div data-part={P.slCardTitle}>{stream.title}</div>
        <div data-part={P.slCardHost}>{stream.host}</div>
        <div data-part={P.slCardDesc}>{stream.desc}</div>
        <div data-part={P.slCardMeta}>
          <span>👁️ {stream.viewers.toLocaleString()}</span>
          <span>⏱️ {stream.duration}</span>
        </div>
      </div>
    </div>
  );
};

function PlayerView({
  stream,
  playing,
  progress,
  volume,
  showChat,
  dispatch,
}: {
  stream: Stream;
  playing: boolean;
  progress: number;
  volume: number;
  showChat: boolean;
  dispatch: (action: StreamLauncherAction) => void;
}) {
  useEffect(() => {
    if (!playing) return;
    const intervalId = setInterval(() => {
      dispatch(
        streamLauncherActions.setPlayerProgress(progress >= 1 ? 0 : progress + 0.002),
      );
    }, 200);
    return () => clearInterval(intervalId);
  }, [dispatch, playing, progress]);

  const handleVolClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      dispatch(
        streamLauncherActions.setPlayerVolume(
          (event.clientX - rect.left) / rect.width,
        ),
      );
    },
    [dispatch],
  );

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      dispatch(
        streamLauncherActions.setPlayerProgress(
          (event.clientX - rect.left) / rect.width,
        ),
      );
    },
    [dispatch],
  );

  return (
    <div data-part={P.slPlayer}>
      <div data-part={P.slPlayerMain}>
        <div data-part={P.slVideoArea}>
          <div data-part={P.slVideoFrame}>
            <StreamThumb
              stream={stream}
              isPlaying={playing}
              size="large"
              onClick={() =>
                dispatch(streamLauncherActions.setPlayerPlaying(!playing))
              }
            />
            <div data-part={P.slVideoOverlay}>
              {stream.status === 'live' && (
                <span data-part={P.slOverlayLive}>● LIVE</span>
              )}
              <span>👁️ {stream.viewers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div data-part={P.slControls}>
          <div data-part={P.slProgressArea}>
            <span data-part={P.slProgressPct}>{Math.floor(progress * 100)}%</span>
            <div data-part={P.slProgressBar} onClick={handleSeek}>
              <div
                data-part={P.slProgressFill}
                style={{ width: `${progress * 100}%` }}
              />
              <div
                data-part={P.slProgressThumb}
                style={{ left: `calc(${progress * 100}% - 4px)` }}
              />
            </div>
            <span data-part={P.slDuration}>{stream.duration}</span>
          </div>
          <div data-part={P.slTransport}>
            <Btn
              onClick={() =>
                dispatch(streamLauncherActions.setPlayerProgress(progress - 0.05))
              }
            >
              ⏮
            </Btn>
            <Btn
              onClick={() =>
                dispatch(streamLauncherActions.setPlayerPlaying(!playing))
              }
            >
              {playing ? '⏸' : '▶'}
            </Btn>
            <Btn
              onClick={() =>
                dispatch(streamLauncherActions.setPlayerProgress(progress + 0.05))
              }
            >
              ⏭
            </Btn>
            <Separator />
            <div data-part={P.slVolume}>
              <span data-part={P.slVolIcon}>🔈</span>
              <div data-part={P.slVolBar} onClick={handleVolClick}>
                <div
                  data-part={P.slVolFill}
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span data-part={P.slVolIcon}>🔊</span>
            </div>
            <div style={{ flex: 1 }} />
            <Btn
              onClick={() => dispatch(streamLauncherActions.toggleChat())}
              data-active={showChat || undefined}
            >
              💬 Chat
            </Btn>
            <Btn onClick={() => dispatch(streamLauncherActions.closePlayer())}>
              ✕ Close
            </Btn>
          </div>
        </div>

        <div data-part={P.slStreamInfo}>
          <div data-part={P.slStreamInfoRow}>
            <div data-part={P.slHostAvatar}>👤</div>
            <div data-part={P.slStreamInfoText}>
              <div data-part={P.slStreamInfoTitle}>{stream.title}</div>
              <div data-part={P.slStreamInfoSub}>
                {stream.host} · {stream.cat}
              </div>
            </div>
            <Btn>⭐ Follow</Btn>
          </div>
          <div data-part={P.slStreamInfoDesc}>{stream.desc}</div>
        </div>
      </div>

      {showChat && (
        <div data-part={P.slChat}>
          <div data-part={P.slChatHeader}>💬 Live Chat</div>
          <div data-part={P.slChatMessages}>
            {CHAT_MESSAGES.map((message, index) => (
              <div key={index} data-part={P.slChatMsg}>
                <span data-part={P.slChatUser}>{message.user}:</span>{' '}
                <span data-part={P.slChatText}>{message.msg}</span>
              </div>
            ))}
          </div>
          <div data-part={P.slChatInputRow}>
            <input
              data-part={P.slChatInput}
              placeholder="Say something…"
              onKeyDown={(event) =>
                event.key === 'Enter' && event.preventDefault()
              }
            />
            <Btn>Send</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function createInitialSeed(props: StreamLauncherProps): StreamLauncherState {
  return createStreamLauncherStateSeed({
    initialStreams: props.streams ?? STREAMS,
    category: props.initialCategory ?? 'All',
  });
}

function StreamLauncherFrame({
  state,
  dispatch,
  height,
}: {
  state: StreamLauncherState;
  dispatch: (action: StreamLauncherAction) => void;
  height?: number | string;
}) {
  const { streams, category, activeStreamId, search, sortBy } = state;

  const filtered = streams
    .filter((stream) => category === 'All' || stream.cat === category)
    .filter(
      (stream) =>
        !search ||
        stream.title.toLowerCase().includes(search.toLowerCase()) ||
        stream.host.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((left, right) =>
      sortBy === 'viewers'
        ? right.viewers - left.viewers
        : left.title.localeCompare(right.title),
    );

  const liveCount = streams.filter((stream) => stream.status === 'live').length;
  const totalViewers = streams.reduce((sum, stream) => sum + stream.viewers, 0);
  const playing = activeStreamId
    ? streams.find((stream) => stream.id === activeStreamId) ?? null
    : null;

  return (
    <div data-part={P.streamLauncher} style={height ? { height } : undefined}>
      <div data-part={P.slSidebar}>
        <div data-part={P.slSidebarTitle}>📺 Channels</div>
        <div data-part={P.slCategoryList}>
          {CATEGORIES.map((streamCategory) => (
            <div
              key={streamCategory}
              data-part={P.slCategoryItem}
              data-selected={category === streamCategory || undefined}
              onClick={() =>
                dispatch(streamLauncherActions.setCategory(streamCategory))
              }
            >
              {streamCategory}
            </div>
          ))}
        </div>

        <div data-part={P.slSortSection}>
          <div data-part={P.slSortTitle}>Sort by</div>
          {SORT_OPTIONS.map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              selected={sortBy === option.value}
              onChange={() =>
                dispatch(
                  streamLauncherActions.setSortBy(option.value as StreamSort),
                )
              }
            />
          ))}
        </div>

        <div data-part={P.slSidebarStats}>
          📊 {streams.length} streams
          <br />
          📡 {liveCount} live now
          <br />
          📼 {streams.filter((stream) => stream.status === 'vod').length} archived
          <br />
          👁️ {totalViewers.toLocaleString()} viewers
        </div>
      </div>

      <div data-part={P.slMain}>
        {playing ? (
          <PlayerView
            stream={playing}
            playing={state.playerPlaying}
            progress={state.playerProgress}
            volume={state.playerVolume}
            showChat={state.showChat}
            dispatch={dispatch}
          />
        ) : (
          <>
            <SearchBar
              value={search}
              onChange={(value) => dispatch(streamLauncherActions.setSearch(value))}
              placeholder="Search streams…"
              count={filtered.length}
            />
            <div data-part={P.slStreamList}>
              {filtered.length === 0 ? (
                <EmptyState icon="📺" message="No streams found" />
              ) : (
                filtered.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    isActive={activeStreamId === stream.id}
                    onSelect={(id) => dispatch(streamLauncherActions.openStream(id))}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      <WidgetStatusBar>
        <span>
          {playing ? `▶ Now playing: ${playing.title}` : 'Select a stream to watch'}
        </span>
        <span>📺 Stream Launcher v1.0 │ {category}</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneStreamLauncher(props: StreamLauncherProps) {
  const [state, dispatch] = useReducer(streamLauncherReducer, createInitialSeed(props));
  return <StreamLauncherFrame state={state} dispatch={dispatch} height={props.height} />;
}

function ConnectedStreamLauncher(props: StreamLauncherProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectStreamLauncherState);

  useEffect(() => {
    reduxDispatch(streamLauncherActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialCategory, props.streams, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <StreamLauncherFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      height={props.height}
    />
  );
}

export const StreamLauncher: FC<StreamLauncherProps> = (props) => {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    STREAM_LAUNCHER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedStreamLauncher {...props} />;
  }

  return <StandaloneStreamLauncher {...props} />;
};
