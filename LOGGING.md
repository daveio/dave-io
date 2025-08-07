# Cloudflare Workers Logging Best Practices

Yes, structured logging is absolutely a brilliant idea for Cloudflare Workers—arguably one of the most important architectural decisions you'll make for observability. Here's what you need to know about logging like a proper engineer (not like someone who just discovered `console.log` yesterday).

## Structured JSON Logging: Your New Best Friend

The **most important takeaway**: Always log structured JSON objects instead of string concatenation. Cloudflare Workers Logs automatically extracts and indexes JSON fields, making your logs infinitely more queryable.[1]

**Do this:**

```javascript
console.log({
  user_id: 123,
  action: "login",
  timestamp: Date.now(),
  request_id: crypto.randomUUID()
})
```

**Not this:**

```javascript
console.log("User 123 logged in at " + Date.now())
```

The difference is night and day when you're debugging at 3 AM. With structured logging, you can filter by `user_id` or `action` directly in the dashboard. With string concatenation, you're stuck with text searches like some kind of barbarian.[1]

## Console Methods: Your Standard Arsenal

Cloudflare Workers supports the standard console API methods:[2]

- **✅ Fully supported**: `console.log()`, `console.error()`, `console.warn()`, `console.info()`, `console.debug()`
- **🟡 Partial support**: `console.table()`, `console.trace()`, `console.group()` (work in playground/remote preview)
- **⚪ No-ops**: Most other console methods

Stick to the fully supported methods for production logging. They'll appear in:

- Local development (`wrangler dev`)
- Live logs (`wrangler tail` or dashboard)
- Workers Logs for persistent storage and analysis[2]

## Enabling Workers Logs: The Setup

First, enable observability in your `wrangler.toml`:

```toml
[observability]
enabled = true
head_sampling_rate = 1.0  # Log 100% of requests (adjust for high-traffic apps)
```

For high-traffic applications, consider reducing `head_sampling_rate` to something like `0.1` (10%) to manage costs and log volume.[1]

## Performance Considerations: Don't Block the Critical Path

Here's where it gets interesting. Cloudflare Workers logging has minimal performance overhead when done correctly, but there are patterns to follow:

### For Non-Critical Logging

Use `ctx.waitUntil()` for background logging operations that shouldn't block your response:

```javascript
export default {
  async fetch(request, env, ctx) {
    const response = await handleRequest(request)

    // Log analytics/metrics in the background
    ctx.waitUntil(
      logAnalytics({
        user_agent: request.headers.get("User-Agent"),
        path: new URL(request.url).pathname,
        response_status: response.status
      })
    )

    return response
  }
}
```

This pattern prevents logging from adding latency to your user-facing response.[3]

### Synchronous Logging Performance

Regular `console.log()` calls are synchronous and will add some overhead to your request processing. However, for most use cases, this overhead is negligible. If you're logging thousands of objects per request, you might notice performance degradation.[4][5]

## Third-Party Logging Integration

For serious applications, you'll want to send logs to external services. Cloudflare offers several approaches:

### Workers Logpush (Enterprise-ish)

Workers Logpush can send logs to destinations like:

- R2 storage
- Datadog
- New Relic
- Custom HTTP endpoints
- Google Cloud Storage[6][7]

Enable it with `logpush = true` in your wrangler config.[6]

### Third-Party Libraries

Several libraries offer seamless integration:

**Better Stack**:

```javascript
import { Logtail } from "@logtail/edge"

const logger = new Logtail(env.SOURCE_TOKEN, {
  endpoint: "https://your-endpoint"
}).withExecutionContext(ctx)

logger.info("User action", { user_id: 123, action: "purchase" })
```

**Baselime Edge Logger**:

```javascript
import { BaselimeLogger } from "@baselime/edge-logger"

const logger = new BaselimeLogger({
  ctx,
  apiKey: env.BASELIME_API_KEY,
  service: "my-service"
})

logger.info("Hello, World!", { foo: "bar" })
ctx.waitUntil(logger.flush())
```

