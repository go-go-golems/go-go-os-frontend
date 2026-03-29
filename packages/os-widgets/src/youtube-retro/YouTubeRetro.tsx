import { useContext, useEffect, useMemo, useReducer, type FC } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { CHANNELS, COMMENTS, VIDEOS } from './sampleData';
import { CommentItem } from './CommentItem';
import { VideoCard } from './VideoCard';
import { VideoPlayer } from './VideoPlayer';
import { CATEGORIES, parseDuration, type YouTubeRetroProps } from './types';
import {
  createYouTubeRetroStateSeed,
  selectYouTubeRetroState,
  YOUTUBE_RETRO_STATE_KEY,
  youTubeRetroActions,
  youTubeRetroReducer,
  type YouTubeRetroAction,
  type YouTubeRetroState,
} from './youTubeRetroState';

function createInitialSeed(props: YouTubeRetroProps): YouTubeRetroState {
  return createYouTubeRetroStateSeed({
    initialVideos: props.videos ?? VIDEOS,
  });
}

function YouTubeRetroFrame({
  state,
  dispatch,
  height,
}: {
  state: YouTubeRetroState;
  dispatch: (action: YouTubeRetroAction) => void;
  height?: number | string;
}) {
  const currentVideo =
    state.currentVideoId === null
      ? null
      : state.videos.find((video) => video.id === state.currentVideoId) ?? null;
  const totalSec = currentVideo ? parseDuration(currentVideo.time) : 0;

  useEffect(() => {
    if (!state.playing) return;
    const intervalId = setInterval(() => {
      dispatch(youTubeRetroActions.setElapsed(state.elapsed + 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [dispatch, state.elapsed, state.playing]);

  useEffect(() => {
    if (state.playing && state.elapsed >= totalSec && totalSec > 0) {
      dispatch(youTubeRetroActions.setPlaying(false));
    }
  }, [dispatch, state.elapsed, state.playing, totalSec]);

  const filteredVideos = state.videos.filter((video) => {
    if (state.category !== 'all' && video.category !== state.category) return false;
    if (
      state.searchActive &&
      !video.title.toLowerCase().includes(state.searchActive.toLowerCase()) &&
      !video.channel.toLowerCase().includes(state.searchActive.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const relatedVideos = useMemo(() => {
    if (!currentVideo) return [];
    const others = state.videos.filter((video) => video.id !== currentVideo.id);
    return others
      .map((video, index) => ({ video, sort: Math.sin(currentVideo.id + index) }))
      .sort((left, right) => left.sort - right.sort)
      .map((entry) => entry.video)
      .slice(0, 6);
  }, [currentVideo, state.videos]);

  const allComments = [...state.userComments, ...COMMENTS];

  return (
    <div data-part={P.youtubeRetro} style={height ? { height } : undefined}>
      <div data-part={P.ytNavBar}>
        <Btn onClick={() => dispatch(youTubeRetroActions.goHome())}>🏠</Btn>
        {state.view === 'watch' && (
          <Btn onClick={() => dispatch(youTubeRetroActions.goHome())}>← Back</Btn>
        )}
        <div data-part={P.ytSearchGroup}>
          <input
            data-part={P.ytSearchInput}
            placeholder="Search YouTube…"
            value={state.searchTerm}
            onChange={(event) =>
              dispatch(youTubeRetroActions.setSearchTerm(event.target.value))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                dispatch(youTubeRetroActions.activateSearch());
              }
            }}
          />
          <Btn onClick={() => dispatch(youTubeRetroActions.activateSearch())}>🔍</Btn>
        </div>
        <Btn>🔔</Btn>
        <Btn>📤 Upload</Btn>
      </div>

      {state.view === 'home' && (
        <div data-part={P.ytHomeLayout}>
          <div data-part={P.ytSubSidebar}>
            <div data-part={P.ytSubTitle}>Subscriptions</div>
            <div data-part={P.ytSubList}>
              {CHANNELS.map((channel) => (
                <div
                  key={channel.id}
                  data-part={P.ytSubRow}
                  onClick={() => dispatch(youTubeRetroActions.setCategory(channel.id))}
                >
                  <span data-part={P.ytSubIcon}>{channel.icon}</span>
                  <div data-part={P.ytSubInfo}>
                    <div data-part={P.ytSubName}>{channel.name}</div>
                    <div data-part={P.ytSubCount}>{channel.subs} subs</div>
                  </div>
                </div>
              ))}
            </div>
            <div data-part={P.ytSubFooter}>📁 Library<br />⏱️ History<br />👍 Liked Videos</div>
          </div>

          <div data-part={P.ytHomeMain}>
            <div data-part={P.ytCategoryBar}>
              {CATEGORIES.map((category) => (
                <Btn
                  key={category.id}
                  onClick={() => dispatch(youTubeRetroActions.setCategory(category.id))}
                  data-active={state.category === category.id || undefined}
                >
                  {category.icon} {category.label}
                </Btn>
              ))}
            </div>
            <div data-part={P.ytVideoGrid}>
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => dispatch(youTubeRetroActions.openVideo(video.id))}
                  />
                ))
              ) : (
                <EmptyState icon="📭" message="No videos found." />
              )}
            </div>
          </div>
        </div>
      )}

      {state.view === 'watch' && currentVideo && (
        <div data-part={P.ytWatchLayout}>
          <div data-part={P.ytWatchMain}>
            <VideoPlayer
              video={currentVideo}
              playing={state.playing}
              onToggle={() => {
                if (!state.playing && state.elapsed >= totalSec) {
                  dispatch(youTubeRetroActions.setElapsed(0));
                }
                dispatch(youTubeRetroActions.setPlaying(!state.playing));
              }}
              elapsed={state.elapsed}
              totalSec={totalSec}
              onSeek={(seconds) => dispatch(youTubeRetroActions.setElapsed(seconds))}
            />

            <div data-part={P.ytVideoInfo}>
              <div data-part={P.ytVideoTitle}>{currentVideo.title}</div>
              <div data-part={P.ytVideoMeta}>
                <span>{currentVideo.views} views</span>
                <span>•</span>
                <span>{currentVideo.uploaded}</span>
              </div>
              <div data-part={P.ytVideoActions}>
                <Btn onClick={() => dispatch(youTubeRetroActions.toggleLiked(currentVideo.id))}>
                  👍 {state.likedVids[currentVideo.id] ? 'Liked' : currentVideo.likes}
                </Btn>
                <Btn>👎 {currentVideo.dislikes}</Btn>
                <Btn>↗️ Share</Btn>
                <Btn>📥 Save</Btn>
                <Btn>🚩 Report</Btn>
              </div>
              <div data-part={P.ytChannelSection}>
                <div data-part={P.ytChannelAvatarLg}>{currentVideo.channelIcon}</div>
                <div data-part={P.ytChannelInfo}>
                  <div data-part={P.ytChannelName}>{currentVideo.channel}</div>
                  <div data-part={P.ytChannelSubs}>
                    {CHANNELS.find((channel) => channel.id === currentVideo.category)?.subs ?? '100K'} subscribers
                  </div>
                </div>
                <Btn
                  onClick={() =>
                    dispatch(youTubeRetroActions.toggleSubscribed(currentVideo.channel))
                  }
                >
                  {state.subscribed[currentVideo.channel] ? '✓ Subscribed' : 'Subscribe'}
                </Btn>
              </div>
              <div data-part={P.ytDescription}>{currentVideo.desc}</div>
            </div>

            <div data-part={P.ytComments}>
              <div data-part={P.ytCommentsTitle}>💬 Comments — {allComments.length}</div>
              <div data-part={P.ytAddComment}>
                <div data-part={P.ytCommentAvatar}>🧑</div>
                <div data-part={P.ytCommentInput}>
                  <input
                    data-part={P.ytCommentInputField}
                    placeholder="Add a comment…"
                    value={state.commentText}
                    onChange={(event) =>
                      dispatch(youTubeRetroActions.setCommentText(event.target.value))
                    }
                    onKeyDown={(event) =>
                      event.key === 'Enter' && dispatch(youTubeRetroActions.submitComment())
                    }
                  />
                  {state.commentText && (
                    <div data-part={P.ytCommentBtns}>
                      <Btn onClick={() => dispatch(youTubeRetroActions.setCommentText(''))}>
                        Cancel
                      </Btn>
                      <Btn onClick={() => dispatch(youTubeRetroActions.submitComment())}>
                        Comment
                      </Btn>
                    </div>
                  )}
                </div>
              </div>

              <div data-part={P.ytCommentList}>
                {allComments.map((comment, index) => (
                  <CommentItem key={index} comment={comment} />
                ))}
              </div>
            </div>
          </div>

          <div data-part={P.ytRelated}>
            <div data-part={P.ytRelatedTitle}>Up Next</div>
            <div data-part={P.ytRelatedList}>
              <div data-part={P.ytAutoplayLabel}>AUTOPLAY</div>
              {relatedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  compact
                  onClick={() => dispatch(youTubeRetroActions.openVideo(video.id))}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <WidgetStatusBar>
        <span>{state.playing ? '▶ Playing' : '⏸ Idle'}</span>
        <span>📺 {state.videos.length} videos</span>
        <div style={{ flex: 1 }} />
        <span>🔔 {Object.values(state.subscribed).filter(Boolean).length} subscriptions</span>
        <span>👍 {Object.values(state.likedVids).filter(Boolean).length} liked</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneYouTubeRetro(props: YouTubeRetroProps) {
  const [state, dispatch] = useReducer(youTubeRetroReducer, createInitialSeed(props));
  return <YouTubeRetroFrame state={state} dispatch={dispatch} height={props.height} />;
}

function ConnectedYouTubeRetro(props: YouTubeRetroProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectYouTubeRetroState);

  useEffect(() => {
    reduxDispatch(youTubeRetroActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.videos, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <YouTubeRetroFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      height={props.height}
    />
  );
}

export const YouTubeRetro: FC<YouTubeRetroProps> = (props) => {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    YOUTUBE_RETRO_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedYouTubeRetro {...props} />;
  }

  return <StandaloneYouTubeRetro {...props} />;
};
