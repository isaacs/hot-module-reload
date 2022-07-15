// this only tests that the HMR function doesn't keep the process
// open.  The test will time out if it does.
import t from 'tap'
import { hotModuleReload } from '../src/index'
t.type(hotModuleReload(), 'function', 'function return value')
t.pass('this should exit swiftly')
