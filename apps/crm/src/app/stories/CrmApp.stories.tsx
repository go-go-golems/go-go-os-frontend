import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { createCrmStore } from '../store';
import { STACK } from '../../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  bundle: STACK,
  createStore: createCrmStore,
  surfaceParams: { contactDetail: 'c1', companyDetail: 'co1', dealDetail: 'd1' },
});

const meta = {
  title: 'Apps/Crm/FullApp',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const Contacts: Story = createStory('contacts');
export const ContactDetail: Story = createStory('contactDetail');
export const AddContact: Story = createStory('addContact');
export const Companies: Story = createStory('companies');
export const CompanyDetail: Story = createStory('companyDetail');
export const Deals: Story = createStory('deals');
export const OpenDeals: Story = createStory('openDeals');
export const DealDetail: Story = createStory('dealDetail');
export const AddDeal: Story = createStory('addDeal');
export const Pipeline: Story = createStory('pipeline');
export const ActivityLog: Story = createStory('activityLog');
export const AddActivity: Story = createStory('addActivity');
