import type { Meta, StoryObj } from '@storybook/react';
import { GameFinder } from './GameFinder';
import { SAMPLE_GAMES } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof GameFinder> = {
  title: 'RichWidgets/GameFinder',
  component: GameFinder,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GameFinder>;

const installedGames = SAMPLE_GAMES.filter((game) => game.installed);
const backlogGames = SAMPLE_GAMES.filter((game) => !game.installed);
const denseLibrary = [
  ...SAMPLE_GAMES,
  ...SAMPLE_GAMES.slice(0, 4).map((game, index) => ({
    ...game,
    id: `dense-${game.id}-${index}`,
    title: `${game.title} Redux`,
    hours: game.hours + (index + 1) * 12,
  })),
];

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(700, 500)],
};

export const FewGames: Story = {
  args: {
    initialGames: SAMPLE_GAMES.slice(0, 3),
  },
  decorators: [fullscreenDecorator],
};

export const InstalledLibrary: Story = {
  args: {
    initialGames: installedGames,
  },
  decorators: [fullscreenDecorator],
};

export const BacklogOnly: Story = {
  args: {
    initialGames: backlogGames,
  },
  decorators: [fullscreenDecorator],
};

export const DenseLibrary: Story = {
  args: {
    initialGames: denseLibrary,
  },
  decorators: [fullscreenDecorator],
};

export const EmptyLibrary: Story = {
  args: {
    initialGames: [],
  },
  decorators: [fullscreenDecorator],
};
