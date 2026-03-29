import type { ChatConnectionStatus } from '../state/chatSessionSlice';
import { clearConversationEventHistory, emitConversationEvent } from '../debug/eventBus';
import { fetchTimelineSnapshot, submitPrompt } from './http';
import type { ChatProfileSelection } from './profileTypes';
import { ensureChatModulesRegistered } from './registerChatModules';
import { WsManager } from '../ws/wsManager';

export interface ConversationConnectArgs {
  convId: string;
  dispatch: (action: unknown) => unknown;
  profileSelection?: ChatProfileSelection;
  basePrefix?: string;
  onStatus?: (status: ChatConnectionStatus) => void;
  hydrate?: boolean;
}

interface ConversationSession {
  refs: number;
  ws: WsManager;
  args: ConversationConnectArgs;
}

const DISCONNECT_GRACE_MS = 750;

export class ConversationManager {
  private readonly sessions = new Map<string, ConversationSession>();
  private readonly pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>();

  private clearPendingDisconnect(convId: string) {
    const timer = this.pendingDisconnects.get(convId);
    if (!timer) return;
    clearTimeout(timer);
    this.pendingDisconnects.delete(convId);
  }

  async connect(args: ConversationConnectArgs): Promise<void> {
    ensureChatModulesRegistered();
    this.clearPendingDisconnect(args.convId);

    const existing = this.sessions.get(args.convId);
    if (existing) {
      existing.refs += 1;
      existing.args = args;
      await existing.ws.connect({
        convId: args.convId,
        dispatch: args.dispatch,
        profileSelection: args.profileSelection,
        basePrefix: args.basePrefix,
        onStatus: args.onStatus,
        hydrate: args.hydrate,
        onEnvelope: (envelope) => emitConversationEvent(args.convId, envelope),
      });
      return;
    }

    const ws = new WsManager();
    this.sessions.set(args.convId, {
      refs: 1,
      ws,
      args,
    });

    await ws.connect({
      convId: args.convId,
      dispatch: args.dispatch,
      profileSelection: args.profileSelection,
      basePrefix: args.basePrefix,
      onStatus: args.onStatus,
      hydrate: args.hydrate,
      onEnvelope: (envelope) => emitConversationEvent(args.convId, envelope),
    });
  }

  disconnect(convId: string): void {
    const session = this.sessions.get(convId);
    if (!session) return;
    if (session.refs === 0) return;

    session.refs -= 1;
    if (session.refs > 0) return;
    session.refs = 0;
    this.clearPendingDisconnect(convId);
    const timer = setTimeout(() => {
      const current = this.sessions.get(convId);
      this.pendingDisconnects.delete(convId);
      if (!current || current.refs > 0) return;
      current.ws.disconnect();
      this.sessions.delete(convId);
      clearConversationEventHistory(convId);
    }, DISCONNECT_GRACE_MS);
    this.pendingDisconnects.set(convId, timer);
  }

  async send(
    prompt: string,
    convId: string,
    basePrefix = '',
    profileSelection?: ChatProfileSelection
  ): Promise<void> {
    await submitPrompt(prompt, convId, basePrefix, { profileSelection });
  }

  async fetchSnapshot(convId: string, basePrefix = ''): Promise<unknown> {
    return fetchTimelineSnapshot(convId, basePrefix);
  }

  getActiveConversationIds(): string[] {
    return Array.from(this.sessions.entries())
      .filter(([, session]) => session.refs > 0)
      .map(([convId]) => convId);
  }
}

export const conversationManager = new ConversationManager();
