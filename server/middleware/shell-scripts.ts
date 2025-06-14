import { getHeader, setHeader } from "h3"

// Shell script content for curl/wget requests - the proper Dave Williams business card
const helloScript = `#!/bin/sh

run_bun() {
	printf '%s\n' "🐰 Running with bun."
	exec bun x dave.io
}

run_deno() {
	printf '%s\n' "🦕 Running with deno."
	exec deno run -A npm:dave.io < /dev/null
}

run_pnpm() {
	printf '%s\n' "📦 Running with pnpm."
	exec pnpm dlx dave.io
}

run_npx() {
	printf '%s\n' "💻 Running with npx."
	exec npx dave.io
}

run_docker() {
	printf '%s\n' "🐳 Running with Docker."
	exec docker run --rm -t -e TERM=xterm-256color ghcr.io/daveio/npm:latest
}

run_fallback() {
	printf '%s\n' "🚫 No runtime found (tried bun, deno, pnpm, npx, docker)."
	cat <<'EOF'

          ╔═══════════════════════════════════════╗
          ║                                       ║
          ║      Dave Williams (v1.0.2)           ║
          ║                                       ║
          ╚═══════════════════════════════════════╝

🚀 Weapons-grade DevOps engineer, developer, and tinkerer 🚀

             🌐 Web  https://dave.io

         🦋 Bluesky  https://dave.io/go/bluesky
      📓 Dreamwidth  https://dave.io/go/dreamwidth
        📘 Facebook  https://dave.io/go/facebook
          🐙 GitHub  https://dave.io/go/github
       📷 Instagram  https://dave.io/go/instagram
        🔗 LinkedIn  https://dave.io/go/linkedin
        🐘 Mastodon  https://dave.io/go/mastodon
      🔮 Pillowfort  https://dave.io/go/pillowfort
         🧵 Threads  https://dave.io/go/threads
          📱 Tumblr  https://dave.io/go/tumblr
         🎥 YouTube  https://dave.io/go/youtube
         ☠️ Twitter  We don't use Twitter any more.

 💼 Check out my CV  https://dave.io/go/cv
  🧩 Give me a TODO  https://dave.io/go/todo
 🎤 Enjoy this talk  https://dave.io/go/wat
 🦜 Read this story  https://dave.io/go/blit
EOF
}

if command -v bun > /dev/null 2>&1; then
	run_bun
elif command -v deno > /dev/null 2>&1; then
	run_deno
elif command -v pnpm > /dev/null 2>&1; then
	run_pnpm
elif command -v npx > /dev/null 2>&1; then
	run_npx
elif command -v docker > /dev/null 2>&1; then
	run_docker
else
	run_fallback
fi`

// Middleware to detect curl/wget requests and serve shell script for root path
export default defineEventHandler(async (event) => {
  const userAgent = getHeader(event, "user-agent") || ""
  const requestUrl = event.node.req.url || "/"
  const url = new URL(requestUrl, "http://localhost")

  // Check if this is a curl or wget request
  const isCurlOrWget = userAgent.toLowerCase().includes("curl") || userAgent.toLowerCase().includes("wget")

  // Only serve shell script for the root path (not /api/ or /go/ paths)
  if (isCurlOrWget && (url.pathname === "/" || url.pathname === "")) {
    setHeader(event, "Content-Type", "text/x-shellscript")
    setHeader(event, "Cache-Control", "no-cache")
    return helloScript
  }
})
