export const APP_SETTINGS_READER = Symbol('APP_SETTINGS_READER')

export interface AppSettingsReaderPort {
  get<T>(key: string): Promise<T | undefined>
}
