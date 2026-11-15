#!/usr/bin/env node
/**
 * List the tools a streamable-HTTP MCP server exposes, straight from .mcp.json —
 * the quickest way to prove a server is connected and see what it can do.
 *
 *   node scripts/mcp-tools.mjs            # every server in .mcp.json
 *   node scripts/mcp-tools.mjs 21st       # one server
 *   MCP_CONFIG=./other.json node scripts/mcp-tools.mjs
 *
 * Prints tool names (plus a one-line description) and exits non-zero if a server failed.
 */
import { readFileSync } from 'node:fs'

const PROTOCOL = '2025-06-18'
const TIMEOUT = 25_000

const configPath = process.env.MCP_CONFIG ?? new URL('../.mcp.json', import.meta.url)

function load() {
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch (e) {
    console.error(`! Could not read ${configPath}: ${e.message}`)
    console.error('  Copy .mcp.example.json to .mcp.json and fill in the keys first.')
    process.exit(1)
  }
}

/** `${VAR}` / `${VAR:-fallback}` in urls and headers, so .mcp.example.json can stay secret-free. */
const expand = (value) =>
  String(value).replace(/\$\{([A-Za-z0-9_]+)(?::-([^}]*))?\}/g, (_, key, fallback) => process.env[key] ?? fallback ?? '')

function describe(status, statusText, body) {
  const first = body.trim().split('\n')[0]?.slice(0, 200)
  return `HTTP ${status} ${statusText}${first ? ` — ${first}` : ''}`
}

async function post(url, body, { headers = {}, session } = {}) {
  const h = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    ...headers,
  }
  if (session) h['mcp-session-id'] = session
  const res = await fetch(url, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  return { res, text: await res.text() }
}

/** Streamable HTTP servers answer either as JSON or as an SSE stream of `data:` events. */
function messages({ res, text }) {
  if (!text.trim()) return []
  if ((res.headers.get('content-type') ?? '').includes('text/event-stream')) {
    return text
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => {
        try {
          return JSON.parse(line.slice(5).trim())
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

const pick = (list, id) => list.find((m) => m.id === id) ?? list.find((m) => m.result || m.error)

async function listTools(name, server) {
  const url = expand(server.url)
  const headers = Object.fromEntries(Object.entries(server.headers ?? {}).map(([k, v]) => [k, expand(v)]))

  const init = await post(
    url,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: 'kuletx-mcp-check', version: '1.0.0' } },
    },
    { headers },
  )
  if (!init.res.ok) throw new Error(describe(init.res.status, init.res.statusText, init.text))

  const session = init.res.headers.get('mcp-session-id') ?? undefined
  const hello = pick(messages(init), 1)
  if (hello?.error) throw new Error(hello.error.message ?? 'initialize failed')

  // Required by the spec before any other call; servers reply 202 with no body.
  await post(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, { headers, session })

  const listed = await post(url, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, { headers, session })
  if (!listed.res.ok) throw new Error(describe(listed.res.status, listed.res.statusText, listed.text))

  const reply = pick(messages(listed), 2)
  if (reply?.error) throw new Error(reply.error.message ?? 'tools/list failed')
  const tools = reply?.result?.tools ?? []
  const info = hello?.result?.serverInfo

  console.log(`\n${name}${info?.name ? ` · ${info.name} ${info.version ?? ''}`.trimEnd() : ''} — ${url}`)
  if (!tools.length) {
    console.log('  (no tools listed)')
    return
  }
  const width = Math.max(...tools.map((t) => t.name.length))
  for (const tool of tools) {
    const summary = (tool.description ?? '').replace(/\s+/g, ' ').slice(0, 90)
    console.log(`  ${tool.name.padEnd(width)}  ${summary}`)
  }
}

const config = load()
const servers = config.mcpServers ?? {}
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const names = wanted.length ? wanted : Object.keys(servers)

if (!names.length) {
  console.error('No servers in .mcp.json')
  process.exit(1)
}

let failed = 0
for (const name of names) {
  const server = servers[name]
  if (!server) {
    console.error(`\n${name} — not in .mcp.json`)
    failed++
    continue
  }
  if (!server.url) {
    console.log(`\n${name} — stdio server, nothing to probe over HTTP`)
    continue
  }
  try {
    await listTools(name, server)
  } catch (e) {
    failed++
    const cause = e.cause?.code ?? e.cause?.message ?? ''
    const network = e.name === 'TypeError' || e.name === 'TimeoutError' || /fetch failed|timed out/i.test(e.message)
    console.error(`\n${name} — FAILED: ${e.message}${cause ? ` (${cause})` : ''}`)
    if (network) console.error('  Could not reach the host: check the network, VPN or firewall (some sandboxes only allow a few domains).')
    else if (/401|403/.test(e.message)) console.error('  The key or token was rejected — check the header in .mcp.json.')
  }
}

process.exit(failed ? 1 : 0)
