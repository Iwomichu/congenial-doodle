export type Zip<T extends unknown[][]> = {
  [I in keyof T]: T[I] extends (infer U)[] ? U : never;
}[];

export default class Utils {
  static notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }
  static zip<T extends unknown[][]>(...args: T): Zip<T> {
    return <Zip<T>>(<unknown>args[0].map((_, c) => args.map(row => row[c])));
  }

  static onlyUnique<T>(value: T, index: any, self: T[]) {
    return self.indexOf(value) === index;
  }

  static getWordCount(array: string[]) {
    return array.reduce((count: Map<string, number>, next: string) => {
      count.set(next, count?.has(next) ? <number>count.get(next) + 1 : 1);
      return count;
    }, new Map<string, number>());
  }
}
