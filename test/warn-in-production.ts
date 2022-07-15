// this only tests that the HMR function doesn't keep the process
// open.  The test will time out if it does.
process.env.NODE_ENV = 'production'
import t from 'tap'
const errors: any[] = []
console.error = (...m: any) => errors.push(...m)
import { hotModuleReload } from '../src/index'
const s = hotModuleReload()
t.type(s, 'function', 'function return value')
t.equal(hotModuleReload(), s, 'calling more than once returns same stop val')
t.match(errors, [/\u26a0\ufe0f/], 'printed warning')
t.equal(errors.length, 1, 'did not warn more than once')
