#!/bin/bash

curl -fsSL https://mise.run | sh || true
curl -fsSL https://get.trunk.io | sh || true

export PATH="${HOME}/.local/bin:${HOME}/.mise/bin:${PATH}"

find ~ -iname mise -executable || true
find ~ -iname trunk -executable || true

# mise trust
# mise install
# bun install
# bun build (or similar)
