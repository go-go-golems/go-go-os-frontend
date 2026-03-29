export interface ChatRuntimeModule {
  id: string;
  register: () => void;
}

interface ChatModuleBootstrap {
  ensureRegistered: () => void;
  registerModule: (module: ChatRuntimeModule) => void;
  resetForTest: () => void;
  listModules: () => string[];
}

export function createChatModuleBootstrap(initialModules: ChatRuntimeModule[] = []): ChatModuleBootstrap {
  const modules = new Map<string, ChatRuntimeModule>();
  const baseModuleIds = new Set<string>();
  const registered = new Set<string>();
  let bootstrapCompleted = false;

  const applyModule = (module: ChatRuntimeModule) => {
    if (registered.has(module.id)) {
      return;
    }
    module.register();
    registered.add(module.id);
  };

  const registerModule = (module: ChatRuntimeModule) => {
    if (!module.id) {
      return;
    }
    if (!modules.has(module.id)) {
      modules.set(module.id, module);
    }
    if (bootstrapCompleted) {
      applyModule(module);
    }
  };

  for (const module of initialModules) {
    registerModule(module);
    baseModuleIds.add(module.id);
  }

  return {
    ensureRegistered() {
      if (bootstrapCompleted) {
        return;
      }
      for (const module of modules.values()) {
        applyModule(module);
      }
      bootstrapCompleted = true;
    },
    registerModule,
    resetForTest() {
      bootstrapCompleted = false;
      registered.clear();
      for (const id of modules.keys()) {
        if (!baseModuleIds.has(id)) {
          modules.delete(id);
        }
      }
    },
    listModules() {
      return Array.from(modules.keys());
    },
  };
}
