interface Env {
  ASSETS: {
    fetch(request: RequestInfo, init?: RequestInit): Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const userAgent = request.headers.get("user-agent") || ""
    const url = new URL(request.url)

    // Check if this is a curl or wget request
    const isCurlOrWget = userAgent.toLowerCase().includes("curl") || userAgent.toLowerCase().includes("wget")

    // Only serve shell script for the root path
    if (isCurlOrWget && (url.pathname === "/" || url.pathname === "")) {
      try {
        // Fetch the shell script file from static assets
        const scriptResponse = await env.ASSETS.fetch(`${url.origin}/scripts/hello.sh`)

        if (scriptResponse.ok) {
          const scriptContent = await scriptResponse.text()

          // Serve the script content directly
          return new Response(scriptContent, {
            headers: {
              "Content-Type": "text/x-shellscript",
              "Cache-Control": "no-cache"
            }
          })
        }
      } catch (error) {
        console.error("Error fetching script:", error)
      }

      // Fallback if script fetch fails
      return new Response(
        'echo "Error: Couldn\'t load the install script. Fetch https://dave.io/scripts/hello.sh instead."',
        {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache"
          },
          status: 302
        }
      )
    }

    // For browser requests or non-root paths, serve static assets
    return env.ASSETS.fetch(request)
  }
}
