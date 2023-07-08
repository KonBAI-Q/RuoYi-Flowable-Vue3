export type UnknownFunction = (...args: unknown[]) => unknown;

export enum LIFECYCLE_HOOKS {
  BEFORE_QUERY = 'beforeQuery',
  BEFORE_REFRESH = 'beforeRefresh',
  AFTER_REFRESH = 'afterRefresh',
  BEFORE_SUBMIT_CU = 'beforeSubmitCU',
  AFTER_SUBMIT_CU = 'afterSubmitCU',
  AFTER_DEL = 'afterDel'
}

export type CURDHooks = {
  [key in LIFECYCLE_HOOKS]?: UnknownFunction[];
};

function injectHook(type: LIFECYCLE_HOOKS, hook: UnknownFunction, target: CURDHooks, prepend = false) {
  if (!target) {
    return;
  }
  const hooks = target[type] || (target[type] = []);
  if (prepend) {
    hooks.unshift(hook);
  } else {
    hooks.push(hook);
  }
  return hook;
}

export const createHook =
  <T extends UnknownFunction>(lifecycle: LIFECYCLE_HOOKS, target: CURDHooks) =>
  (hook: T) =>
    injectHook(lifecycle, (...args: unknown[]) => hook(...args), target);

export type CallHooks = (lifecycle: LIFECYCLE_HOOKS, arg?: unknown) => unknown[];

export const registerHook =
  (target: CURDHooks): CallHooks =>
  (lifecycle: LIFECYCLE_HOOKS, arg?: unknown) => {
    const hooks = target[lifecycle];
    if (Array.isArray(hooks)) {
      return hooks.map((hook) => hook(arg));
    } else {
      return [];
    }
  };
