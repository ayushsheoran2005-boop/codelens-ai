import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from 'express-rate-limit'
import { analyzeWithGemini, collectPublicRepository, httpError, validateAnalysisInput } from './analysis.js'

const languages = new Set(['Python', 'JavaScript', 'TypeScript'])
const requestTimeoutMs = 75000

export function createApp(config) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === config.frontendOrigin || (!config.production && origin === 'http://localhost:5173')) {
        callback(null, true)
      } else {
        callback(httpError(403, 'ORIGIN_NOT_ALLOWED', 'This website is not allowed to use the API.'))
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
    maxAge: 600,
  }))
  app.use(express.json({ limit: '300kb', strict: true }))

  app.get('/healthz', (_request, response) => response.json({ status: 'ok' }))
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({ error: { code: 'REQUEST_LIMIT', message: 'Too many requests. Wait a few minutes before trying again.' } }),
  })
  const analysisLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    keyGenerator: (request) => request.user.id,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({ error: { code: 'ANALYSIS_LIMIT', message: 'Review limit reached for this account. Wait 15 minutes before trying again.' } }),
  })
  app.use(generalLimiter)

  app.use('/api', (request, response, next) => {
    const timer = setTimeout(() => {
      if (!response.headersSent) response.status(408).json({ error: { code: 'REQUEST_TIMEOUT', message: 'The request timed out. Please retry.' } })
    }, requestTimeoutMs)
    response.on('finish', () => clearTimeout(timer))
    response.on('close', () => clearTimeout(timer))
    next()
  })

  app.use('/api', async (request, response, next) => {
    const authorization = request.get('authorization') || ''
    const match = authorization.match(/^Bearer ([\w.-]+)$/)
    if (!match) return response.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Sign in to use the CodeLens API.' } })
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${match[1]}` } },
      })
      const { data, error } = await supabase.auth.getUser(match[1])
      if (error || !data.user) return response.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Your session expired. Sign in again.' } })
      request.user = data.user
      request.supabase = supabase
      next()
    } catch {
      response.status(503).json({ error: { code: 'AUTH_UNAVAILABLE', message: 'Authentication could not be verified right now. Please retry.' } })
    }
  })

  app.get('/api/reviews', async (request, response) => {
    const { data, error } = await request.supabase.from('reviews')
      .select('id, name, language, code, findings, status, source, created_at')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return response.status(500).json({ error: { code: 'HISTORY_FAILED', message: 'Could not load review history. Please retry.' } })
    response.json({ reviews: data.map(toReview) })
  })

  app.get('/api/reviews/:id', async (request, response) => {
    const { data, error } = await request.supabase.from('reviews')
      .select('id, name, language, code, findings, status, source, created_at')
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .maybeSingle()
    if (error) return response.status(500).json({ error: { code: 'REVIEW_LOAD_FAILED', message: 'Could not load this review. Please retry.' } })
    if (!data) return response.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'This review was not found in your account.' } })
    response.json({ review: toReview(data) })
  })

  app.delete('/api/reviews/:id', async (request, response) => {
    const { data, error } = await request.supabase.from('reviews')
      .delete()
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .select('id')
      .maybeSingle()
    if (error) return response.status(500).json({ error: { code: 'REVIEW_DELETE_FAILED', message: 'Could not delete this review. Please retry.' } })
    if (!data) return response.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'This review was not found in your account.' } })
    response.status(204).end()
  })

  app.post('/api/reviews/analyze', analysisLimiter, async (request, response) => {
    try {
      const { language: requestedLanguage } = request.body?.repositoryUrl === undefined
        ? validateAnalysisInput(request.body, config.maxCodeBytes)
        : validateAnalysisInput({ code: 'public repository analysis', language: request.body.language }, config.maxCodeBytes)
      let language = requestedLanguage
      let code = request.body.repositoryUrl === undefined ? request.body.code : ''
      let name = 'Code review'
      let source = 'code'

      if (request.body.repositoryUrl !== undefined) {
        if (request.body.code !== undefined && (typeof request.body.code !== 'string' || Buffer.byteLength(request.body.code, 'utf8') > config.maxCodeBytes)) {
          throw httpError(413, 'REQUEST_TOO_LARGE', 'The repository request contains an oversized code field.')
        }
        if (typeof request.body.repositoryUrl !== 'string' || request.body.repositoryUrl.length > 500) {
          throw httpError(400, 'INVALID_REPOSITORY_URL', 'Enter a valid public GitHub repository URL.')
        }
        const files = await collectPublicRepository({
          urlValue: request.body.repositoryUrl,
          maxFiles: config.maxRepositoryFiles,
          maxBytes: config.maxRepositoryBytes,
        })
        code = files.map((file) => `// File: ${file.path}\n${file.content}`).join('\n\n')
        if (Buffer.byteLength(code, 'utf8') > config.maxCodeBytes) {
          throw httpError(413, 'REPOSITORY_TOO_LARGE', `Selected repository files exceed the ${config.maxCodeBytes}-byte analysis limit.`)
        }
        name = request.body.repositoryUrl.replace(/\/+$/, '').split('/').slice(-2).join('/')
        source = 'github'
        const extension = files[0].path.split('.').pop()?.toLowerCase()
        language = extension === 'py' ? 'Python' : extension === 'ts' || extension === 'tsx' ? 'TypeScript' : 'JavaScript'
      }
      if (!languages.has(language)) throw httpError(400, 'INVALID_LANGUAGE', 'Choose Python, JavaScript, or TypeScript.')

      const findings = await analyzeWithGemini({
        code,
        language,
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
      })
      const review = {
        user_id: request.user.id,
        name,
        language,
        code,
        findings,
        status: findings.length ? 'Complete' : 'No issues',
        source,
      }
      const { data, error } = await request.supabase.from('reviews')
        .insert(review)
        .select('id, name, language, code, findings, status, source, created_at')
        .single()
      if (error) return response.status(500).json({ error: { code: 'REVIEW_SAVE_FAILED', message: 'Analysis finished, but review history could not be saved. Check the Supabase table and policies.' } })
      response.status(201).json({ review: toReview(data) })
    } catch (error) {
      response.status(error.status || 500).json({
        error: {
          code: error.code || 'ANALYSIS_FAILED',
          message: error.status ? error.message : 'The analysis could not be completed. Please retry.',
        },
      })
    }
  })

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.too.large') {
      return response.status(413).json({ error: { code: 'REQUEST_TOO_LARGE', message: 'The request is too large. Reduce the code sample and retry.' } })
    }
    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body must be valid JSON.' } })
    }
    if (error?.code === 'ORIGIN_NOT_ALLOWED') {
      return response.status(403).json({ error: { code: error.code, message: error.message } })
    }
    console.error('Unhandled API error', error?.message || error)
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The server could not complete this request.' } })
  })

  return app
}

function toReview(row) {
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    code: row.code,
    issues: row.findings,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  }
}
