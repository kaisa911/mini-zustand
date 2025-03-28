// 核心状态管理实现
const createStoreImpl = (createState) => {
  // 当前状态（闭包存储，不对外暴露）
  let state;
  // 监听器集合（使用 Set 保证唯一性）
  const listeners = new Set();

  // 核心方法实现

  // 状态更新方法（支持函数式和对象式更新）
  const setState = (partial, replace) => {
    // 计算新状态（处理函数式更新）
    const nextState = typeof partial === 'function' ? partial(state) : partial;

    // 浅比较优化：只有状态变化时才触发更新
    if (!Object.is(nextState, state)) {
      const previousState = state;
      // 判断更新策略：
      state =
        replace ?? (typeof nextState !== 'object' || nextState === null)
          ? nextState // 直接替换（非对象类型或显式指定 replace）
          : Object.assign({}, state, nextState); // 合并更新（对象类型）

      // 同步触发所有监听器（无批处理）
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  // 获取当前状态（直接返回闭包中的值）
  const getState = () => state;
  // 获取初始状态（用于重置或对比）
  const getInitialState = () => initialState;
  // 订阅状态变化（返回取消订阅函数）
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Store 实例初始化
  // 暴露的 API 方法集合
  const api = {
    setState,
    getState,
    subscribe,
    getInitialState,
  };

  // 初始化状态
  const initialState = createState(setState, getState, api);
  state = initialState;

  // 返回 API 对象
  return api;
};

// 支持两种调用方式的重载实现
export const createStore = (createState) => {
  return createState ? createStoreImpl(createState) : (createState) => createStoreImpl(createState);
};
