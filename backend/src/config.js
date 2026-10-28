const required = ['FRONTEND_ORIGIN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY']

export function readConfig(env = process.env) {
  const missing = required.filter((key) => !env[key]?.trim())
  if (missing.length) {
    throw new Error(`Missing required backend environment variables: ${missing.join(', ')}`)
  }

  const supabaseUrl = new URL(env.SUPABASE_URL)
  if (supabaseUrl.protocol !== 'https:' && env.NODE_ENV === 'production') {
    throw new Error('SUPABASE_URL must use HTTPS in production')
  }

  const frontendOrigin = new URL(env.FRONTEND_ORIGIN)
  if (frontendOrigin.origin !== env.FRONTEND_ORIGIN.replace(/\/$/, '')) {
    throw new Error('FRONTEND_ORIGIN must be a single origin without a path')
  }
  if (env.NODE_ENV === 'production' && frontendOrigin.protocol !== 'https:') {
    throw new Error('FRONTEND_ORIGIN must use HTTPS in production')
  }

  return {
    frontendOrigin: frontendOrigin.origin,
    supabaseUrl: supabaseUrl.origin,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxCodeBytes: boundedInteger(env.MAX_CODE_BYTES, 80000, 1000, 100000),
    maxRepositoryFiles: boundedInteger(env.MAX_REPOSITORY_FILES, 8, 1, 15),
    maxRepositoryBytes: boundedInteger(env.MAX_REPOSITORY_BYTES, 60000, 1000, 100000),
    port: boundedInteger(env.PORT, 10000, 1, 65535),
    production: env.NODE_ENV === 'production',
  }
}

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(maximum, Math.max(minimum, parsed))
}
