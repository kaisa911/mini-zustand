# mini-zustand

React 状态管理库，Zustand 的 js 版，学习的时候顺手整理了一下。

## 特性

- 🚀 超轻量无依赖（核心实现仅 2KB）
- ⚛️ 同时支持 React 和 Vanilla JS 环境
- 🎯 精确的状态更新（自动浅层比较）
- 🔌 可扩展的中间件系统
- 📦 内置持久化存储支持
- 🔄 支持 Immer 不可变更新

```

## 快速开始

```jsx
// 创建 store
import { create } from 'mini-zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// React 组件中使用
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>Clicked {count} times</button>;
}
```

## 核心 API

```javascript
const store = createStore((set, get) => ({
  // 状态 & 操作方法
}));

// Vanilla JS 使用
store.subscribe((state) => console.log('State changed:', state));
store.setState({ count: 10 });
```

## 中间件系统

```javascript
// 持久化存储
create(
  persist(
    (set) => ({
      /* state */
    }),
    { name: 'my-store' }
  )
);

// Immer 不可变更新
create(
  immer((set) => ({
    nested: { value: 1 },
    update: () =>
      set((state) => {
        state.nested.value++;
      }),
  }))
);
```

## 与 Zustand 的差异

- 移除非核心功能（如 transient update listeners）
- 简化中间件实现逻辑
- 更小的体积（gzip 后仅 2KB）
- 保持 API 完全兼容

## 贡献

欢迎提交 PR 和 issue
