# @isaacs/remix-hot-module-reload

Use this function when you want to reload your remix dev server's
modules when they change.

Designed to replace `remix-run`'s default out of the box hot
module reloading, because it restarts on every request, which
thwarts debugging/testing memory caches, and _never_ reloading
those things (by making them global) means that they won't ever
reload when the logic actually changes, either.

This only actually works with Remix, only tested on
remix-express, since that's what I use.  It relies on the fact
that it can rebuild its request handler as needed.

If you find it useful as well, then that's lovely.

## INSTALLATION

```bash
npm i @isaacs/hot-module-reload
```

## USAGE

```ts
// in server.ts
import { hotModuleReload } from '@isaacs/hot-module-reload'

// note, do not do this in production!  very bad idea!
if (NODE_ENV !== 'production') {
  hotModuleReload({
    // the filter which says which files get the special
    // treatment.  by default, will reload for anything
    // outside of ${cwd}/node_modules
    filter: f => f.startsWith(BUILD_DIR),

    // how often in ms to check for changes.  default is 250ms
    frequency: 250,

    // optional: provide special treatment for restarting a
    // server or doing other things that might need to be done
    // before the module can be safely reloaded.
    // no effect unless a callerModule is set as well.
    callerRestart: () => new Promise(res => {
      server.close(res)
      server.closeAllConnections()
    }),

    // the caller module that needs the special treatment
    // optional, but if not set, then callerRestart has no
    // effect.
    callerModule: __filename,
  })
}

// then call createRequestHandler for each request in dev, or
// just one time up front for production
app.all('*',
  NODE_ENV === 'production'
  ? createRequestHandler({ build: require(BUILD_DIR) })
  : (...args) =>
    createRequestHandler({
      build: require(BUILD_DIR),
    })(...args)
)
```
