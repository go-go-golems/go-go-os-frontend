import type { CSSProperties } from 'react';
import type { Decorator } from '@storybook/react';

export function frameDecorator(style: CSSProperties): Decorator {
  return (Story) => (
    <div style={style}>
      <Story />
    </div>
  );
}

export const fullscreenDecorator = frameDecorator({
  height: '100vh',
});

export function fixedFrameDecorator(
  width: number | string,
  height: number | string,
): Decorator {
  return frameDecorator({ width, height });
}
