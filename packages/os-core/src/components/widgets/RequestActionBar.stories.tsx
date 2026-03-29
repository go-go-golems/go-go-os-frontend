import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RequestActionBar } from './RequestActionBar';

function InteractiveActionDemo() {
  const [comment, setComment] = useState('');
  const [lastAction, setLastAction] = useState('none');
  const [busy, setBusy] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 8, width: 420 }}>
      <RequestActionBar
        commentEnabled
        commentValue={comment}
        onCommentChange={setComment}
        busy={busy}
        primaryLabel="Approve"
        secondaryLabel="Reject"
        onPrimary={(nextComment) => {
          setBusy(true);
          setTimeout(() => {
            setLastAction(`approve:${nextComment ?? ''}`);
            setBusy(false);
          }, 500);
        }}
        onSecondary={(nextComment) => setLastAction(`reject:${nextComment ?? ''}`)}
      />
      <div data-part="field-value">Last action: {lastAction}</div>
    </div>
  );
}

const meta = {
  title: 'Engine/Widgets/RequestActionBar',
  component: RequestActionBar,
  tags: ['autodocs'],
  args: {
    onPrimary: () => {},
  },
} satisfies Meta<typeof RequestActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryOnly: Story = {
  args: {
    primaryLabel: 'Submit',
  },
};

export const PrimarySecondary: Story = {
  args: {
    primaryLabel: 'Approve',
    secondaryLabel: 'Reject',
    onSecondary: () => {},
  },
};

export const WithCommentField: Story = {
  args: {
    commentEnabled: true,
    commentPlaceholder: 'Leave a reason...',
    primaryLabel: 'Approve',
    secondaryLabel: 'Reject',
    onSecondary: () => {},
  },
};

export const BusyState: Story = {
  args: {
    busy: true,
    commentEnabled: true,
    onSecondary: () => {},
    secondaryLabel: 'Cancel',
  },
};

export const DisabledActions: Story = {
  args: {
    primaryDisabled: true,
    secondaryDisabled: true,
    onSecondary: () => {},
    secondaryLabel: 'Back',
    commentEnabled: true,
  },
};

export const ControlledComment: Story = {
  render: () => {
    const [comment, setComment] = useState('Need manager approval');
    return (
      <div style={{ display: 'grid', gap: 8, width: 420 }}>
        <RequestActionBar
          commentEnabled
          commentValue={comment}
          onCommentChange={setComment}
          onPrimary={() => {}}
          onSecondary={() => {}}
          primaryLabel="Continue"
          secondaryLabel="Back"
        />
        <div data-part="field-value">Comment: {comment}</div>
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => <InteractiveActionDemo />,
};
