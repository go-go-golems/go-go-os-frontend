import {
  useContext,
  useEffect,
  useReducer,
  useState,
  useCallback,
} from 'react';
import { Btn } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { type Track, parseDuration, fmtTime } from './types';
import { PLAYLISTS, ALBUMS, getTracksForPlaylist } from './sampleData';
import type { Playlist } from './types';
import {
  createMusicPlayerStateSeed,
  MUSIC_PLAYER_STATE_KEY,
  musicPlayerActions,
  musicPlayerReducer,
  selectMusicPlayerState,
  type MusicPlayerAction,
  type MusicPlayerState,
} from './musicPlayerState';

function EqViz({ playing }: { playing: boolean }) {
  const [bars, setBars] = useState(Array(16).fill(3) as number[]);
  useEffect(() => {
    if (!playing) {
      setBars(Array(16).fill(1));
      return;
    }
    const id = setInterval(() => {
      setBars(Array(16).fill(0).map(() => Math.floor(Math.random() * 12) + 1));
    }, 180);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div data-part={P.mpEqViz}>
      {bars.map((height, index) => (
        <div key={index} data-part={P.mpEqBar} style={{ height }} />
      ))}
    </div>
  );
}

function Marquee({ text }: { text: string }) {
  return (
    <div data-part={P.mpMarquee}>
      <div data-part={P.mpMarqueeInner}>{text}</div>
    </div>
  );
}

export interface RetroMusicPlayerProps {
  initialPlaylists?: Playlist[];
}

function createInitialSeed(props: RetroMusicPlayerProps): MusicPlayerState {
  return createMusicPlayerStateSeed({
    initialPlaylists: props.initialPlaylists ?? PLAYLISTS,
  });
}

function RetroMusicPlayerFrame({
  state,
  dispatch,
}: {
  state: MusicPlayerState;
  dispatch: (action: MusicPlayerAction) => void;
}) {
  const {
    playlists,
    currentTrack,
    trackIdx,
    playing,
    elapsed,
    selectedPlaylistId,
    searchTerm,
    showQueue,
    showEq,
    view,
    volume,
    shuffle,
    repeat,
    liked,
  } = state;

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? playlists[0];
  const tracks = getTracksForPlaylist(selectedPlaylist.id);
  const totalDuration = currentTrack ? parseDuration(currentTrack.duration) : 200;
  const progress = currentTrack ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
  const filteredTracks = tracks.filter(
    (track) =>
      !searchTerm ||
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const albumMeta = ALBUMS[selectedPlaylist.id];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => dispatch(musicPlayerActions.tick()), 1000);
    return () => clearInterval(id);
  }, [dispatch, playing, currentTrack]);

  const playTrack = useCallback((track: Track, idx: number) => {
    dispatch(musicPlayerActions.playTrack({ track, idx }));
  }, [dispatch]);

  const nextTrack = useCallback(() => {
    const next = shuffle ? Math.floor(Math.random() * tracks.length) : (trackIdx + 1) % tracks.length;
    playTrack(tracks[next], next);
  }, [playTrack, shuffle, trackIdx, tracks]);

  const prevTrack = useCallback(() => {
    if (elapsed > 3) {
      dispatch(musicPlayerActions.setElapsed(0));
      return;
    }
    const prev = (trackIdx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prev], prev);
  }, [dispatch, elapsed, playTrack, trackIdx, tracks]);

  useEffect(() => {
    if (playing && currentTrack && elapsed >= totalDuration) {
      if (repeat) {
        dispatch(musicPlayerActions.setElapsed(0));
      } else {
        nextTrack();
      }
    }
  }, [currentTrack, dispatch, elapsed, nextTrack, playing, repeat, totalDuration]);

  return (
    <div data-part={P.musicPlayer}>
      <div data-part={P.mpNowPlaying}>
        <div data-part={P.mpNpContent}>
          <div data-part={P.mpAlbumArt}>
            {currentTrack ? albumMeta?.cover || '\uD83C\uDFB5' : '\uD83C\uDFB5'}
          </div>

          <div data-part={P.mpTrackInfo}>
            <div data-part={P.mpTrackTitle}>
              {currentTrack ? currentTrack.title : 'No track selected'}
            </div>
            <div data-part={P.mpTrackArtist}>
              {currentTrack ? `${currentTrack.artist} \u2014 ${currentTrack.album}` : 'Select a song to play'}
            </div>

            <div data-part={P.mpTransport}>
              <Btn onClick={() => dispatch(musicPlayerActions.toggleShuffle())} data-state={shuffle ? 'active' : undefined}>
                {'\uD83D\uDD00'}
              </Btn>
              <Btn onClick={prevTrack}>{'\u23EE'}</Btn>
              <Btn
                data-state="active"
                onClick={() => {
                  if (!currentTrack && tracks.length) {
                    playTrack(tracks[0], 0);
                  } else {
                    dispatch(musicPlayerActions.togglePlaying());
                  }
                }}
              >
                {playing ? '\u23F8' : '\u25B6'}
              </Btn>
              <Btn onClick={nextTrack}>{'\u23ED'}</Btn>
              <Btn onClick={() => dispatch(musicPlayerActions.toggleRepeat())} data-state={repeat ? 'active' : undefined}>
                {repeat ? '\uD83D\uDD02' : '\uD83D\uDD01'}
              </Btn>

              <div data-part={P.mpProgressArea}>
                <span data-part={P.mpTimeLabel}>{fmtTime(elapsed)}</span>
                <div
                  data-part={P.mpProgressBar}
                  onClick={(event) => {
                    if (!currentTrack) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const pct = (event.clientX - rect.left) / rect.width;
                    dispatch(musicPlayerActions.setElapsed(Math.floor(pct * totalDuration)));
                  }}
                >
                  <div data-part={P.mpProgressFill} style={{ width: `${progress}%` }} />
                </div>
                <span data-part={P.mpTimeLabel}>{currentTrack ? currentTrack.duration : '0:00'}</span>
              </div>

              <span data-part={P.mpVolIcon}>{'\uD83D\uDD08'}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(event) => dispatch(musicPlayerActions.setVolume(+event.target.value))}
                data-part={P.mpVolSlider}
              />
              <span data-part={P.mpVolIcon}>{'\uD83D\uDD0A'}</span>
            </div>
          </div>

          {showEq && (
            <div data-part={P.mpEqContainer}>
              <EqViz playing={playing} />
            </div>
          )}
        </div>

        {currentTrack && playing && (
          <div data-part={P.mpTicker}>
            <Marquee text={`\u266B  Now Playing: ${currentTrack.title} by ${currentTrack.artist}  \u2014  Album: ${currentTrack.album}  \u2014  ${selectedPlaylist.name}  \u266B`} />
          </div>
        )}
      </div>

      <div data-part={P.mpBody}>
        <div data-part={P.mpSidebar}>
          <div data-part={P.mpSidebarTitle}>YOUR LIBRARY</div>
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              data-part={P.mpPlaylistRow}
              data-state={selectedPlaylist.id === playlist.id ? 'active' : undefined}
              onClick={() => dispatch(musicPlayerActions.selectPlaylist(playlist.id))}
            >
              <span data-part={P.mpPlaylistIcon}>{playlist.icon}</span>
              <div data-part={P.mpPlaylistInfo}>
                <div data-part={P.mpPlaylistName}>{playlist.name}</div>
                <div data-part={P.mpPlaylistCount}>{playlist.count} songs</div>
              </div>
            </div>
          ))}
        </div>

        <div data-part={P.mpMain}>
          <WidgetToolbar>
            <Btn onClick={() => playTrack(tracks[0], 0)}>{'\u25B6'} Play All</Btn>
            <Btn
              onClick={() => {
                const index = Math.floor(Math.random() * tracks.length);
                playTrack(tracks[index], index);
                dispatch(musicPlayerActions.setShuffle(true));
              }}
            >
              {'\uD83D\uDD00'} Shuffle
            </Btn>
            <Btn onClick={() => dispatch(musicPlayerActions.setView(view === 'list' ? 'grid' : 'list'))}>
              {view === 'list' ? 'Grid' : 'List'}
            </Btn>
            <Btn onClick={() => dispatch(musicPlayerActions.toggleEq())} data-state={showEq ? 'active' : undefined}>
              EQ
            </Btn>
            <Btn onClick={() => dispatch(musicPlayerActions.toggleQueue())} data-state={showQueue ? 'active' : undefined}>
              Queue
            </Btn>
            <div style={{ flex: 1 }} />
            <input
              data-part={P.mpSearchInput}
              type="text"
              placeholder="Search in playlist\u2026"
              value={searchTerm}
              onChange={(event) => dispatch(musicPlayerActions.setSearchTerm(event.target.value))}
            />
          </WidgetToolbar>

          <div data-part={P.mpPlaylistHeader}>
            <div data-part={P.mpPlaylistCover}>{albumMeta?.cover || '\uD83C\uDFB5'}</div>
            <div>
              <div data-part={P.mpPlaylistHeaderName}>{selectedPlaylist.name}</div>
              <div data-part={P.mpPlaylistHeaderArtist}>
                {albumMeta?.artist} {albumMeta?.year && `\u2022 ${albumMeta.year}`}
              </div>
              <div data-part={P.mpPlaylistHeaderCount}>{selectedPlaylist.count} songs</div>
            </div>
          </div>

          {view === 'list' ? (
            <div data-part={P.mpTrackList}>
              <div data-part={P.mpTrackListHeader}>
                <span style={{ width: 20, textAlign: 'center' }}>#</span>
                <span style={{ flex: 2 }}>Title</span>
                <span style={{ flex: 1 }}>Artist</span>
                <span style={{ flex: 1 }}>Album</span>
                <span style={{ width: 20, textAlign: 'center' }}>{'\u2764\uFE0F'}</span>
                <span style={{ width: 40, textAlign: 'right' }}>Time</span>
              </div>
              {filteredTracks.map((track, index) => {
                const isCurrent =
                  currentTrack?.title === track.title && currentTrack?.artist === track.artist;
                const likeKey = `${track.title}-${track.artist}`;
                return (
                  <div
                    key={index}
                    data-part={P.mpTrackRow}
                    data-state={isCurrent ? 'active' : undefined}
                    data-stripe={index % 2 === 0 ? 'even' : 'odd'}
                    onDoubleClick={() => playTrack(track, index)}
                  >
                    <span data-part={P.mpTrackNum}>{isCurrent && playing ? '\uD83D\uDD0A' : index + 1}</span>
                    <span data-part={P.mpTrackRowTitle}>{track.title}</span>
                    <span data-part={P.mpTrackRowArtist}>{track.artist}</span>
                    <span data-part={P.mpTrackRowAlbum}>{track.album}</span>
                    <span
                      data-part={P.mpLikeBtn}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch(musicPlayerActions.toggleLike(likeKey));
                      }}
                    >
                      {liked[likeKey] ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
                    </span>
                    <span data-part={P.mpTrackDuration}>{track.duration}</span>
                  </div>
                );
              })}
              {filteredTracks.length === 0 && <EmptyState message="No matching tracks." />}
            </div>
          ) : (
            <div data-part={P.mpGridView}>
              {filteredTracks.map((track, index) => {
                const isCurrent = currentTrack?.title === track.title;
                return (
                  <div
                    key={index}
                    data-part={P.mpGridCard}
                    data-state={isCurrent ? 'active' : undefined}
                    onDoubleClick={() => playTrack(track, index)}
                  >
                    <div data-part={P.mpGridCardIcon}>{'\uD83C\uDFB5'}</div>
                    <div data-part={P.mpGridCardTitle}>{track.title}</div>
                    <div data-part={P.mpGridCardArtist}>{track.artist}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showQueue && (
          <div data-part={P.mpQueue}>
            <div data-part={P.mpQueueHeader}>
              <span>Up Next</span>
              <Btn onClick={() => dispatch(musicPlayerActions.toggleQueue())}>{'\u00D7'}</Btn>
            </div>
            <div data-part={P.mpQueueList}>
              {tracks.slice(trackIdx + 1, trackIdx + 10).map((track, index) => (
                <div
                  key={index}
                  data-part={P.mpQueueRow}
                  onDoubleClick={() => playTrack(track, trackIdx + 1 + index)}
                >
                  <span data-part={P.mpQueueNum}>{index + 1}</span>
                  <div data-part={P.mpQueueInfo}>
                    <div data-part={P.mpQueueTitle}>{track.title}</div>
                    <div data-part={P.mpQueueArtist}>{track.artist}</div>
                  </div>
                  <span data-part={P.mpQueueDuration}>{track.duration}</span>
                </div>
              ))}
              {tracks.slice(trackIdx + 1).length === 0 && <EmptyState message="Queue empty." />}
            </div>
          </div>
        )}
      </div>

      <WidgetStatusBar>
        <span>{playing ? '\uD83D\uDD0A Playing' : '\u23F8 Paused'}</span>
        {shuffle && <span>{'\uD83D\uDD00'} Shuffle</span>}
        {repeat && <span>{'\uD83D\uDD02'} Repeat</span>}
        <div style={{ flex: 1 }} />
        <span>Vol: {volume}%</span>
        <span>{playlists.length} playlists</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneRetroMusicPlayer(props: RetroMusicPlayerProps) {
  const [state, dispatch] = useReducer(musicPlayerReducer, createInitialSeed(props));
  return <RetroMusicPlayerFrame state={state} dispatch={dispatch} />;
}

function ConnectedRetroMusicPlayer(props: RetroMusicPlayerProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMusicPlayerState);

  useEffect(() => {
    reduxDispatch(musicPlayerActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialPlaylists, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <RetroMusicPlayerFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function RetroMusicPlayer(props: RetroMusicPlayerProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MUSIC_PLAYER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedRetroMusicPlayer {...props} />;
  }

  return <StandaloneRetroMusicPlayer {...props} />;
}
