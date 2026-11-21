export const APP_SETTINGS_REPOSITORY = Symbol('APP_SETTINGS_REPOSITORY')

export interface AppSettingsRepositoryPort {
  find(key: string): Promise<unknown>
  upsert(key: string, value: unknown): Promise<void>
}
