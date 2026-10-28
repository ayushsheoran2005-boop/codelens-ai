import 'dotenv/config'
import { readConfig } from './config.js'
import { createApp } from './app.js'

const config = readConfig()
const app = createApp(config)
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`CodeLens API listening on port ${config.port}`)
})

server.requestTimeout = 80000
server.headersTimeout = 85000
server.keepAliveTimeout = 5000

function stop(signal) {
  console.log(`Received ${signal}; closing HTTP server`)
  server.close((error) => {
    if (error) {
      console.error('Failed to close HTTP server cleanly', error)
      process.exitCode = 1
    }
  })
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGTERM', () => stop('SIGTERM'))
process.on('SIGINT', () => stop('SIGINT'))
