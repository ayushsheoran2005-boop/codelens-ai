import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeWithGemini, collectPublicRepository, parseFindings, validateAnalysisInput } from '../src/analysis.js'

test('rejects empty or oversized code', () => {
  assert.throws(() => validateAnalysisInput({ code: '  ', language: 'Python' }, 100), { code: 'EMPTY_CODE' })
  assert.throws(() => validateAnalysisInput({ code: 'x'.repeat(101), language: 'Python' }, 100), { code: 'CODE_TOO_LARGE' })
  assert.throws(() => validateAnalysisInput({ code: 'x', language: 'Ruby' }, 100), { code: 'INVALID_LANGUAGE' })
})

test('bounds and validates AI findings', () => {
  const findings = parseFindings(JSON.stringify({
    findings: [
      { title: 'issue', severity: 'critical', line: 200, file: null, explanation: 'why', suggestion: 'fix', suggestedCode: null },
    ],
  }), 'one\ntwo')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].line, 2)
  assert.equal(findings[0].suggestedCode, null)
  assert.throws(() => parseFindings(JSON.stringify({
    findings: [{ title: 'bad severity', severity: 'unknown', line: 1, explanation: 'why', suggestion: 'fix' }],
  }), 'one'), { code: 'INVALID_AI_RESPONSE' })
})

test('rejects non-GitHub and malformed repository URLs without fetching', async () => {
  await assert.rejects(collectPublicRepository({ urlValue: 'http://github.com/owner/repo', maxFiles: 2, maxBytes: 1000 }), { code: 'INVALID_REPOSITORY_URL' })
  await assert.rejects(collectPublicRepository({ urlValue: 'https://example.com/owner/repo', maxFiles: 2, maxBytes: 1000 }), { code: 'INVALID_REPOSITORY_URL' })
  await assert.rejects(collectPublicRepository({ urlValue: 'https://github.com/owner/repo/tree/main', maxFiles: 2, maxBytes: 1000 }), { code: 'INVALID_REPOSITORY_URL' })
})

test('reports Gemini quota exhaustion as a clear retryable error', async (context) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    assert.equal(new URL(input).search, '')
    assert.equal(init.headers['x-goog-api-key'], 'backend-only')
    return new Response(JSON.stringify({
      error: { message: 'Resource exhausted: quota exceeded' },
    }), { status: 403, headers: { 'content-type': 'application/json' } })
  }
  context.after(() => { globalThis.fetch = originalFetch })

  await assert.rejects(
    analyzeWithGemini({ code: 'print(1)', language: 'Python', apiKey: 'backend-only', model: 'gemini-test' }),
    { status: 429, code: 'AI_QUOTA_EXHAUSTED' },
  )
})

test('reports Gemini credential and model configuration errors clearly', async (context) => {
  const originalFetch = globalThis.fetch
  context.after(() => { globalThis.fetch = originalFetch })

  for (const [status, code] of [[401, 'AI_CREDENTIALS_ERROR'], [403, 'AI_CREDENTIALS_ERROR'], [404, 'AI_MODEL_ERROR']]) {
    globalThis.fetch = async () => new Response('{}', { status })
    await assert.rejects(
      analyzeWithGemini({ code: 'print(1)', language: 'Python', apiKey: 'backend-only', model: 'gemini-test' }),
      { status: 503, code },
    )
  }
})
