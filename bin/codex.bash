#!/bin/bash

# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://mise.run | /bin/bash || true
# trunk-ignore(semgrep/bash.curl.security.curl-pipe-bash.curl-pipe-bash)
curl -fsSL https://get.trunk.io | /bin/bash || true

# trunk-ignore(shellcheck/SC2016)
echo 'export PATH="${HOME}/.local/bin"' >>~/.bashrc
# trunk-ignore(shellcheck/SC2016)
echo 'eval "$(mise activate bash)"' >>~/.bashrc

# trunk-ignore(shellcheck/SC1090)
source ~/.bashrc

mise trust --yes
mise install --yes

bun install --trust

bun generate
