
export type Updater<T> = { [K in keyof T]?: T[K] | ((prev: T[K]) => T[K]) };

export function withState<T extends object>(obj: T, patch: Updater<T>): T {
    const next: any = { ...obj };
    for (const k in patch) {
        const v: any = (patch as any)[k];
        next[k] = typeof v === "function" ? v((obj as any)[k]) : v;
    }
    return next;
}

export function updateIn<T, V>(
    obj: T,
    path: ReadonlyArray<PropertyKey>,
    fn: (v: any) => V
): T {
    if (path.length === 0) return obj;
    const [head, ...tail] = path;
    const curr: any = (obj as any)[head];

    const updated = tail.length ? updateIn(curr, tail, fn) : fn(curr);
    if ((obj as any)[head] === updated) return obj;

    // keep prototype of obj (useful if obj has one)
    const clone: any = Array.isArray(obj) ? obj.slice() : Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    clone[head] = updated;
    return clone as T;
}
