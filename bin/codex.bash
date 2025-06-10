#!/bin/bash

# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://mise.run | /bin/bash || true
# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://get.trunk.io | /bin/bash || true

export PATH="${HOME}/.local/bin" # consider mise shims if we have trouble

find ~ -iname mise -executable || true
find ~ -iname trunk -executable || true

# trunk-ignore(shellcheck/SC2016)
echo 'eval "$(mise activate bash)"' >>~/.bashrc
eval "$(mise activate bash)" || true

mise trust --yes
mise install --yes

bun install --trust

bun generate
