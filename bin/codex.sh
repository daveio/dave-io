#!/bin/sh

curl -fsSL https://mise.run | sh
curl -fsSL https://get.trunk.io | sh

export PATH="${HOME}/.local/bin:${HOME}/.mise/bin:${PATH}"

find ~ -iname mise -executable
find ~ -iname trunk -executable

# mise trust
# mise install
# bun install
# bun build (or similar)
