import type { FC } from 'react';
import { RICH_PARTS as P } from '../parts';
import type { YtVideo } from './types';

export const VideoCard: FC<{
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
            {video.views} views • {video.uploaded}
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
            {video.views} views • {video.uploaded}
          </div>
        </div>
      </div>
    </div>
  );
};