Both libraries use `ctx.waitUntil()` internally to ensure logs are sent without blocking responses.[8][9]

## Limits and Costs You Should Know

**Free Plan**:

- 200,000 log events per day
- 3-day retention[1]

**Paid Plan**:

- 20 million included logs per month
- $0.60 per additional million logs
- 7-day retention[1]

**Technical Limits**:

- Maximum log size: 256KB (truncated if exceeded)
- 5 billion logs per account per day (1% sampling applied after limit)[1]

## Advanced Patterns for Production

### Error Context Logging

```javascript
try {
  await riskyOperation()
} catch (error) {
  console.error({
    error: error.message,
    stack: error.stack,
    request_id: crypto.randomUUID(),
    user_id: getUserId(request),
    operation: "riskyOperation",
    timestamp: Date.now()
  })
  throw error
}
```

### Request Correlation

```javascript
const requestId = crypto.randomUUID()

console.log({
  event: "request_start",
  request_id: requestId,
  method: request.method,
  url: request.url
})

// ... processing ...

console.log({
  event: "request_end",
  request_id: requestId,
  duration_ms: Date.now() - startTime,
  status: response.status
})
```

### Sampling for High-Traffic Apps

```javascript
// Only log 1% of routine operations
if (Math.random() < 0.01) {
  console.log({
    event: "routine_operation",
    details: operationDetails
  })
}

// Always log errors and important events
console.error({ error: "something broke" })
```

## The Cloudflare Way vs. Traditional Logging

Unlike traditional server applications, there's no need for complex logging libraries or file rotation. Cloudflare handles the infrastructure, storage, and basic querying. Your job is to:

1. **Log structured data** for better queryability
2. **Use appropriate log levels** for filtering
3. **Include correlation IDs** for request tracing
4. **Sample high-volume logs** to manage costs
5. **Use `ctx.waitUntil()`** for non-critical logging operations

The platform's observability features, combined with proper structured logging, give you production-grade logging with minimal setup complexity—exactly what you'd want from a serverless platform that doesn't make you babysit infrastructure.

