import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { createTodoStore } from '../store';
import { STACK } from '../../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  bundle: STACK,
  createStore: createTodoStore,
  surfaceParams: { taskDetail: 't1' },
});

const meta = {
  title: 'Apps/Todo/FullApp',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const AllTasks: Story = createStory('browse');
export const InProgress: Story = createStory('inProgress');
export const Completed: Story = createStory('completed');
export const TaskDetail: Story = createStory('taskDetail');
export const NewTask: Story = createStory('newTask');
