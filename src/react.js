import React from 'react';
import { createStore } from './vanilla.js';

// 通用选择器函数（恒等函数），用于默认情况直接返回完整状态
const identity = (arg) => arg;

// React 状态绑定 Hook：连接React组件与外部状态存储
export function useStore(api, selector = identity) {
  // 使用React官方推荐的同步外部存储API
  const slice = React.useSyncExternalStore(
    /* 订阅函数 */
    api.subscribe, // 当存储变化时触发组件更新
    /* 客户端获取状态 */
    () => selector(api.getState()), // 获取最新状态并通过选择器处理
    /* 服务端获取初始状态 */
    () => selector(api.getInitialState()) // SSR兼容，获取初始化状态
  );

  // 在React DevTools中显示当前状态值（调试用）
  React.useDebugValue(slice);
  return slice;
}

// store创建实现：将vanilla store转换为React hook集成版
const createImpl = (createState) => {
  const api = createStore(createState);
  // 创建绑定store的hook
  const useBoundStore = (selector) => useStore(api, selector);
  // 将store API方法混入hook函数
  Object.assign(useBoundStore, api);

  return useBoundStore;
};

// 导出创建函数（支持两种调用方式）
export const create = (createState) => {
  return createState ? createImpl(createState) : (createState) => createImpl(createState);
};
