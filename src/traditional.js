import React from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { createStore } from './vanilla.js';

// 恒等函数（默认选择器）
const identity = (arg) => arg;

/**
 * 带相等性检查的 React Hook 核心实现
 * @param api Zustand 存储实例
 * @param selector 状态选择函数（默认返回完整状态）
 * @param equalityFn 自定义相等性检查函数
 */
export function useStoreWithEqualityFn(api, selector = identity, equalityFn) {
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe, // 订阅函数
    api.getState, // 获取当前状态
    api.getInitialState, // 获取初始状态（SSR 用）
    selector, // 状态选择器
    equalityFn // 自定义相等性检查
  );

  // React 开发工具显示
  React.useDebugValue(slice);
  return slice;
}

/**
 * 创建带相等性检查的 Store 工厂函数
 * 1. 无参数获取完整状态
 * 2. 带 selector 和 equalityFn 获取派生状态
 */
const createWithEqualityFnImpl = (createState, defaultEqualityFn) => {
  // 创建基础 store
  const api = createStore(createState);

  // 创建带相等性检查的 React Hook
  const useBoundStoreWithEqualityFn = (selector, equalityFn = defaultEqualityFn) =>
    useStoreWithEqualityFn(api, selector, equalityFn);

  // 合并 Store 的原始方法到 Hook 上
  Object.assign(useBoundStoreWithEqualityFn, api);
  return useBoundStoreWithEqualityFn;
};

// 支持两种调用方式
export const createWithEqualityFn = (createState, defaultEqualityFn) => {
  return createState
    ? createWithEqualityFnImpl(createState, defaultEqualityFn)
    : (createState, defaultEqualityFn) => createWithEqualityFnImpl(createState, defaultEqualityFn);
};
