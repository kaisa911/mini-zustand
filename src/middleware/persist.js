// 创建支持JSON序列化的存储对象
export function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage(); // 尝试获取存储对象（如localStorage）
  } catch {
    return; // 获取失败则返回undefined
  }

  // 返回持久化存储对象
  const persistStorage = {
    getItem: (name) => {
      // 带反序列化的获取方法
      const parse = (str) => {
        if (str === null) return null;
        return JSON.parse(str, options?.reviver); // 使用自定义reviver
      };
      const str = storage.getItem(name) ?? null;
      // 处理异步存储（如AsyncStorage）
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    // 带序列化的存储方法
    setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, options?.replacer)), // 使用自定义replacer
    removeItem: (name) => storage.removeItem(name),
  };
  return persistStorage;
}

// 将函数转换为Thenable对象（支持同步/异步统一处理）
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) return result; // 已经是Promise直接返回

    // 同步成功返回Thenable对象
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch() {
        return this;
      }, // 同步成功不需要catch
    };
  } catch (e) {
    // 同步错误处理
    return {
      then() {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      },
    };
  }
};

// 持久化中间件主函数
export const persist = (config, baseOptions) => (set, get, api) => {
  // 合并配置选项
  let options = {
    storage: createJSONStorage(() => localStorage), // 默认使用localStorage
    partialize: (state) => state, // 状态选择器
    version: 0, // 数据版本
    merge: (persistedState, currentState) => ({
      // 合并策略
      ...currentState,
      ...persistedState,
    }),
    ...baseOptions,
  };

  // 水合状态相关
  let hasHydrated = false; // 是否完成水合
  const hydrationListeners = new Set(); // 水合开始监听器
  const finishHydrationListeners = new Set(); // 水合完成监听器
  let storage = options.storage; // 存储实例

  // 无有效存储时的处理
  if (!storage) {
    return config(
      (...args) => {
        console.warn(`[zustand persist middleware] Unable to update item '${options.name}'`);
        set(...args);
      },
      get,
      api
    );
  }

  // 保存状态到存储
  const setItem = () => {
    const state = options.partialize({ ...get() }); // 获取需要持久化的部分状态
    return storage.setItem(options.name, {
      // 存储带版本号的状态
      state,
      version: options.version,
    });
  };

  // 重写api.setState以自动持久化
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem(); // 异步保存
  };

  // 初始化状态
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem(); // 状态更新后自动保存
    },
    get,
    api
  );

  api.getInitialState = () => configResult;

  let stateFromStorage; // 从存储加载的状态

  // 水合流程核心方法
  const hydrate = () => {
    if (!storage) return;
    hasHydrated = false;
    // 触发水合开始监听器
    hydrationListeners.forEach((cb) => cb(get() ?? configResult));

    // 执行自定义水合回调
    const postRehydrationCallback =
      options.onRehydrateStorage?.(get() ?? configResult) || undefined;

    // 从存储加载数据
    return toThenable(storage.getItem.bind(storage))(options.name)
      .then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          // 版本检查与迁移
          if (
            typeof deserializedStorageValue.version === 'number' &&
            deserializedStorageValue.version !== options.version
          ) {
            if (options.migrate) {
              const migration = options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              );
              // 支持异步迁移
              if (migration instanceof Promise) {
                return migration.then((result) => [true, result]);
              }
              return [true, migration];
            }
            console.error(`State migration failed - no migrate function`);
          } else {
            return [false, deserializedStorageValue.state];
          }
        }
        return [false, undefined];
      })
      .then(([migrated, migratedState]) => {
        // 合并存储状态与当前状态
        stateFromStorage = options.merge(migratedState, get() ?? configResult);
        set(stateFromStorage, true); // 替换当前状态
        if (migrated) return setItem(); // 如果迁移过则重新保存
      })
      .then(() => {
        // 水合完成处理
        postRehydrationCallback?.(stateFromStorage, undefined);
        stateFromStorage = get();
        hasHydrated = true;
        // 触发水合完成监听器
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
      })
      .catch((e) => {
        postRehydrationCallback?.(undefined, e); // 错误处理
      });
  };

  // 暴露持久化相关API
  api.persist = {
    setOptions: (newOptions) => {
      options = { ...options, ...newOptions };
      if (newOptions.storage) storage = newOptions.storage;
    },
    clearStorage: () => storage?.removeItem(options.name), // 清除存储
    getOptions: () => options, // 获取当前配置
    rehydrate: () => hydrate(), // 手动触发水合
    hasHydrated: () => hasHydrated, // 检查水合状态
    onHydrate: (cb) => {
      // 注册水合开始监听
      hydrationListeners.add(cb);
      return () => hydrationListeners.delete(cb);
    },
    onFinishHydration: (cb) => {
      // 注册水合完成监听
      finishHydrationListeners.add(cb);
      return () => finishHydrationListeners.delete(cb);
    },
  };

  // 自动执行水合（除非配置跳过）
  if (!options.skipHydration) hydrate();

  return stateFromStorage || configResult;
};
