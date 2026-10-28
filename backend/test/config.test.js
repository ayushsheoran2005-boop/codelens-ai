import test from 'node:test'
import assert from 'node:assert/strict'
import { readConfig } from '../src/config.js'

const base = {
  NODE_ENV: 'production',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  GEMINI_API_KEY: 'server-only-key',
  FRONTEND_ORIGIN: 'https://codelens.vercel.app',
}

test('requires a single HTTPS frontend origin and backend credentials', () => {
  assert.equal(readConfig(base).frontendOrigin, base.FRONTEND_ORIGIN)
  assert.throws(() => readConfig({ ...base, FRONTEND_ORIGIN: 'https://codelens.vercel.app/path' }), /single origin/)
  assert.throws(() => readConfig({ ...base, FRONTEND_ORIGIN: 'http://codelens.vercel.app' }), /HTTPS/)
  const missingKey = { ...base }
  delete missingKey.GEMINI_API_KEY
  assert.throws(() => readConfig(missingKey), /GEMINI_API_KEY/)
})
