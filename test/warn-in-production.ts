// this only tests that the HMR function doesn't keep the process
// open.  The test will time out if it does.
process.env.NODE_ENV = 'production'
import t from 'tap'
const errors: any[] = []
console.error = (...m: any) => errors.push(...m)
import { hotModuleReload } from '../src/index'
t.type(hotModuleReload(), 'function', 'function return value')
t.match(errors, [/\u26a0\ufe0f/], 'printed warning')
