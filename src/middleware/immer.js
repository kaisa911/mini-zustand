import { produce } from 'immer';

export const immer = (initializer) => (set, get, store) => {
  store.setState = (updater, replace, ...args) => {
    // 处理函数式更新（使用 Immer）
    if (typeof updater === 'function') {
      const nextState = produce(updater);
      return set(nextState, replace, ...args);
    }

    // 处理直接值更新
    return set(updater, replace, ...args);
  };

  // 初始化 store 状态
  return initializer(store.setState, get, store);
};