```plaintext
[1] https://developers.cloudflare.com/workers/observability/logs/workers-logs/
[2] https://developers.cloudflare.com/workers/runtime-apis/console/
[3] https://developers.cloudflare.com/workers/runtime-apis/context/
[4] https://www.reddit.com/r/javascript/comments/3db026/do_a_lot_of_console_logging_effect_performance/
[5] https://stackoverflow.com/questions/6853566/node-js-console-log-performance
[6] https://developers.cloudflare.com/workers/observability/logs/logpush/
[7] https://www.codejam.info/2024/05/cloudflare-workers-logs-gcp-logging-logpush.html
[8] https://betterstack.com/docs/logs/cloudflare-worker/
[9] https://github.com/baselime/edge-logger
[10] https://developers.cloudflare.com/workers
[11] https://developers.cloudflare.com/workers/observability/logs/
[12] https://blog.cloudflare.com/introducing-workers-observability-logs-metrics-and-queries-all-in-one-place/
[13] https://support.conductor.com/hc/en-us/articles/34171283400211-Setting-Up-the-Cloudflare-Worker-Integration
[14] https://blog.cloudflare.com/introducing-workers-dashboard-logs/
[15] https://www.youtube.com/watch?v=SFWdpL3--rM
[16] https://developers.cloudflare.com/logs/
[17] https://github.com/maraisr/workers-logger
[18] https://developers.cloudflare.com/workers/observability/
[19] https://developers.cloudflare.com/pages/functions/debugging-and-logging/
[20] https://developers.cloudflare.com/workers/examples/logging-headers/
[21] https://developers.cloudflare.com/workers/wrangler/configuration/
[22] https://www.raymondcamden.com/2023/08/22/debugging-cloudflare-workers-with-logs
[23] https://developers.cloudflare.com/workers/observability/logs/real-time-logs/
[24] https://github.com/cloudflare/workers-honeycomb-logger
[25] https://developers.cloudflare.com/workers/runtime-apis/performance/
[26] https://developers.cloudflare.com/workers/observability/metrics-and-analytics/
[27] https://stanislas.blog/2025/02/logging-404-cloudflare-pages-website-with-worker/
[28] https://www.reddit.com/r/cscareerquestions/comments/y891c4/what_are_your_thoughts_on_logging_hours_of_your/
[29] https://blog.bitsrc.io/web-workers-a-step-by-step-guide-to-boosting-performance-with-web-workers-11307238b36e
[30] https://www.datadoghq.com/blog/cloudflare-monitoring-datadog/
[31] https://betterstack.com/community/guides/logging/logging-best-practices/
[32] https://johnelliott.org/blog/logging-from-cloudflare-workers/
[33] https://www.ibm.com/docs/en/db2/11.1?topic=performance-reducing-logging-overhead-improve-dml
[34] https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
[35] https://github.com/open-telemetry/opentelemetry-js/issues/5500
[36] https://stackoverflow.com/questions/46496153/does-logging-have-significant-overhead-even-when-it-is-off
[37] https://stackoverflow.com/questions/69795934/performance-logging-on-cloudflare-workers
[38] https://learn.microsoft.com/en-us/dotnet/core/extensions/high-performance-logging
[39] https://help.salesforce.com/s/articleView?id=001118182&language=en_US&type=1
[40] https://developers.cloudflare.com/logs/get-started/enable-destinations/third-party/
[41] https://cloudflare-docs-zh.pages.dev/workers/observability/logging/logpush/
[42] https://platform.relativity.com/RelativityOne/Content/Logging/External_Logging.htm
[43] https://www.reddit.com/r/CloudFlare/comments/1h7lh62/how_do_i_track_server_logs_on_cloudflare_pages/
[44] https://www.loggly.com/solution/remote-logging-service/
[45] https://developers.cloudflare.com/workers/examples/debugging-logs/
[46] https://github.com/pew/cloudflare-workers-logpush-elastic
[47] https://sematext.com/blog/cloud-logging-services/
[48] https://noise.getoto.net/2022/11/18/send-cloudflare-workers-logs-to-a-destination-of-your-choice-with-workers-trace-events-logpush/
[49] https://help.sap.com/docs/cloud-integration/sap-cloud-integration/external-logging
[50] https://cloudflare-docs-zh.pages.dev/workers/observability/logging/real-time-logs/
[51] https://community.home-assistant.io/t/use-an-external-logging-service-in-ha-os/289321
[52] https://developers.cloudflare.com/logs/logpush/logpush-job/enable-destinations/
[53] https://jfrog.com/help/r/jfrog-platform-administration-documentation/workers-troubleshooting-log-sample-code
[54] https://posthog.com/docs/libraries/cloudflare-workers
[55] https://www.linkedin.com/posts/fiberplane_struggling-with-complex-async-workflows-in-activity-7287891804002082816-WIli
[56] https://stackoverflow.com/questions/74463505/how-can-i-execute-code-after-sending-my-response-when-i-use-cloudflare-workers
[57] https://www.fabiofranchino.com/log/how-to-custom-cache-a-response-in-a-cloudflare-worker/
[58] https://dev.to/fiberplane/async-tasks-in-cloudflare-workers-part-2-decomposing-tasks-into-multiple-workers-1cpi
[59] https://blog.cloudflare.com/sv-se/workers-builds-integrated-ci-cd-built-on-the-workers-platform
[60] https://www.inngest.com/blog/vercel-cloudflare-wait-until
[61] https://github.com/honojs/hono/issues/1538
[62] https://www.youtube.com/watch?v=XQQUQxUeQ24
[63] https://github.com/unjs/nitro/issues/1420
[64] https://betterstack.com/docs/logs/cloudflare-http-requests/
```
