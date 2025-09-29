---
title: Good Times in the Shell
date: 2025-04-11
slug: good-times-in-the-shell
snippet: The author shares a collection of useful shell tools and functions, emphasizing the advantages of the fish shell over bash and zsh. Key tools include the fisher plugin manager, tide prompt, and various shell functions for convenience, alongside standalone utilities like ai-shell, atuin, and direnv. The document also highlights customization options for themes and provides a mise configuration for syncing tools across machines.
---

# Good Times in the Shell

![shell.jpg](Good%20Times%20in%20the%20Shell%201a2b7795690c80f28d17e8c525c3a81b/shell.jpg)

---

---

# Life in the Shell

Over time, I’ve built up a collection of tools which make my life easier in the shell. I’m constantly exploring and trying new tools, most of which get ditched fairly rapidly, but there are some which have survived the perpetual cull.

I’d like to share a few of them with you. You won’t find all of these useful in the same way that I do, but there might be some which are new to you and have some value.

# Which shell?

Many of the tools I’ll mention are shell-agnostic, meaning that they don’t care which shell you’re using. The shell functions later in this piece are intended for https://github.com/fish-shell/fish-shell and in most cases will not work directly in `bash` or `zsh`.

I am a big proponent of `fish`. It’s not nothing that the syntax differs from what you might be more familiar with, but I like the changes.

One example is the following -

## `bash` / `zsh`

```bash
while true
do
	echo "hello"
done

if true
then
	echo "hello"
fi

export FOO=BAR

export PATH=$PATH:/path/to/bin

```

## `fish`

```bash
while true
	echo "hello"              # note lack of 'do/done'
end

if true
	echo "hello"              # note lack of 'do/done'
end

set -Ux FOO BAR             # 'universal', persists forever
                            # saved in ~/.config/fish/fish_variables
                            # editing this file by hand is allowed
                            # changes are reflected immediately

set -gx FOO BAR             # 'global', persists only in this shell
                            # session

set -lx FOO BAR             # 'local', persists only in this shell
                            # session, with only local scope

# remove -x from any of the above `set` commands to not export an env
# variable, only make the variable available to fish

fish_add_path /path/to/bin  # edits $fish_user_paths, persists forever (scope U)
                            # equivalent to set -Uax fish_user_paths /path/to/bin
                            # fish variables can be arrays, -a appends to it
```

There is of course more, but this is just an example of how the syntax feels more mature.

Autosuggestions and syntax highlighting come out of the box on `fish`, whereas you need a third-party plugin on `bash` or `zsh`.

I’ll admit that if you disregard the syntax changes, you can implement pretty much anything you get on `fish` with `zsh`, using plugins. I can understand using either. I don’t see any compelling reason to ever use `bash`.

# Prompt

I use https://github.com/IlanCosman/tide and adore it. It’s beautiful and asynchronous so it won’t slow you down.

![CleanShot 2025-04-23 at 11.57.56@2x.png](Good%20Times%20in%20the%20Shell%201a2b7795690c80f28d17e8c525c3a81b/CleanShot_2025-04-23_at_11.57.562x.png)

It will be installed in the list of plugins below, starting its config routine when you install the plugins with `fisher update`. See below.

# Shell Plugins

The https://github.com/jorgebucaran/fisher plugin manager is a must-have. It does what it does quietly and without any hassle.

Here is my `~/.config/fish/fish_plugins` —

```bash
# Plugin manager
jorgebucaran/fisher            # Plugin manager. Allows it to self-update.

# Plugins
franciscolourenco/done         # Notify when long processes finish
gazorby/fish-abbreviation-tips # Remind about available abbreviations
gazorby/fish-git-emojis        # Aliases to use Gitmoji and Conventional Commits
ilancosman/tide@v6             # Absolutely amazing fish prompt
jorgebucaran/replay.fish       # Run Bash commands replaying changes in Fish
jorgebucaran/spark.fish        # Generate sparklines in Fish
joseluisq/gitnow               # Git aliases and keybindings
laughedelic/pisces             # Match pairs of characters automatically
meaningful-ooo/sponge          # Removes commands that fail from your history
nickeb96/puffer-fish           # Speed up directory navigation
oh-my-fish/plugin-foreign-env  # Wrap bash/zsh syntax into fish
oh-my-fish/plugin-osx          # macOS utility commands
wfxr/forgit                    # Git utilities - requires fzf!

```

