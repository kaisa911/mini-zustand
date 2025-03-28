// 判断对象是否可迭代（Array/Map/Set等）
const isIterable = (obj) => obj != null && Symbol.iterator in obj;

// 判断可迭代对象是否包含entries方法
const hasIterableEntries = (value) => 'entries' in value;

// 比较entries实现（支持Map/Set/普通对象）
const compareEntries = (valueA, valueB) => {
  const mapA = valueA instanceof Map ? valueA : new Map(Object.entries(valueA));
  const mapB = valueB instanceof Map ? valueB : new Map(Object.entries(valueB));

  if (mapA.size !== mapB.size) return false;

  for (const [key, value] of mapA) {
    if (!Object.is(value, mapB.get(key))) return false;
  }
  return true;
};

// 比较顺序敏感的可迭代对象（如Array）
const compareIterables = (valueA, valueB) => {
  const iteratorA = valueA[Symbol.iterator]();
  const iteratorB = valueB[Symbol.iterator]();

  let nextA = iteratorA.next();
  let nextB = iteratorB.next();

  while (!nextA.done && !nextB.done) {
    if (!Object.is(nextA.value, nextB.value)) return false;
    nextA = iteratorA.next();
    nextB = iteratorB.next();
  }

  return !!nextA.done && !!nextB.done;
};

// 浅比较主函数
export function shallow(valueA, valueB) {
  if (Object.is(valueA, valueB)) return true;

  if (
    typeof valueA !== 'object' ||
    valueA === null ||
    typeof valueB !== 'object' ||
    valueB === null
  )
    return false;

  // 处理普通对象
  if (!isIterable(valueA) || !isIterable(valueB)) {
    return compareEntries(valueA, valueB);
  }

  // 处理Map/Set等自带entries的结构
  if (hasIterableEntries(valueA) && hasIterableEntries(valueB)) {
    return compareEntries(
      valueA.entries ? valueA : new Map(valueA),
      valueB.entries ? valueB : new Map(valueB)
    );
  }

  // 处理数组等顺序敏感结构
  return compareIterables(valueA, valueB);
}
