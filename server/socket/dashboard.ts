import { DurableObject } from "cloudflare:workers"

interface Env {
  DATA: KVNamespace
}

export class DashboardWebSocket extends DurableObject<Env> {
  private connections: Set<WebSocket>
  private intervalId: number | undefined

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.connections = new Set()
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

    this.ctx.acceptWebSocket(server)
    this.connections.add(server)

    if (!this.intervalId) {
      // Broadcast metrics every 5 seconds while connections are active
      this.intervalId = setInterval(() => {
        this.broadcastMetrics().catch((err) => {
          console.error("Broadcast error", err)
        })
      }, 5000) as unknown as number
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  private async broadcastMetrics(): Promise<void> {
    try {
      const [okStr, errorStr] = await Promise.all([this.env.DATA.get("metrics:ok"), this.env.DATA.get("metrics:error")])

      const payload = JSON.stringify({
        ok: okStr ? Number.parseInt(okStr, 10) : 0,
        error: errorStr ? Number.parseInt(errorStr, 10) : 0,
        timestamp: Date.now()
      })

      for (const ws of this.connections) {
        try {
          ws.send(payload)
        } catch (error) {
          console.error("Send failed", error)
          this.connections.delete(ws)
        }
      }

      if (this.connections.size === 0 && this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = undefined
      }
    } catch (error) {
      console.error("Metric retrieval failed", error)
    }
  }

  override async webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer): Promise<void> {
    // No client messages expected
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    this.connections.delete(ws)
  }

  override async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error", error)
    ws.close(1011, "WebSocket error")
  }
}
