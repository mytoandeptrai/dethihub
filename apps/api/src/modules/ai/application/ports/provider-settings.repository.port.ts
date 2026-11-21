export interface ProviderSettingRow {
  provider: string
  model: string | null
  baseUrl: string | null
  apiKeyEnc: string | null
}

export interface ProviderSettingsRepositoryPort {
  findAll(): Promise<ProviderSettingRow[]>
  find(provider: string): Promise<ProviderSettingRow | null>
  upsert(row: ProviderSettingRow): Promise<void>
  delete(provider: string): Promise<void>
}

export const PROVIDER_SETTINGS_REPOSITORY = Symbol('PROVIDER_SETTINGS_REPOSITORY')