When you’ve installed `fisher` and created this file, just run `fisher update` to get set up. If you’ve added https://github.com/IlanCosman/tide then its configuration routine will also start at this point.

# Shell Functions

These are a few functions I use for convenience. They might be useful, or they might not, but here they are anyway.

## Make `fzf` pretty

```bash
function fzf --wraps="fzf"
    set -Ux FZF_DEFAULT_OPTS "
	--color=fg:#908caa,bg:#191724,hl:#ebbcba
	--color=fg+:#e0def4,bg+:#26233a,hl+:#ebbcba
	--color=border:#403d52,header:#31748f,gutter:#191724
	--color=spinner:#f6c177,info:#9ccfd8
	--color=pointer:#c4a7e7,marker:#eb6f92,prompt:#908caa
	"
    command fzf
end
```

## Get a GitHub authentication token

```bash
function github-auth
    set -gx GITHUB_TOKEN (gh auth token)
end
```

## Clean up `opencommit` when it hangs

Much as I love `opencommit`, if the change is too big, it will hang instead of realising it’s over the token limit and failing. I use this function to clean it up when that happens.

```bash
function kill-oco
    echo "Searching for Node.js processes containing 'oco'..."
    set pids (ps aux | grep -i "[n]odejs.*oco\|[n]ode.*oco" | awk '{print $2}')
    if test (count $pids) -eq 0
        echo "No matching 'oco' processes found."
        return 0
    end
    echo Found (count $pids) "process(es) to kill:"
    for pid in $pids
        set process_info (ps -p $pid -o command= | string sub -l 50)
        echo "PID $pid: $process_info..."
    end
    read -l -P "Kill these processes? [y/N] " confirm
    if test "$confirm" = y -o "$confirm" = Y
        for pid in $pids
            echo "Killing process $pid..."
            kill -9 $pid

            # Check if process was successfully killed
            if kill -0 $pid 2>/dev/null
                echo "Failed to kill process $pid!"
            else
                echo "Process $pid successfully terminated."
            end
        end
        echo "All matching 'oco' processes have been terminated."
    else
        echo "Operation canceled. No processes were killed."
    end
end
```

## Wipe all workflow runs for a GitHub repository

```bash
function wipe-workflows -d "Wipe all workflow runs for a GitHub repository"
    set -lx REPONAME $argv[1]
    echo "Wiping all workflow runs for $REPONAME..."
    for i in (gh api --paginate "/repos/$REPONAME/actions/runs" | jq '.workflow_runs.[].id')
        echo $i
        gh api --silent -X DELETE /repos/$REPONAME/actions/runs/$i
    end
end
```

## Fetch and pull all git repositories in a directory

```bash
function yank-all
    for i in *
        echo "$i"
        cd $i
        echo fetch
        git fetch --all --tags --prune --jobs=8 --recurse-submodules=yes
        echo pull
        git pull --stat --tags --prune --jobs=8 --recurse-submodules=yes
        echo out
        cd ..
    end
end
```

## Queue PRs with `trunk`

```bash
function queue-prs
    for i in *
        cd $i
        gh pr list | awk '{print $1}' | while read line
            trunk merge $line
        end
        cd ..
    end
end
```

# Shell Theme

I change my theme all the time.

Currently I’m a fan of Monokai, using the excellent https://monokai.pro/ in my editor.

This sets `fish` up to match.

```bash
# monokai theme
set fish_color_command F92672 # the color for commands
set fish_color_comment 75715E # the color used for code comments
set fish_color_cwd 66D9EF # the color used for the current working directory in the default prompt
set fish_color_end F8F8F2 # the color for process separators like ';' and '&'
set fish_color_error F8F8F2 --background=F92672 # the color used to highlight potential errors
set fish_color_escape 66D9EF # the color used to highlight character escapes like '\n' and '\x70'
set fish_color_match F8F8F2 # the color used to highlight matching parenthesis
set fish_color_normal F8F8F2 # the default color
set fish_color_operator AE81FF # the color for parameter expansion operators like '*' and '~'
set fish_color_param A6E22E # the color for regular command parameters
set fish_color_quote E6DB74 # the color for quoted blocks of text
set fish_color_redirection AE81FF # the color for IO redirections
set fish_color_search_match --background=49483E # the color used to highlight history search matches
set fish_pager_color_completion 75715E # the color of the completion itself
set fish_pager_color_description 49483E # the color of the completion description
set fish_pager_color_prefix F8F8F2 # the color of the prefix string, i.e. the string that is to be completed
set fish_pager_color_progress F8F8F2 # the color of the progress bar at the bottom left corner
set fish_pager_color_secondary F8F8F2 # the background color of the every second completion
```

