export const DB_METRICS_SOURCE = Symbol('DB_METRICS_SOURCE')

export interface DbMetricsSnapshot {
  raw: string
  region: string
  compute: string
}

export interface DbMetricsSourcePort {
  /** Throws when the metrics endpoint cannot be read */
  fetch(): Promise<DbMetricsSnapshot>
}
