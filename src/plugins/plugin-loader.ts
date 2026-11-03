/**
 * 🔑 P2-2 插件动态加载
 *
 * 加载顺序:
 *   1. localStorage['bi_plugin_manifests'] 中用户配置的插件清单 (JSON 数组, 优先)
 *   2. 否则读取静态清单 /plugins/manifest.json (随项目发布)
 *   3. 逐个注入 <script>, 脚本内调用 window.BI.registerComponent 注册组件
 *
 * 必须在 app.mount 之前调用 (main.ts 中已接入)。
 */
export interface PluginManifestEntry {
  name?: string
  url: string
}

const STORAGE_KEY = 'bi_plugin_manifests'
const DEFAULT_MANIFEST_URL = '/plugins/manifest.json'
const SCRIPT_TIMEOUT_MS = 15000

/** 读取用户配置的插件清单 (localStorage) */
export function getPluginManifests(): PluginManifestEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p: any) => typeof p?.url === 'string' && p.url.trim())
  } catch {
    return []
  }
}

/** 保存用户配置的插件清单 (下次启动生效) */
export function setPluginManifests(list: PluginManifestEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

async function resolveManifests(): Promise<PluginManifestEntry[]> {
  const local = getPluginManifests()
  if (local.length > 0) return local

  try {
    const res = await fetch(DEFAULT_MANIFEST_URL, { cache: 'no-cache' })
    if (!res.ok) return []
    const json: any = await res.json()
    const plugins = Array.isArray(json) ? json : json?.plugins
    if (!Array.isArray(plugins)) return []
    return plugins.filter((p: any) => typeof p?.url === 'string' && p.url.trim())
  } catch {
    return []
  }
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.biPlugin = 'true'

    const timer = window.setTimeout(() => {
      script.remove()
      reject(new Error(`加载超时: ${url}`))
    }, SCRIPT_TIMEOUT_MS)

    script.onload = () => {
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      script.remove()
      reject(new Error(`加载失败: ${url}`))
    }
    document.head.appendChild(script)
  })
}

/** 加载全部插件脚本, 单个插件失败不影响其他插件与应用启动 */
export async function loadExternalPlugins(): Promise<{ loaded: string[]; failed: string[] }> {
  const manifests = await resolveManifests()

  // 并发加载，避免多个插件串行把启动时间累加；结果顺序与 manifest 保持一致
  const results = await Promise.all(
    manifests.map(async (item) => {
      try {
        await loadScript(item.url)
        return { url: item.url, ok: true as const }
      } catch (err) {
        console.warn(`[BI Plugin] ${(err as Error).message}`)
        return { url: item.url, ok: false as const }
      }
    }),
  )

  return {
    loaded: results.filter((r) => r.ok).map((r) => r.url),
    failed: results.filter((r) => !r.ok).map((r) => r.url),
  }
}
