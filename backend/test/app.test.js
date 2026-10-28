import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

const config = {
  frontendOrigin: 'https://codelens-test.vercel.app',
  supabaseUrl: 'https://project.supabase.co',
  supabaseAnonKey: 'public-anon-key',
  geminiApiKey: 'server-only-key',
  geminiModel: 'gemini-2.5-flash',
  maxCodeBytes: 80000,
  maxRepositoryFiles: 8,
  maxRepositoryBytes: 60000,
  production: true,
}

test('exposes health and protects user APIs with exact-origin CORS and authentication', async (context) => {
  const server = createApp(config).listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve) => server.close(resolve)))
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`

  const health = await fetch(`${baseUrl}/healthz`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })

  const unauthorized = await fetch(`${baseUrl}/api/reviews`, {
    headers: { origin: config.frontendOrigin },
  })
  assert.equal(unauthorized.status, 401)
  assert.equal(unauthorized.headers.get('access-control-allow-origin'), config.frontendOrigin)

  const forbiddenOrigin = await fetch(`${baseUrl}/api/reviews`, {
    headers: { origin: 'https://attacker.example' },
  })
  assert.equal(forbiddenOrigin.status, 403)
})
