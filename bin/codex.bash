#!/bin/bash

# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://mise.run | /bin/bash || true
# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://get.trunk.io | /bin/bash || true

export PATH="${HOME}/.local/bin"

find ~ -iname mise -executable || true
find ~ -iname trunk -executable || true

mise trust --yes
mise install --yes

bun install --trust

bun generate
