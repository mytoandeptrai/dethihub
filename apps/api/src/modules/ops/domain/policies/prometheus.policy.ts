export interface DbMetrics {
  cpu: number | null
  ram: number | null
  disk: number | null
  connections: number | null
  maxConnections: number | null
}

interface Sample {
  name: string
  labels: Record<string, string>
  value: number
}

const LINE = /^([a-zA-Z_:][\w:]*)(?:\{(.*)\})?\s+(\S+)/
const LABEL = /(\w+)="((?:[^"\\]|\\.)*)"/g

export function parsePrometheus(text: string): Sample[] {
  const samples: Sample[] = []
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const match = LINE.exec(line)
    const value = Number(match?.[3])
    if (!match?.[1] || !Number.isFinite(value)) continue
    const labels: Record<string, string> = {}
    for (const label of (match[2] ?? '').matchAll(LABEL)) {
      if (label[1]) labels[label[1]] = label[2] ?? ''
    }
    samples.push({ name: match[1], labels, value })
  }
  return samples
}

const sum = (
  samples: Sample[],
  name: string,
  pick: (labels: Record<string, string>) => boolean = () => true,
) =>
  samples
    .filter((sample) => sample.name === name && pick(sample.labels))
    .reduce((total, sample) => total + sample.value, 0)

const has = (samples: Sample[], name: string) => samples.some((sample) => sample.name === name)

const percent = (used: number, total: number) =>
  total > 0 ? Math.round((used / total) * 1000) / 10 : null

/**
 * The metrics refresh about once a minute, so CPU is the 1-minute load average over the core
 * count (an estimate that also counts disk wait), capped at 100.
 */
export function computeDbMetrics(samples: Sample[]): DbMetrics {
  const cores = new Set(
    samples
      .filter((sample) => sample.name === 'node_cpu_seconds_total')
      .map((s) => s.labels['cpu']),
  ).size
  const load =
    has(samples, 'node_load1') && cores > 0 ? percent(sum(samples, 'node_load1'), cores) : null
  const cpu = load === null ? null : Math.min(100, load)

  const hasMemory =
    has(samples, 'node_memory_MemTotal_bytes') && has(samples, 'node_memory_MemAvailable_bytes')
  const memoryTotal = sum(samples, 'node_memory_MemTotal_bytes')
  const ram = hasMemory
    ? percent(memoryTotal - sum(samples, 'node_memory_MemAvailable_bytes'), memoryTotal)
    : null

  // Postgres data lives on /data at Supabase; fall back to the root volume
  const mount = samples.some(
    (s) => s.name === 'node_filesystem_size_bytes' && s.labels['mountpoint'] === '/data',
  )
    ? '/data'
    : '/'
  const onMount = (labels: Record<string, string>) => labels['mountpoint'] === mount
  const size = sum(samples, 'node_filesystem_size_bytes', onMount)
  const disk =
    size > 0 ? percent(size - sum(samples, 'node_filesystem_avail_bytes', onMount), size) : null

  const connections = has(samples, 'pg_stat_database_num_backends')
    ? Math.round(sum(samples, 'pg_stat_database_num_backends'))
    : null
  const max = samples.find((sample) => sample.name === 'max_connections_connection_count')

  return { cpu, ram, disk, connections, maxConnections: max ? Math.round(max.value) : null }
}
