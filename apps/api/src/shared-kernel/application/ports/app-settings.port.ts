export const APP_SETTINGS = Symbol('APP_SETTINGS')

export interface AppSettingsPort {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
}