# Standalone Utilities

From here on, we’re dealing with stuff that doesn’t really care which shell you use. If they have shell integration, generally it works for `bash`, `zsh`, and `fish`.

They’re sorted alphabetically rather than in any meaningful order.

## `ai-shell` https://github.com/BuilderIO/ai-shell

I use https://github.com/gnachman/iTerm2 as my terminal, after having tried Warp and generally enjoying it. However, I missed how `iTerm2` does things. I was missing the AI integration Warp offers - `iTerm2` has it but it’s not as nicely integrated - so I went looking for an alternative option. https://github.com/BuilderIO/ai-shell is that.

Simple workflow. Invoke it, feed it a textual description of what you’re trying to do, out comes a shell command to take care of it. Great for complex bits of logic that you just want to get done without thinking too hard about it.

## `atuin` https://github.com/atuinsh/atuin

Oh, https://github.com/atuinsh/atuin, how I love thee. Its primary purpose is to sync your shell history between machines, and it does that very well. It also offers a simple synced key-value store and dotfile and script management, but I don’t use those.

## `bat` https://github.com/sharkdp/bat

It’s `cat`, but pretty! Smart enough to detect whether you’re trying to output to a terminal, and add syntax highlighting, line numbers, and file headers, or whether it’s being used in a pipe in which case it operates exactly the same as `cat`.

## `chezmoi` https://github.com/twpayne/chezmoi

The One True Dotfile Manager. Provides a bulletproof system for syncing dotfiles to a Git repository, and thus syncing them between machines. Supports various forms of encryption for sensitive dotfiles, including `sops` and `age`.

## `direnv` https://github.com/direnv/direnv

Simple environment management. Applies variable changes defined in `.env` files and removes them when you leave the directory in question. Simple, bulletproof, immensely useful. Plays nice with `fish`.

## `eza` https://github.com/eza-community/eza

Replacement for `ls`. You can pretty much alias `ls` to it and never look back. Faster, more flexible, better featured.

## `fzf` https://github.com/junegunn/fzf

A very important building block for other tools. Provides a user interface to select options from a list - that’s all. It can be - and is - used in interesting ways by other tools. Should be installed even if you never invoke it by hand.

## `lefthook` https://github.com/evilmartians/lefthook

One of many Git hook managers, this one is just my choice. If I’m not using `trunk` in a repository (which has its own hook management) this does the job nicely.

## `mise` https://github.com/jdx/mise

Absolutely key to my workflow. Version manager, environment manager, task runner. Using `mise` and `chezmoi` makes it really easy to sync my toolset between machines. It can handle language-specific packaging systems, as well as `ubi` to simply fetch GitHub release binaries.

## `opencommit` https://github.com/di-sukharev/opencommit

I don’t know the last time I actually wrote a Git commit message. Uses an AI model to generate your commit message and pretty much always gets it right. Supports Gitmoji and Conventional Commits.

## `pik` https://github.com/jacek-kurlit/pik

Simple process killer. When you just want to nuke something and don’t want to think about it too much, `pik` is here to help.

## `ripgrep` https://github.com/BurntSushi/ripgrep

It’s `grep` but specifically designed for codebases, and much faster because of it. Ignores things that you probably don’t want to be searching.

## `shadowenv` https://github.com/Shopify/shadowenv

When `direnv` is too simple, there’s `shadowenv`. Uses a LISP config file and you can do some pretty interesting things with its logic.

## `tlm` https://github.com/yusufcanb/tlm

Same idea as https://github.com/BuilderIO/ai-shell but using a locally-running model. Uses https://github.com/ollama/ollama to manage models, and allows you to turn free text into shell commands.

## `xc` https://github.com/joerdav/xc

