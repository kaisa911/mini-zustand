// 自定义中间件：增强订阅功能，支持选择器函数和选项参数
export const subscribeWithSelector = (fn) => (set, get, api) => {
  // 保存原始的订阅方法
  const origSubscribe = api.subscribe;

  //重写store的subscribe方法，添加选择器支持
  api.subscribe = (selector, optListener, options) => {
    let listener = selector;

    // 当存在第二个参数时，说明使用了选择器模式
    if (optListener) {
      // 使用自定义比较函数或默认的Object.is
      const equalityFn = options?.equalityFn || Object.is;

      // 缓存当前状态片段
      let currentSlice = selector(api.getState());

      // 创建增强后的监听函数
      listener = (state) => {
        const nextSlice = selector(state);
        // 仅当状态片段变化时触发回调
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice;
          // 更新缓存并触发监听回调，参数格式为（新值，旧值）
          optListener((currentSlice = nextSlice), previousSlice);
        }
      };

      // 如果配置了立即触发，立即执行一次监听回调
      if (options?.fireImmediately) {
        optListener(currentSlice, currentSlice);
      }
    }

    // 调用原始订阅方法并返回取消订阅函数
    return origSubscribe(listener);
  };

  // 继续执行原始中间件链
  return fn(set, get, api);
};
