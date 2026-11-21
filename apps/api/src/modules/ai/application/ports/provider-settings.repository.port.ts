export interface ProviderSettingRow {
  provider: string
  model: string | null
  baseUrl: string | null
  apiKeyEnc: string | null
}

export interface ProviderSettingsRepositoryPort {
  findAll(): Promise<ProviderSettingRow[]>
}

export const PROVIDER_SETTINGS_REPOSITORY = Symbol('PROVIDER_SETTINGS_REPOSITORY')
