#\!/bin/sh

run_bun() {
	echo "🐰 Running with bun."
	exec bun x dave.io
}

run_deno() {
	echo "🦕 Running with deno."
	exec deno run -A npm:dave.io </dev/null
}

run_pnpm() {
	echo "📦 Running with pnpm."
	exec pnpm dlx dave.io
}

run_npx() {
	echo "💻 Running with npx."
	exec npx dave.io
}

run_docker() {
	echo "🐳 Running with Docker."
	exec docker run --rm -t -e TERM=xterm-256color ghcr.io/daveio/npm:latest
}

run_fallback() {
	echo "🚫 No runtime found (tried bun, deno, pnpm, npx, docker)."
	cat <<'EOT'

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
EOT
}

if command -v bun >/dev/null 2>&1; then
	run_bun
elif command -v deno >/dev/null 2>&1; then
	run_deno
elif command -v pnpm >/dev/null 2>&1; then
	run_pnpm
elif command -v npx >/dev/null 2>&1; then
	run_npx
elif command -v docker >/dev/null 2>&1; then
	run_docker
else
	run_fallback
fi
EOF < /dev/null