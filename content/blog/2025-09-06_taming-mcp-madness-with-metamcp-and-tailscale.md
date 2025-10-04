---
title: Taming MCP Madness with MetaMCP and Tailscale
date: 2025-09-06
slug: taming-mcp-madness-with-metamcp-and-tailscale
snippet: MetaMCP is a tool designed to simplify the configuration of multiple development tools, acting as an aggregator for MCP management. It requires PostgreSQL and can be deployed using Docker, with options for local or remote instances. Tailscale enhances accessibility by securely managing network connections, offering features like Tailscale Serve for HTTPS and Tailscale Funnel for broader internet exposure. MetaMCP allows for organized management of numerous tools through namespaces, and supports various communication protocols, including Streamable HTTP and OpenAPI. While still in development, it shows promise in alleviating configuration complexities for developers.
---

## Death by a Thousand Configurations

You're a modern developer, which means you've got more development tools than a Victorian surgeon had bloodletting instruments. Cursor here, Visual Studio Code there, Claude Desktop lurking in the corner, and Goose doing... whatever it is Goose does. I've never quite figured it out. In any case, each one needs its own MCP configuration, and suddenly you're spending more time configuring tools than actually using them.

It's rather like having to repeat your symptoms to every person long the phone chain to the doctor. Exhausting, repetitive, and frankly beneath us all.

## The Unlikely Hero

