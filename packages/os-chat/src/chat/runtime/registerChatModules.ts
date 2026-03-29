import { registerDefaultSemHandlers } from '../sem/semRegistry';
import { registerDefaultTimelineRenderers } from '../renderers/rendererRegistry';
import {
  createChatModuleBootstrap,
  type ChatRuntimeModule,
} from './moduleBootstrap';

const bootstrap = createChatModuleBootstrap([
  {
    id: 'chat.default-sem',
    register: registerDefaultSemHandlers,
  },
  {
    id: 'chat.default-renderers',
    register: registerDefaultTimelineRenderers,
  },
]);

export function ensureChatModulesRegistered() {
  bootstrap.ensureRegistered();
}

export function registerChatRuntimeModule(module: ChatRuntimeModule) {
  bootstrap.registerModule(module);
}

export function listChatRuntimeModules(): string[] {
  return bootstrap.listModules();
}

export function resetChatModulesRegistrationForTest() {
  bootstrap.resetForTest();
}
