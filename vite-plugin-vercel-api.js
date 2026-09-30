import path from 'path'
import { existsSync } from 'fs'

/**
 * Vite plugin that serves Vercel-style serverless functions from the `api/`
 * directory during development, so the frontend can call `/api/*` without a
 * separate backend process.
 *
 * Route matching mirrors Vercel's file-based routing:
 *   /api/linepay          → api/linepay.js
 *   /api/linepay/confirm  → api/linepay/confirm.js
 *   /api/jkopay           → api/jkopay.js
 */
export function vercelApiPlugin() {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const route = url.pathname.replace(/^\/api\/?/, '')
        if (!route) return next()

        const root = process.cwd()
        const candidates = [
          path.resolve(root, 'api', route + '.js'),
          path.resolve(root, 'api', route, 'index.js'),
        ]

        let handlerFile = null
        for (const c of candidates) {
          if (existsSync(c)) { handlerFile = c; break }
        }
        if (!handlerFile) return next()

        let handler
        try {
          const mod = await import('file://' + handlerFile)
          handler = mod.default
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
          return
        }
        if (typeof handler !== 'function') return next()

        // Parse JSON body for non-GET requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString()
          try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = raw }
        }

        req.query = Object.fromEntries(url.searchParams)

        // Add Express/Vercel-like helpers to the raw Node response
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (data) => {
          if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return res
        }
        res.redirect = (url) => {
          res.statusCode = 302
          res.setHeader('Location', url)
          res.end()
          return res
        }

        try {
          await handler(req, res)
        } catch (e) {
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
        }
      })
    },
  }
}
