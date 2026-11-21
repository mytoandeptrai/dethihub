export const OPS_QUERY_REPOSITORY = Symbol('OPS_QUERY_REPOSITORY')

export interface DailyStats {
  day: string
  newUsers: number
  newDocs: number
  newDecks: number
  newCommunityExams: number
}

export interface StatsOverview {
  totalUsers: number
  active7d: number
  active30d: number
  onlineCount: number
  chartDays: DailyStats[]
}

export interface OnlineRow {
  userId: string
  lastSeen: Date
}

export interface OpsQueryRepositoryPort {
  overview(days: number): Promise<StatsOverview>
  /** The newest `limit` users seen in the last 2 minutes, plus the total online */
  online(limit: number): Promise<{ total: number; rows: OnlineRow[] }>
  pingDatabase(): Promise<void>
}