[https://github.com/metatool-ai/metamcp](https://github.com/metatool-ai/metamcp)

MetaMCP wasn't supposed to be the solution to our collective configuration nightmare. It's a MCP aggregator with debug facilities, and it's far too early in its development to be what I'd call production-ready. But much like how I use my ESD tweezers for everything except handling delicate components, MetaMCP turns out to do the job just fine.

Think of it as the Switzerland of MCP management - neutral territory where all your tools can peacefully coexist.

## Docker to the Rescue

Setting up MetaMCP requires PostgreSQL, because of course it does. Fortunately, they've provided a Docker Compose file, turning deployment into IKEA furniture - theoretically straightforward, occasionally baffling, but ultimately functional.

You've got options for your Docker host:

- **Docker Desktop**: The official choice. Runs anywhere a GUI does. Might be a hot mess, but it won't get in your way. Has its own MCP platform, but it doesn't compare to MetaMCP.
- **Orb Stack**: macOS only, but less bloated, with interesting designs on virtualisation too. You'll have to make minor adjustments (for example `docker compose` instead of `docker-compose`).
- **A remote Docker instance:** if you've got a NAS handy, that's a great choice as long as you can get Tailscale running on it (with access to the Tailscale CLI to set up `serve` or `funnel`) . I can tell you that this is possible with QNAP devices, because that's what I use.
- **Kubernetes:** godspeed, you YAML-wielding maniac. You might be able to generate initial objects from the Docker Compose file, but it'll take some tinkering.

Pick your poison. The big takeaway, really, is that if you use a remote instance of some sort, you might have to do some massaging later.

My recommendation: when you're starting out exploring this, deploy locally. You can always get interesting once you've seen how it all fits together.

## Ports and Protocols

MetaMCP listens on port 12008 via HTTP, which is perfectly adequate if you're keeping things local.

But what if you want to access your MCPs from other machines? What if your NAS is hosting the party, and your laptop wants an invite?

## Behold! Tailscale

This is where Tailscale enters, stage left, wearing a nifty cape and promising to solve all your networking woes. I used to be a ZeroTier devotee, but I've recently converted (in most part) to the Church of Tailscale, and it hasn't let me down yet.

"_In most part_"? Yeah. There's one _very specific_ use case where ZeroTier can't be beat, and that's SD-WAN on Mikrotik routers. ZeroTier is a first-class citizen there.

While you _can_ integrate Tailscale on beefier Mikrotiks by using the container system, it feels like a hack. This is because it's a hack.

_Tailscale. Darlings. Cozy up with Mikrotik. Maybe they've got a contract with ZeroTier, in which case there's nothing much to be done, but if they **could** integrate Tailscale - even as an optional package - I'd be overjoyed._

### Tailscale Serve: The Sensible Option

Tailscale Serve is superb. It takes your plain HTTP port and wraps it in TLS like a security blanket. It'll even provision a TLS certificate for your Tailscale Magic DNS hostname, because who has time to faff about with Let's Encrypt?

[Tailscale Serve](https://tailscale.com/kb/1312/serve)

The HTTPS endpoint on your Magic DNS hostname is then available **only inside your Tailnet**. You're not exposing it to the world.

It even sets some headers which you _could_ consume to use Tailscale to authenticate requests, if for example you're using Device Sharing to share your endpoint with another Tailnet (which _does_ work with `tailscale serve`).

Tailscale are thinking about providing OAuth claims as well. We'll get to that later.

I use port `9443` for my deployment. To start this tunnel:

```bash
tailscale serve --bg --https 9443 12008
```

The `--bg` parameter makes the Tailscale CLI terminate and keep the tunnel up, otherwise it stays up only while the command is running. This configuration will survive reboots until you run `tailscale serve reset` to remove it.

### Tailscale Funnel: YOLO Mode For Your Data

If you're feeling particularly adventurous (or reckless, depending on your perspective), you can use Tailscale Funnel to expose your MetaMCP to the entire internet.

[Tailscale Funnel](https://tailscale.com/kb/1223/funnel)

You can only use three ports:

- **`443`**: The traditional HTTPS port
- **`8443`** & **`10000`**: When you want to feel special

By default, it's like leaving your front door open with a sign saying "Free MCPs Inside" - technically possible, but ten minutes after you do it, you will weep. If you do it, for the love of God, avail yourself of the per-endpoint authentication options and use strong credentials for the web UI.

Remember that your MCPs generally authenticate to any backend involved themselves. If someone has access to call the tools on your MCPs, they can use those credentials without having to know them.

That, as you might imagine, would be \*bad**\*.**

## Organisation for the Overwhelmed

Here's where MetaMCP gets properly clever. You can configure all your MCPs - hundreds of the buggers if you're so inclined - and then create namespaces with subsets of them. It's like having a massive toolbox but only bringing the relevant tools to each job.

You might create:

- A **General** namespace, with limited everyday tools.
- A **Kitchen Sink** namespace, for applications like Claude Code which can handle the kind of numbers of tools which are objectively _too many tools._
- Specific namespaces for different projects or workflows.

You can then assign each namespace its own endpoint. Depending on the endpoint you configure in your host, you control which tools it sees. Brilliant.

## The Numbers Game

Not all applications are created equal when it comes to handling large numbers of tools:

- **Visual Studio Code**: Copilot will immediately fail if it's provided more than 128 tools for a request.
- **Cursor**: Gets grumpy much earlier, around 40 tools, but that seems to be a soft limit designed to make best use of a model's context window.
- **Claude Code**: Can handle virtually anything you throw at it. I have a theory that it has a stage where it decides which tools might be useful for a task before starting that task, but that's conjecture.

## The Flavours of HTTP

MetaMCP provides a few options for each endpoint.

### Streamable HTTP

Streamable HTTP is the new hotness. This modern protocol lets your tools chat back and forth in real-time through unconventional handling of standard requests. It supports full-duplex communication which means lower latency and snappier responses. Most trendy MCP clients have jumped on this bandwagon, though your crusty old network infrastructure might throw a wobbly trying to keep up; it can be difficult with older proxies which want to buffer the connection.

### SSE

Deprecated, but refuses to die. Server-Sent Events (SSE) is the workhorse that refuses to be put out to pasture. Your client opens a persistent unidirectional server-to-client connection, then `POST`s requests over another more traditional channel. Not quite as clever as its younger sibling, but it plays nicely with virtually everything by virtue of being a special and unique snowflake, including those ancient proxies and overzealous firewalls your IT department insists on keeping around. MetaMCP's implementation even handles reconnections automatically, saving you from the tedium of error handling.

### OpenAPI (with Schema)

MetaMCP claims that its OpenAPI implementation exists to serve [**Open WebUI**](https://openwebui.com). Which is fine. This is an unusual choice for an MCP aggregator otherwise, but quite a cool one. It makes its tools available over a standard REST API, with a full (generated) schema. Unless you're using [**Open WebUI**](https://openwebui.com) specifically, you probably won't use this, but it provides extreme flexibility in terms of how you might consume its tools.

## When Your Host Is Really Crusty

Not every host supports HTTP MCPs, even with `SSE`. Many older or smaller hosts will only talk `STDIO`, where they fire up a process, yell at `STDIN`, and hope that something useful comes back from `STDOUT`.

MetaMCP doesn't speak `STDIO` directly. Fortunately, you can use the `mcp-remote` npm package to proxy everything through `STDIO`.

Just run:

```bash
npx -y mcp-remote <your-url-here>
```

You can send custom headers with arguments. Check out [**the `mcp-remote` README**](https://www.npmjs.com/package/mcp-remote) for details.

## Concessions to Security

The MetaMCP web UI uses a username and password (and also OIDC). Boring, fine, does the job, not the point. Things get more interesting when you look at the MCP endpoints themselves.

### API Keys

You can provision static API keys which are provided as `Bearer` tokens with the `Authorization` header. Simple, easy, does the job, but to my knowledge MetaMCP doesn't offer an API which you could use to provision these tokens, leaving you to configure them through the UI. Or get creative and set up some kind of middleware which validates alternative tokens and uses the real token to hit the MCPs; bit of a hack.

### OAuth

MetaMCP's GUI authentication can be configured to use OIDC. Then, each endpoint supports an "OAuth" option for token authorisation.

I haven't been able to get this to work. It's marked beta and seems to be so new that it's not documented. I have high hopes about this one, though.

I've been talking to a Tailscale bigwig who mentions they're thinking about how they might support OIDC through their automatic authentication (currently using the custom headers we spoke about previously).

If this happens, and if MetaMCP's OAuth implementation matures in the direction I expect, it may become possible to let Tailscale handle the authentication flow; if you talk to MetaMCP via Tailscale, authenticated MCP endpoints might 'just work'.

Even if not, middleware may offer this ability. Strictly speaking, you could use middleware to accept the current custom headers set by `tailscale serve`. But middleware, too, is under active development.

Currently, you have to configure it by editing JSON in the database directly. It's a faff and a half. Yet again, MetaMCP proves very cool, but less than production-ready.

This is all a little way off, if it even happens. But it's an impressive possibility.

## The Bottom Line

MetaMCP might not be quite production-ready, but it's a very impressive platform. Sometimes the best solutions are the crackpot ones. It's turned my configuration nightmare into something almost manageable, which in the world of developer tooling is practically a miracle.

Now, if you'll excuse me, I need to go and add another seventeen MCPs to my setup. I'm not done until Claude can make the coffee.
