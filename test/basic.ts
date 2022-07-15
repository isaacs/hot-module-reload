import t from 'tap'
import { hotModuleReload } from '../src/index'
import Clock from 'clock-mock'

const clock = new Clock()
t.teardown(clock.enter())
import { unlinkSync, writeFileSync, readFileSync } from 'node:fs'

t.test('basic reload test', async t => {
  const dir = t.testdir({
    'server.ts': `
      let hmrStop: () => void
      export const stop = () => {
        if (hmrStop) {
          hmrStop()
        }
      }
      export const start = (hmr: (x:any) => () => void, dir: string) => {
        const i = setInterval(() => {
          const getNum = require('./get-num').default
          console.log(getNum())
        }, 100)
        hmrStop = hmr({
          frequency: 10,
          filter: (f:string) => f.startsWith(dir),
          callerRestart: async () => {
            clearInterval(i)
          },
          callerModule: __filename,
        })
      }
    `,
    'get-num.ts': `
      export default () => 1
    `,
  })

  const logs: any[] = []
  const { log } = console
  t.teardown(() => {
    console.log = log
  })
  console.log = (...m: any[]) => logs.push(...m)
  let { start, stop } = require(`${dir}/server`)
  start(hotModuleReload, dir)

  logs.length = 0
  clock.advance(100)
  clock.advance(100)
  t.strictSame(logs, [1, 1])

  writeFileSync(`${dir}/value.ts`, `export default 2`)
  writeFileSync(
    `${dir}/get-num.ts`,
    `
    export default () => require('./value').default
  `
  )

  // give it a few promise ticks, dodge the clock hijack
  await Promise.resolve().then(() => Promise.resolve())

  logs.length = 0
  clock.advance(100)
  clock.advance(100)
  t.strictSame(logs, [2, 2])

  writeFileSync(
    `${dir}/server.ts`,
    readFileSync(`${dir}/server.ts`, 'utf8') + '\n\n'
  )

  await Promise.resolve().then(() => Promise.resolve())

  logs.length = 0
  clock.advance(100)
  clock.advance(100)
  t.strictSame(logs, [2, 2])

  unlinkSync(`${dir}/value.ts`)
  writeFileSync(
    `${dir}/get-num.ts`,
    `
    export default () => 3
  `
  )

  await Promise.resolve().then(() => Promise.resolve())

  logs.length = 0
  clock.advance(100)
  clock.advance(100)
  t.strictSame(logs, [3, 3])

  stop()

  // no longer HMRing
  writeFileSync(
    `${dir}/get-num.ts`,
    `
    export default () => 4
  `
  )

  logs.length = 0
  clock.advance(100)
  clock.advance(100)
  t.strictSame(logs, [3, 3], 'did not hmr')
})
