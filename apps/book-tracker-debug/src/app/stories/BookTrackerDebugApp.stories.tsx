import { createStoryHelpers } from '@go-go-golems/os-core';
import type { Meta, StoryObj } from '@storybook/react';
import { createBookStore } from '../store';
import { STACK } from '../../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  bundle: STACK,
  createStore: createBookStore,
  surfaceParams: { bookDetail: 'b1' },
});

const meta = {
  title: 'Apps/BookTrackerDebug/FullApp',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const Browse: Story = createStory('browse');
export const ReadingNow: Story = createStory('readingNow');
export const BookDetail: Story = createStory('bookDetail');
export const AddBook: Story = createStory('addBook');
export const ReadingReport: Story = createStory('readingReport');
