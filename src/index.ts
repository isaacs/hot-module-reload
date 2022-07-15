// usage:
// hotModuleReload({
//   filter?: (key) => boolean,
//   callerRestart?: async() => Promise<void>,
//   callerModule: __filename,
//   frequency: number = 250,
// })
//
// Smart enough to not just keep re-initializing the reloading
// checks for changes every ${frequency} ms

import { statSync } from 'node:fs'

export type HMRSettings = {
  /**
   * the filter for which files get hot reload treatment
   */
  filter?: (key: string) => boolean
  /**
   * special function to call before reloading the module that
   * is calling this one.  The place to restart a server, etc.
   */
  callerRestart?: () => Promise<any>
  /**
   * file that should be given special treatment before HMRing
   */
  callerModule?: string
  /**
   * how often in ms to check for changes
   */
  frequency?: number
}

const getMtime = (f: string) => {
  try {
    return +statSync(f).mtime
  } catch (_) {
    return null
  }
}

import { resolve } from 'node:path'
const myNodeModules = resolve(process.cwd(), 'node_modules').toLowerCase()
/* istanbul ignore next */
const defaultFilter = (f: string) =>
  !f.toLowerCase().startsWith(myNodeModules)
const mtimes = new Map<string, number>()
let stop: ()=>void | undefined
export const hotModuleReload = (
  /* istanbul ignore next - just a sensible default */
  {
    filter = defaultFilter,
    callerRestart,
    callerModule,
    frequency = 250,
  }: HMRSettings = {
    frequency: 250,
  }
): (() => void) => {
  // do not initialize more than one time
  if (stop) {
    return stop
  }
  if (process.env.NODE_ENV === 'production') {
    console.error(`

\u26a0\ufe0f \u26a0\ufe0f \u26a0\ufe0f
WARNING: production hot module reloading is EXTREMELY not advised!
This will result in memory leaks, guaranteed.
\u26a0\ufe0f \u26a0\ufe0f \u26a0\ufe0f

`)
  }

  const hmr = () => {
    /* istanbul ignore if - hard to hit */
    if (stopped) {
      return
    }

    const files = Object.keys(require.cache)
    for (const key of files.filter(filter)) {
      const old = mtimes.get(key)
      const cur = getMtime(key)
      if (!cur) {
        // file went missing
        mtimes.delete(key)
        continue
      }
      if (old && old !== cur) {
        delete require.cache[key]
        // this is a module that will end up calling HMR, so do
        // not call it again.
        if (callerRestart && key === callerModule) {
          callerRestart().then(() => {
            /* istanbul ignore else - hard to hit */
            if (!stopped) {
              require(key)
            }
          })
        } else {
          require(key)
          // stop this one, because we just reloaded
          /* istanbul ignore if */
          if (key === __filename) {
            stop()
          }
        }
      }
      mtimes.set(key, cur)
    }
    /* istanbul ignore else - hard to hit */
    if (!stopped) {
      timer = setTimeout(hmr, frequency)
      timer.unref()
    }
  }

  let timer = setTimeout(hmr, frequency)
  timer.unref()
  let stopped = false

  stop = () => {
    /* istanbul ignore else - hard to hit */
    if (timer) {
      clearTimeout(timer)
      stopped = true
    }
  }

  return stop
}
