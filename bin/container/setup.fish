#!env fish

curl -fsSL https://get.trunk.io | sh
curl -fsSL https://mise.run | sh

mise trust
mise install

bun install
bun run reset
