# MCP servers

This repo talks to five hosted MCP servers. They are declared in `.mcp.json` at the repo root — the
project-scope file Claude Code reads, and the same shape Cursor, VS Code and most other clients accept.

| Server        | Endpoint                            | Auth                          | What it's for                                              |
| ------------- | ----------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `motion`      | `https://mcp.motion.dev`            | none (Motion+ via sign-in)    | Motion / `motion/react` docs, transitions, performance      |
| `motion-plus` | `https://mcp.motion.dev/plus`       | Motion+ sign-in from the agent | Motion+ components and advanced APIs                        |
| `21st`        | `https://21st.dev/api/mcp`          | `x-api-key` header            | Search and pull React/Tailwind UI components               |
| `isekai-zero` | `https://mcp.isekaizero.ai/api/mcp` | `Authorization: Bearer …`     | IsekaiZero storylines, characters, stats                    |
| `kagesekai`   | `https://mcp.kagesekai.ai/api/mcp`  | `Authorization: Bearer …`     | KageSekai (18+) storylines, characters, stats               |

## Keys stay out of git

`.mcp.json` holds live keys, so it is git-ignored; `.mcp.example.json` is the committed template.
To set up a fresh clone:

```sh
cp .mcp.example.json .mcp.json   # then fill in the three secrets
```

or export the variables and let the `${…}` placeholders resolve at connect time:

```sh
export TWENTY_FIRST_API_KEY=21st_sk_…
export ISEKAI_ZERO_MCP_TOKEN=izk_…
export KAGESEKAI_MCP_TOKEN=izk_…
```

## Verify

`scripts/mcp-tools.mjs` speaks streamable HTTP to a server, runs the `initialize` handshake and prints
everything from `tools/list` — no client install needed:

```sh
node scripts/mcp-tools.mjs          # every server
node scripts/mcp-tools.mjs 21st     # one server
```

A healthy `21st` should answer with `search`, `get_component` and friends.

## Other clients

- **Cursor** — copy the same object into `.cursor/mcp.json` (it reads `mcpServers` too).
- **VS Code** — `.vscode/mcp.json` wants the key `servers` instead of `mcpServers`.
- **stdio-only hosts** — bridge with `npx -y mcp-remote <url> --header "x-api-key: …"`.

## From a restricted sandbox

Some environments (CI, cloud sandboxes, corporate VPNs) allow only a short list of domains. If
`node scripts/mcp-tools.mjs` reports `fetch failed` / `ECONNRESET`, the host is unreachable from
there — the config is still correct, run the check from a normal machine.
