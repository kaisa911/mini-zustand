// 组合状态生成器的高阶函数

export function combine(initialState, create) {
  // 返回新的状态创建函数，合并初始状态与动态生成的状态
  return (...args) =>
    Object.assign(
      {},
      initialState, // 保留初始状态
      create(...args) // 覆盖/新增状态属性
    );
}
