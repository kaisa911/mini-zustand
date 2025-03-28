import React from 'react';
import { shallow } from './vanilla.js';

export function useShallow(selector) {
  const prev = React.useRef(undefined);

  return (state) => {
    const next = selector(state);

    // 使用浅比较判断是否需要更新引用
    return shallow(prev.current, next)
      ? prev.current // 返回缓存值避免重新渲染
      : (prev.current = next); // 更新缓存引用
  };
}
