import { useState, useEffect, useMemo, type FC } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import type { YtVideo, YtComment as YtCommentT, YtView } from './types';
import { CATEGORIES, parseDuration, fmtTime } from './types';
import { CHANNELS, VIDEOS, COMMENTS } from './sampleData';

/* ------------------------------------------------------------------ */
/*  VideoPlayer                                                        */
/* ------------------------------------------------------------------ */

const VideoPlayer: FC<{
  video: YtVideo;
  playing: boolean;
  onToggle: () => void;
  elapsed: number;
  totalSec: number;
  onSeek: (s: number) => void;
}> = ({ video, playing, onToggle, elapsed, totalSec, onSeek }) => {
  const progress = totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;

  const [scanY, setScanY] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setScanY(y => (y + 2) % 100), 50);
    return () => clearInterval(id);
  }, [playing]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.floor(((e.clientX - r.left) / r.width) * totalSec));
  };

  return (
    <div data-part={P.ytPlayerWrap}>
      {/* CRT Screen */}
      <div data-part={P.ytScreen}>
        <div data-part={P.ytScanlines} />
        {playing && (
          <div data-part={P.ytMovingScan} style={{ top: `${scanY}%` }} />
        )}
        <div data-part={P.ytVignette} />
        <div
          data-part={P.ytScreenContent}
          style={{ filter: playing ? 'none' : 'grayscale(0.5)' }}
        >
          {video.thumb}
        </div>
        {!playing && <div data-part={P.ytPausedLabel}>{'\u23F8'} PAUSED</div>}
        {!playing && (
          <div data-part={P.ytPlayOverlay} onClick={onToggle}>
            <div data-part={P.ytPlayBtn}>{'\u25B6'}</div>
          </div>
        )}
      </div>

      {/* Transport */}
      <div data-part={P.ytTransport}>
        <Btn onClick={onToggle}>{playing ? '\u23F8' : '\u25B6'}</Btn>
        <Btn>{'\u23EE'}</Btn>
        <Btn>{'\u23ED'}</Btn>
        <span data-part={P.ytTimeLabel}>{fmtTime(elapsed)}</span>
        <div data-part={P.ytProgressBar} onClick={handleSeek}>
          <div
            data-part={P.ytBufferBar}
            style={{ width: `${Math.min(100, progress + 15)}%` }}
          />
          <div
            data-part={P.ytProgressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span data-part={P.ytTimeLabel}>{video.time}</span>
        <Btn>{'\uD83D\uDD08'}</Btn>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  VideoCard                                                          */
/* ------------------------------------------------------------------ */

const VideoCard: FC<{
  video: YtVideo;
  onClick: () => void;
  compact?: boolean;
}> = ({ video, onClick, compact }) => {
  if (compact) {
    return (
      <div data-part={P.ytCompactCard} onClick={onClick}>
        <div data-part={P.ytCompactThumb}>
          {video.thumb}
          <span data-part={P.ytDurationBadge}>{video.time}</span>
        </div>
        <div data-part={P.ytCompactInfo}>
          <div data-part={P.ytCompactTitle}>{video.title}</div>
          <div data-part={P.ytCompactChannel}>{video.channel}</div>
          <div data-part={P.ytCompactMeta}>
            {video.views} views {'\u2022'} {video.uploaded}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-part={P.ytVideoCard} onClick={onClick}>
      <div data-part={P.ytCardThumb}>
        {video.thumb}
        <span data-part={P.ytDurationBadge}>{video.time}</span>
      </div>
      <div data-part={P.ytCardBottom}>
        <div data-part={P.ytChannelAvatar}>{video.channelIcon}</div>
        <div data-part={P.ytCardText}>
          <div data-part={P.ytCardTitle}>{video.title}</div>
          <div data-part={P.ytCardChannel}>{video.channel}</div>
          <div data-part={P.ytCardMeta}>
            {video.views} views {'\u2022'} {video.uploaded}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  CommentItem                                                        */
/* ------------------------------------------------------------------ */

const CommentItem: FC<{ comment: YtCommentT }> = ({ comment }) => (
  <div data-part={P.ytCommentRow}>
    <div data-part={P.ytCommentAvatar}>{comment.icon}</div>
    <div data-part={P.ytCommentBody}>
      <div data-part={P.ytCommentHeader}>
        <span data-part={P.ytCommentUser}>{comment.user}</span>
        <span data-part={P.ytCommentTime}>{comment.time}</span>
      </div>
      <div data-part={P.ytCommentText}>{comment.text}</div>
      <div data-part={P.ytCommentActions}>
        <span>{'\uD83D\uDC4D'} {comment.likes}</span>
        <span>{'\uD83D\uDC4E'}</span>
        <span>Reply</span>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface YouTubeRetroProps {
  /** Videos to display. Defaults to sample data. */
  videos?: YtVideo[];
  /** Height constraint. */
  height?: number | string;
}

export const YouTubeRetro: FC<YouTubeRetroProps> = ({
  videos = VIDEOS,
  height,
}) => {
  const [view, setView] = useState<YtView>('home');
  const [currentVideo, setCurrentVideo] = useState<YtVideo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState('');
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});
  const [likedVids, setLikedVids] = useState<Record<number, boolean>>({});
  const [commentText, setCommentText] = useState('');
  const [userComments, setUserComments] = useState<YtCommentT[]>([]);

  const totalSec = currentVideo ? parseDuration(currentVideo.time) : 0;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [playing, currentVideo]);

  useEffect(() => {
    if (playing && elapsed >= totalSec && totalSec > 0) setPlaying(false);
  }, [elapsed, playing, totalSec]);

  const openVideo = (v: YtVideo) => {
    setCurrentVideo(v);
    setView('watch');
    setPlaying(true);
    setElapsed(0);
    setUserComments([]);
    setCommentText('');
  };
  const goHome = () => {
    setView('home');
    setPlaying(false);
  };

  const filteredVideos = videos.filter(v => {
    if (category !== 'all' && v.category !== category) return false;
    if (
      searchActive &&
      !v.title.toLowerCase().includes(searchActive.toLowerCase()) &&
      !v.channel.toLowerCase().includes(searchActive.toLowerCase())
    )
      return false;
    return true;
  });

  const relatedVideos = useMemo(() => {
    if (!currentVideo) return [];
    const others = videos.filter(v => v.id !== currentVideo.id);
    // Deterministic shuffle seeded by video ID for stable memoization
    const seed = currentVideo.id;
    return others
      .map((v, i) => ({ v, sort: Math.sin(seed + i) }))
      .sort((a, b) => a.sort - b.sort)
      .map(x => x.v)
      .slice(0, 6);
  }, [currentVideo, videos]);

  const allComments = [...userComments, ...COMMENTS];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    setUserComments(p => [
      {
        user: 'VHSCollector87',
        icon: '\uD83E\uDDD1',
        text: commentText,
        time: 'Just now',
        likes: 0,
      },
      ...p,
    ]);
    setCommentText('');
  };

  return (
    <div data-part={P.youtubeRetro} style={height ? { height } : undefined}>
      {/* Nav bar */}
      <div data-part={P.ytNavBar}>
        <Btn onClick={goHome}>{'\uD83C\uDFE0'}</Btn>
        {view === 'watch' && <Btn onClick={goHome}>{'\u2190'} Back</Btn>}
        <div data-part={P.ytSearchGroup}>
          <input
            data-part={P.ytSearchInput}
            placeholder="Search YouTube\u2026"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSearchActive(searchTerm);
                setView('home');
              }
            }}
          />
          <Btn
            onClick={() => {
              setSearchActive(searchTerm);
              setView('home');
            }}
          >
            {'\uD83D\uDD0D'}
          </Btn>
        </div>
        <Btn>{'\uD83D\uDD14'}</Btn>
        <Btn>{'\uD83D\uDCE4'} Upload</Btn>
      </div>

      {/* ═══ HOME VIEW ═══ */}
      {view === 'home' && (
        <div data-part={P.ytHomeLayout}>
          {/* Subscriptions sidebar */}
          <div data-part={P.ytSubSidebar}>
            <div data-part={P.ytSubTitle}>Subscriptions</div>
            <div data-part={P.ytSubList}>
              {CHANNELS.map(c => (
                <div
                  key={c.id}
                  data-part={P.ytSubRow}
                  onClick={() => {
                    setCategory(c.id);
                    setSearchActive('');
                  }}
                >
                  <span data-part={P.ytSubIcon}>{c.icon}</span>
                  <div data-part={P.ytSubInfo}>
                    <div data-part={P.ytSubName}>{c.name}</div>
                    <div data-part={P.ytSubCount}>{c.subs} subs</div>
                  </div>
                </div>
              ))}
            </div>
            <div data-part={P.ytSubFooter}>
              {'\uD83D\uDCC1'} Library<br />
              {'\u23F1\uFE0F'} History<br />
              {'\uD83D\uDC4D'} Liked Videos
            </div>
          </div>

          {/* Main grid */}
          <div data-part={P.ytHomeMain}>
            {/* Category filter */}
            <div data-part={P.ytCategoryBar}>
              {CATEGORIES.map(c => (
                <Btn
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setSearchActive('');
                  }}
                  data-active={category === c.id || undefined}
                >
                  {c.icon} {c.label}
                </Btn>
              ))}
            </div>

            <div data-part={P.ytVideoGrid}>
              {filteredVideos.length > 0 ? (
                filteredVideos.map(v => (
                  <VideoCard key={v.id} video={v} onClick={() => openVideo(v)} />
                ))
              ) : (
                <div data-part={P.ytEmptyState}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{'\uD83D\uDCED'}</div>
                  No videos found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WATCH VIEW ═══ */}
      {view === 'watch' && currentVideo && (
        <div data-part={P.ytWatchLayout}>
          {/* Player + info */}
          <div data-part={P.ytWatchMain}>
            <VideoPlayer
              video={currentVideo}
              playing={playing}
              onToggle={() => {
                if (!playing && elapsed >= totalSec) setElapsed(0);
                setPlaying(!playing);
              }}
              elapsed={elapsed}
              totalSec={totalSec}
              onSeek={s => setElapsed(s)}
            />

            {/* Video info */}
            <div data-part={P.ytVideoInfo}>
              <div data-part={P.ytVideoTitle}>{currentVideo.title}</div>
              <div data-part={P.ytVideoMeta}>
                <span>{currentVideo.views} views</span>
                <span>{'\u2022'}</span>
                <span>{currentVideo.uploaded}</span>
              </div>

              {/* Action buttons */}
              <div data-part={P.ytVideoActions}>
                <Btn
                  onClick={() =>
                    setLikedVids(p => ({
                      ...p,
                      [currentVideo.id]: !p[currentVideo.id],
                    }))
                  }
                >
                  {'\uD83D\uDC4D'}{' '}
                  {likedVids[currentVideo.id] ? 'Liked' : currentVideo.likes}
                </Btn>
                <Btn>{'\uD83D\uDC4E'} {currentVideo.dislikes}</Btn>
                <Btn>{'\u2197\uFE0F'} Share</Btn>
                <Btn>{'\uD83D\uDCE5'} Save</Btn>
                <Btn>{'\uD83D\uDEA9'} Report</Btn>
              </div>

              {/* Channel */}
              <div data-part={P.ytChannelSection}>
                <div data-part={P.ytChannelAvatarLg}>
                  {currentVideo.channelIcon}
                </div>
                <div data-part={P.ytChannelInfo}>
                  <div data-part={P.ytChannelName}>{currentVideo.channel}</div>
                  <div data-part={P.ytChannelSubs}>
                    {CHANNELS.find(c => c.id === currentVideo.category)?.subs ??
                      '100K'}{' '}
                    subscribers
                  </div>
                </div>
                <Btn
                  onClick={() =>
                    setSubscribed(p => ({
                      ...p,
                      [currentVideo.channel]: !p[currentVideo.channel],
                    }))
                  }
                >
                  {subscribed[currentVideo.channel]
                    ? '\u2713 Subscribed'
                    : 'Subscribe'}
                </Btn>
              </div>

              {/* Description */}
              <div data-part={P.ytDescription}>{currentVideo.desc}</div>
            </div>

            {/* Comments */}
            <div data-part={P.ytComments}>
              <div data-part={P.ytCommentsTitle}>
                {'\uD83D\uDCAC'} Comments {'\u2014'} {allComments.length}
              </div>

              <div data-part={P.ytAddComment}>
                <div data-part={P.ytCommentAvatar}>{'\uD83E\uDDD1'}</div>
                <div data-part={P.ytCommentInput}>
                  <input
                    data-part={P.ytCommentInputField}
                    placeholder="Add a comment\u2026"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                  />
                  {commentText && (
                    <div data-part={P.ytCommentBtns}>
                      <Btn onClick={() => setCommentText('')}>Cancel</Btn>
                      <Btn onClick={handleSubmitComment}>Comment</Btn>
                    </div>
                  )}
                </div>
              </div>

              <div data-part={P.ytCommentList}>
                {allComments.map((c, i) => (
                  <CommentItem key={i} comment={c} />
                ))}
              </div>
            </div>
          </div>

          {/* Related sidebar */}
          <div data-part={P.ytRelated}>
            <div data-part={P.ytRelatedTitle}>Up Next</div>
            <div data-part={P.ytRelatedList}>
              <div data-part={P.ytAutoplayLabel}>AUTOPLAY</div>
              {relatedVideos.map(v => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onClick={() => openVideo(v)}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div data-part={P.ytStatusBar}>
        <span>{playing ? '\u25B6 Playing' : '\u23F8 Idle'}</span>
        <span>{'\uD83D\uDCFA'} {videos.length} videos</span>
        <div style={{ flex: 1 }} />
        <span>
          {'\uD83D\uDD14'}{' '}
          {Object.values(subscribed).filter(Boolean).length} subscriptions
        </span>
        <span>
          {'\uD83D\uDC4D'}{' '}
          {Object.values(likedVids).filter(Boolean).length} liked
        </span>
      </div>
    </div>
  );
};
