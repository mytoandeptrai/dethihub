export interface AlertMetrics {
  signups1h: number
  aiTotal15m: number
  aiErrors15m: number
  aiTotal10m: number
  aiOk10m: number
  /** USD, Asia/Ho_Chi_Minh day */
  aiCostToday: number
  maintenanceSince: Date | null
}

export interface AlertThresholds {
  signups1h: number
  aiErrorRate: number
  aiMinCalls: number
  aiCostUsd: number
  maintenanceMinutes: number
}

export interface Alert {
  kind: 'signups' | 'ai_errors' | 'ai_down' | 'ai_cost' | 'maintenance'
  text: string
}

const MIN_CALLS_FOR_DOWN = 3

export function evaluateAlerts(
  metrics: AlertMetrics,
  thresholds: AlertThresholds,
  now: Date,
): Alert[] {
  const alerts: Alert[] = []
  if (metrics.signups1h > thresholds.signups1h) {
    alerts.push({
      kind: 'signups',
      text: `Tài khoản mới tăng đột biến: ${metrics.signups1h} trong 1 giờ (ngưỡng ${thresholds.signups1h}).`,
    })
  }
  if (
    metrics.aiTotal15m >= thresholds.aiMinCalls &&
    metrics.aiErrors15m / metrics.aiTotal15m > thresholds.aiErrorRate
  ) {
    const percent = Math.round((metrics.aiErrors15m / metrics.aiTotal15m) * 100)
    alerts.push({
      kind: 'ai_errors',
      text: `Lượt AI lỗi cao: ${metrics.aiErrors15m}/${metrics.aiTotal15m} trong 15 phút (${percent}%).`,
    })
  }
  if (metrics.aiTotal10m >= MIN_CALLS_FOR_DOWN && metrics.aiOk10m === 0) {
    alerts.push({
      kind: 'ai_down',
      text: `AI chết hẳn: ${metrics.aiTotal10m} lượt gọi trong 10 phút, không lượt nào thành công.`,
    })
  }
  if (metrics.aiCostToday > thresholds.aiCostUsd) {
    alerts.push({
      kind: 'ai_cost',
      text: `Chi phí AI hôm nay ước tính $${metrics.aiCostToday.toFixed(2)} (ngưỡng $${thresholds.aiCostUsd}).`,
    })
  }
  if (
    metrics.maintenanceSince &&
    now.getTime() - metrics.maintenanceSince.getTime() > thresholds.maintenanceMinutes * 60_000
  ) {
    const since = metrics.maintenanceSince.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    })
    alerts.push({
      kind: 'maintenance',
      text: `Đang bảo trì hơn ${thresholds.maintenanceMinutes} phút (từ ${since}).`,
    })
  }
  return alerts
}
