import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type SiteLanguage = 'uk' | 'ru' | 'en'

type I18nContextValue = {
  language: SiteLanguage
  setLanguage: (next: SiteLanguage) => void
}

const STORAGE_KEY = 'broiderie.site.language'
const CACHE_KEY = 'broiderie.translation.cache.v1'
const ATTRS_TO_TRANSLATE = ['placeholder', 'aria-label', 'title'] as const
const TEXT_LIKE_RE = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'OPTION'])

const I18nContext = createContext<I18nContextValue | null>(null)

const textOriginals = new WeakMap<Text, string>()
const attrOriginals = new WeakMap<Element, Record<string, string>>()
const inFlight = new Map<string, Promise<string>>()

function splitEdges(input: string) {
  const m = input.match(/^(\s*)([\s\S]*?)(\s*)$/)
  return {
    leading: m?.[1] ?? '',
    core: m?.[2] ?? input,
    trailing: m?.[3] ?? '',
  }
}

function isTranslatable(text: string) {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 2) return false
  if (/^[A-ZА-ЯІЇЄҐ]{1,3}$/.test(trimmed)) return false
  if (!TEXT_LIKE_RE.test(trimmed)) return false
  if (/^https?:\/\//i.test(trimmed)) return false
  if (/^[\d\s.,:+\-_%$€₴()!?/\\|]+$/.test(trimmed)) return false
  return true
}

function readCache(): Record<SiteLanguage, Record<string, string>> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { uk: {}, ru: {}, en: {} }
    const parsed = JSON.parse(raw) as Partial<Record<SiteLanguage, Record<string, string>>>
    return {
      uk: parsed.uk ?? {},
      ru: parsed.ru ?? {},
      en: parsed.en ?? {},
    }
  } catch {
    return { uk: {}, ru: {}, en: {} }
  }
}

function writeCache(cache: Record<SiteLanguage, Record<string, string>>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore quota/storage errors.
  }
}

function sanitizeTranslatedText(text: string, fallback: string) {
  const stripped = text
    // Remove encoded tags first.
    .replace(/&lt;\/?[^&]*?&gt;/gi, '')
    // Remove raw HTML/SVG tags.
    .replace(/<\/?[^>]+>/g, '')
    .trim()

  return stripped || fallback
}

async function requestTranslation(text: string, target: Exclude<SiteLanguage, 'uk'>) {
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', text)
  url.searchParams.set('langpair', `uk|${target}`)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`)

  const data = await res.json() as {
    responseData?: { translatedText?: string }
    matches?: Array<{ translation?: string }>
  }

  const primary = data.responseData?.translatedText?.trim()
  if (primary) return sanitizeTranslatedText(primary, text)

  const backup = data.matches?.find(m => m.translation?.trim())?.translation?.trim()
  if (backup) return sanitizeTranslatedText(backup, text)

  return text
}

function getRootNode() {
  return document.getElementById('root') ?? document.body
}

type TextTask = {
  node: Text
  leading: string
  core: string
  trailing: string
}

type AttrTask = {
  el: Element
  attr: (typeof ATTRS_TO_TRANSLATE)[number]
  original: string
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SiteLanguage | null
    if (saved === 'uk' || saved === 'ru' || saved === 'en') return saved
    return 'en'
  })

  const cacheRef = useRef<Record<SiteLanguage, Record<string, string>>>(readCache())
  const isApplyingRef = useRef(false)

  const setLanguage = useCallback((next: SiteLanguage) => {
    setLanguageState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const translateText = useCallback(async (source: string, target: SiteLanguage) => {
    if (target === 'uk') return source
    const key = source.trim()
    if (!key) return source

    const cached = cacheRef.current[target][key]
    if (cached) {
      const safeCached = sanitizeTranslatedText(cached, source)
      if (safeCached !== cached) {
        cacheRef.current[target][key] = safeCached
        writeCache(cacheRef.current)
      }
      return safeCached
    }

    const requestKey = `${target}|${key}`
    const ongoing = inFlight.get(requestKey)
    if (ongoing) return ongoing

    const task = requestTranslation(key, target)
      .then(translated => {
        const safeTranslated = sanitizeTranslatedText(translated, source)
        cacheRef.current[target][key] = safeTranslated
        writeCache(cacheRef.current)
        inFlight.delete(requestKey)
        return safeTranslated
      })
      .catch(() => {
        inFlight.delete(requestKey)
        return source
      })

    inFlight.set(requestKey, task)
    return task
  }, [])

  const applyTranslation = useCallback(async (target: SiteLanguage) => {
    const root = getRootNode()
    isApplyingRef.current = true

    try {
      const textNodes: Text[] = []
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

      let current = walker.nextNode()
      while (current) {
        const node = current as Text
        const parent = node.parentElement

        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.isContentEditable) {
          current = walker.nextNode()
          continue
        }

        const original = textOriginals.get(node) ?? node.nodeValue ?? ''
        if (!textOriginals.has(node)) textOriginals.set(node, original)

        if (isTranslatable(original)) textNodes.push(node)
        current = walker.nextNode()
      }

      const attrElements = Array.from(root.querySelectorAll('[placeholder],[aria-label],[title]'))

      if (target === 'uk') {
        for (const node of textNodes) {
          const original = textOriginals.get(node)
          if (original != null) node.nodeValue = original
        }

        for (const el of attrElements) {
          const originalMap = attrOriginals.get(el)
          if (!originalMap) continue
          for (const [attr, value] of Object.entries(originalMap)) {
            el.setAttribute(attr, value)
          }
        }
        document.documentElement.lang = 'uk'
        return
      }

      const textTasks: TextTask[] = []
      for (const node of textNodes) {
        const original = textOriginals.get(node) ?? ''
        const { leading, core, trailing } = splitEdges(original)
        if (!isTranslatable(core)) continue
        textTasks.push({ node, leading, core, trailing })
      }

      const attrTasks: AttrTask[] = []
      for (const el of attrElements) {
        const snapshot: Record<string, string> = attrOriginals.get(el) ?? {}

        for (const attr of ATTRS_TO_TRANSLATE) {
          const currentValue = el.getAttribute(attr)
          if (!currentValue) continue
          if (!(attr in snapshot)) snapshot[attr] = currentValue

          const original = snapshot[attr]
          if (!isTranslatable(original)) continue
          attrTasks.push({ el, attr, original })
        }

        if (Object.keys(snapshot).length > 0) attrOriginals.set(el, snapshot)
      }

      const uniqueCores = Array.from(new Set([
        ...textTasks.map(t => t.core),
        ...attrTasks.map(a => a.original),
      ]))

      const translatedPairs = await Promise.all(
        uniqueCores.map(async (core) => [core, await translateText(core, target)] as const)
      )
      const translatedMap = new Map<string, string>(translatedPairs)

      // Apply in one pass after all translations are ready.
      for (const task of textTasks) {
        const translated = translatedMap.get(task.core) ?? task.core
        task.node.nodeValue = `${task.leading}${translated}${task.trailing}`
      }

      for (const task of attrTasks) {
        const translated = translatedMap.get(task.original) ?? task.original
        task.el.setAttribute(task.attr, translated)
      }

      document.documentElement.lang = target
    } finally {
      isApplyingRef.current = false
    }
  }, [translateText])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (cancelled) return
      await applyTranslation(language)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [language, applyTranslation])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