Task runner, notable for using [`README.md`](http://README.md) as its configuration file so that your documentation becomes your task runner config. I use `mise` for task management much more commonly, but generally I include the task specifications in `xc`'s format so it can be used too.

## `zellij` https://github.com/zellij-org/zellij

We all love `tmux`, but `zellij` is `tmux` on steroids. More batteries included, easier to configure, generally more flexible.

## `zoxide` https://github.com/ajeetdsouza/zoxide

Directory jumper. Keeps track of all the directories you enter. When you want to go back into a directory, execute `z SEARCHTEXT` and you’ll `cd` into the most recently used directory matching `SEARCHTEXT`.

# More!

There are so many more utilities I use, but I’m going to leave that for another post. If you want to skip the wait and explore yourself, here’s my https://github.com/jdx/mise config file which you can use to install pretty much everything I use.

I’ve split it into two sections because Notion disables syntax highlighting over 10k characters. They should be combined into `~/.config/mise/config.toml`.

## Mise settings

```toml
[env]
EDITOR = 'code --wait'
MISE_ACTIVE = 'true'

[settings]
activate_aggressive = true
all_compile = true
auto_install = true
color = true
env_file = '.env'
experimental = true
gix = true
jobs = 4
libgit2 = true
not_found_auto_install = true
profile = 'main'
shorthands_file = '~/.config/mise/shorthands.toml'
status = { show_env = true, show_tools = true, missing_tools = 'always' }
task_run_auto_install = true
use_versions_host = true
verbose = false

[settings.aqua]
cosign = true
minisign = true
slsa = true

[settings.cargo]
binstall = true

[settings.node]
gpg_verify = true

[settings.npm]
bun = true

[settings.pipx]
uvx = true

[settings.python]
# uv_venv_auto = true
venv_auto_create = true

[settings.sops]
age_key_file = '~/.sops.key'
rops = true

[settings.swift]
gpg_verify = true
```

## Mise tools

```toml
[tools]
'aqua:arl/gitmux' = { version = 'latest' }
'aqua:atuinsh/atuin' = { version = 'latest' }
'aqua:jacek-kurlit/pik' = { version = 'latest' }
'aqua:WebAssembly/binaryen' = { version = 'latest' }
'cargo:bat' = { version = 'latest' }
'cargo:binsider' = { version = 'latest' }
'cargo:cargo-cache' = { version = 'latest' }
'cargo:cargo-edit' = { version = 'latest' }
'cargo:cargo-generate' = { version = 'latest' }
'cargo:cargo-outdated' = { version = 'latest' }
'cargo:cargo-release' = { version = 'latest' }
'cargo:cargo-tree' = { version = 'latest' }
'cargo:cargo-update' = { version = 'latest' }
'cargo:cargo-watch' = { version = 'latest' }
'cargo:ducker' = { version = 'latest' }
'cargo:fast-conventional' = { version = 'latest' }
'cargo:fd-find' = { version = 'latest' }
'cargo:git-absorb' = { version = 'latest' }
'cargo:git-brws' = { version = 'latest' }
'cargo:git-delta' = { version = 'latest' }
'cargo:gitnr' = { version = 'latest' }
'cargo:gitoxide' = { version = 'latest' }
'cargo:gitui' = { version = 'latest' }
'cargo:hgrep' = { version = 'latest' }
'cargo:hyperfine' = { version = 'latest' }
'cargo:just' = { version = 'latest' }
'cargo:localtunnel' = { version = 'latest' }
'cargo:mdbook' = { version = 'latest' }
'cargo:openapi-tui' = { version = 'latest' }
'cargo:rage' = { version = 'latest' }
'cargo:ripgrep' = { version = 'latest' }
'cargo:rops-cli' = { version = 'latest' }
'cargo:sd' = { version = 'latest' }
'cargo:tokei' = { version = 'latest' }
'cargo:wasm-bindgen-cli' = { version = 'latest' }
'cargo:xsv' = { version = 'latest' }
'dotnet:dotnet-dump' = { version = 'latest' }
'dotnet:Microsoft.CST.DevSkim.CLI' = { version = 'latest' }
'gem:bundler' = { version = 'latest' }
'gem:cocoapods' = { version = 'latest' }
'gem:foreman' = { version = 'latest' }
'gem:httparty' = { version = 'latest' }
'gem:notion-task' = { version = 'latest' }
'gem:rails' = { version = 'latest' }
'gem:rubocop' = { version = 'latest' }
'gem:rubocop-rspec' = { version = 'latest' }
'gem:rubyfmt' = { version = 'latest' }
'gem:solargraph' = { version = 'latest' }
'gem:standard' = { version = 'latest' }
'gem:syntax_tree' = { version = 'latest' }
'gem:yard' = { version = 'latest' }
'go:github.com/adleong/tapshark' = { version = 'latest' }
'go:github.com/caddyserver/xcaddy/cmd/xcaddy' = { version = 'latest' }
'go:github.com/evilmartians/lefthook' = { version = 'latest' }
'go:github.com/go-acme/lego/v4/cmd/lego' = { version = 'latest' }
'go:github.com/google/gops' = { version = 'latest' }
'go:github.com/goreleaser/goreleaser/v2' = { version = 'latest' }
'go:github.com/jesseduffield/lazygit' = { version = 'latest' }
'go:github.com/maaslalani/nap' = { version = 'latest' }
'go:github.com/nsf/gocode' = { version = 'latest' }
'go:github.com/schollz/croc/v10' = { version = 'latest' }
'go:github.com/sigstore/cosign/v2/cmd/cosign' = { version = 'latest' }
'go:github.com/theupdateframework/go-tuf/cmd/tuf-client' = { version = 'latest' }
'go:github.com/UpCloudLtd/upcloud-cli/v3/...' = { version = 'latest' }
'go:github.com/yusufcanb/tlm' = { version = 'latest' }
'go:sigs.k8s.io/kind' = { version = 'latest' }
'npm:@anthropic-ai/claude-code' = { version = 'latest' }
'npm:@builder.io/ai-shell' = { version = 'latest' }
'npm:@johnlindquist/file-forge' = { version = 'latest' }
'npm:@prettier/plugin-php' = { version = 'latest' }
'npm:@prettier/plugin-pug' = { version = 'latest' }
'npm:@prettier/plugin-ruby' = { version = 'latest' }
'npm:@prettier/plugin-xml' = { version = 'latest' }
'npm:degit' = { version = 'latest' }
'npm:firebase-tools' = { version = 'latest' }
'npm:fish-lsp' = { version = 'latest' }
'npm:genaiscript' = { version = 'latest' }
'npm:http-server' = { version = 'latest' }
'npm:husky' = { version = 'latest' }
'npm:localtunnel' = { version = 'latest' }
'npm:opencommit' = { version = 'latest' }
'npm:prettier' = { version = 'latest' }
'npm:prettier-plugin-astro' = { version = 'latest' }
'npm:prettier-plugin-erb' = { version = 'latest' }
'npm:prettier-plugin-go-template' = { version = 'latest' }
'npm:prettier-plugin-java' = { version = 'latest' }
'npm:prettier-plugin-jinja-template' = { version = 'latest' }
'npm:prettier-plugin-nginx' = { version = 'latest' }
'npm:prettier-plugin-properties' = { version = 'latest' }
'npm:prettier-plugin-rust' = { version = 'latest' }
'npm:prettier-plugin-sh' = { version = 'latest' }
'npm:prettier-plugin-svelte' = { version = 'latest' }
'npm:prettier-plugin-toml' = { version = 'latest' }
'npm:vsce' = { version = 'latest' }
'npm:wrangler' = { version = 'latest' }
'pipx:aerleon' = { version = 'latest' }
'pipx:asitop' = { version = 'latest' }
'pipx:autopep8' = { version = 'latest' }
'pipx:black' = { version = 'latest' }
'pipx:bpython' = { version = 'latest', uvx_args = '--with urwid' }
'pipx:bpytop' = { version = 'latest' }
'pipx:braindrop' = { version = 'latest' }
'pipx:flake8' = { version = 'latest' }
'pipx:git+https://github.com/itsnexn/raindropcli.git' = { version = 'latest', extras = 'requests' }
'pipx:httpie' = { version = 'latest' }
'pipx:ipython' = { version = 'latest' }
'pipx:isort' = { version = 'latest' }
'pipx:jc' = { version = 'latest' }
'pipx:jupyterlab' = { version = 'latest', uvx_args = '--with PySide6 --with jupyter-pieces --with jupyter_base16_theme --with jupyterlab-horizon-theme --with matplotlib --with scipy' }
'pipx:legit' = { version = 'latest' }
'pipx:markitdown' = { version = 'latest' }
'pipx:mypy' = { version = 'latest' }
'pipx:nyx' = { version = 'latest' }
'pipx:pelican' = { version = 'latest' }
'pipx:pipenv' = { version = 'latest' }
'pipx:pre-commit' = { version = 'latest' }
'pipx:pygi' = { version = 'latest' }
'pipx:pylint' = { version = 'latest' }
'pipx:pyoxidizer' = { version = 'latest' }
'pipx:pyright' = { version = 'latest' }
'pipx:remarshal' = { version = 'latest' }
'pipx:rmate' = { version = 'latest' }
'pipx:sherlock-project' = { version = 'latest' }
'pipx:showcert' = { version = 'latest' }
'pipx:shyaml' = { version = 'latest' }
'pipx:sourcery' = { version = 'latest' }
'pipx:sshclick' = { version = 'latest' }
'pipx:thefuck' = { version = 'latest' }
'pipx:tidal-dl-ng' = { version = 'latest', extras = 'gui' }
'pipx:toml-sort' = { version = 'latest' }
'pipx:virtualfish' = { version = 'latest' }
'pipx:xonsh' = { version = 'latest' }
'pipx:yamale' = { version = 'latest' }
'pipx:yamllint' = { version = 'latest' }
'pipx:yt-dlp' = { version = 'latest' }
'ubi:danielfoehrKn/kubeswitch' = { version = 'latest', exe = 'switcher' }
'ubi:gitkraken/gk-cli' = { version = 'latest', exe = 'gk' }
'ubi:marwanhawari/ppath' = { version = 'latest', exe = 'ppath' }
'ubi:Shopify/shadowenv' = { version = 'latest', exe = 'shadowenv' }
'ubi:termkit/gama' = { version = 'latest', exe = 'gama' }
'ubi:unfrl/dug' = { version = 'latest', exe = 'dug' }
'ubi:wader/fq' = { version = 'latest', exe = 'fq' }
act = { version = 'latest' }
age = { version = 'latest' }
aqua = { version = 'latest' }
bun = { version = 'latest' }
caddy = { version = 'latest' }
cargo-binstall = { version = 'latest' }
checkov = { version = 'latest' }
chezmoi = { version = 'latest' }
cocoapods = { version = 'latest' }
cosign = { version = 'latest' }
crystal = { version = 'latest' }
deno = { version = 'latest' }
direnv = { version = 'latest' }
dotnet = { version = 'latest' }
draft = { version = 'latest' }
envsubst = { version = 'latest' }
esc = { version = 'latest' }
eza = { version = 'latest' }
flutter = { version = 'latest' }
fzf = { version = 'latest' }
gcloud = { version = 'latest' }
gh = { version = 'latest' }
glooctl = { version = 'latest' }
go = { version = 'latest' }
helix = { version = 'latest' }
helm = { version = 'latest' }
hk = { version = 'latest' }
k9s = { version = 'latest' }
krew = { version = 'latest' }
kubectl = { version = 'latest' }
lazydocker = { version = 'latest' }
linkerd = { version = 'latest' }
lua = { version = 'latest' }
minikube = { version = 'latest' }
minisign = { version = 'latest' }
neovim = { version = 'latest' }
node = { version = 'latest' }
npm = { version = 'latest' }
perl = { version = 'latest' }
pipx = { version = 'latest' }
pkl = { version = 'latest' }
pnpm = { version = 'latest' }
poetry = { version = 'latest' }
pulumi = { version = 'latest' }
python = { version = 'latest' }
redis = { version = 'latest' }
ruby = { version = 'latest' }
rust = { version = 'latest', profile = 'default', targets = 'wasm32-wasip1,wasm32-wasip1-threads,wasm32-wasip2,wasm32-unknown-emscripten,wasm32-unknown-unknown', components = 'rustc,cargo,rustfmt,rust-std,rust-docs,rust-analyzer,clippy,rust-src,llvm-tools,rustc-dev' }
slsa-verifier = { version = 'latest' }
snyk = { version = 'latest' }
sops = { version = 'latest' }
terraform = { version = 'latest' }
tflint = { version = 'latest' }
tfsec = { version = 'latest' }
tmux = { version = 'latest' }
uv = { version = 'latest' }
vultr = { version = 'latest' }
watchexec = { version = 'latest' }
websocat = { version = 'latest' }
wtfutil = { version = 'latest' }
xc = { version = 'latest' }
xh = { version = 'latest' }
yarn = { version = 'latest' }
yq = { version = 'latest' }
zellij = { version = 'latest' }
zig = { version = 'latest' }
zls = { version = 'latest' }
zoxide = { version = 'latest' }

```

---

# Comments

[https://apption.co/app_posts/c860f115](https://apption.co/app_posts/c860f115)
