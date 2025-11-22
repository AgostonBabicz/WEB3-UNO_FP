export type Updater<T> = { [K in keyof T]?: T[K] | ((prev: T[K]) => T[K]) }

export function withState<T extends object>(obj: T, patch: Updater<T>): T {
  const next: any = { ...obj }
  for (const k in patch) {
    const v: any = (patch as any)[k]
    next[k] = typeof v === 'function' ? v((obj as any)[k]) : v
  }
  return next
}