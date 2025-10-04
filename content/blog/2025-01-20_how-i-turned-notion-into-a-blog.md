---
title: How I turned Notion into a blog
date: 2025-01-20
slug: how-i-turned-notion-into-a-blog
snippet: Notion is a versatile note-taking app that allows real-time editing, supports various formats, and offers extensive customization through templates and widgets. It can be used for blogging by organizing content in databases with different views, such as galleries. The author transitioned from other platforms to Notion for its ease of use, integrating features like Google Analytics and a comments system, while noting areas for improvement such as the lack of RSS feeds and custom fonts.
---

## A quick summary of [**Notion**](https://notion.com)

First, let's talk about what [**Notion**](https://notion.com) is and what it does.

### The short version

At its core, [**Notion**](https://notion.com) is a note-taking app with features that encourage general organisation. Editing is real-time, with edits to published or shared pages being reflected as you type.

It's not Markdown-based, but you can write using Markdown syntax which [**Notion**](https://notion.com) translates to its own primitives like three levels of headings, bullet lists, links, and more. You can also configure these with formatting menus, Markdown syntax support is just there to operate as a shorthand.

### Features

[**Notion**](https://notion.com) supports import and export of many formats, including PDF, Markdown, HTML, CSV, more application-specific formats like Word, Excel, and Powerpoint, and various online services like Google Docs, Evernote, Jira, and more.

It's intended to be a platform for you to build the tooling you need with the features you need, without the necessity to write any code (though that is an option with custom embeds).

There's a huge library of free and paid templates - the paid template economy is quite significant, and you can usually find something very close to what you want to do either for free or for a small payment. It's fairly trivial to modify a template to fit it closer to your needs, or just use it as is.

It includes [**a full-blown calendar app**](https://calendar.notion.so/) which syncs with [**Google Calendar**](https://calendar.google.com) and native [**Notion**](https://notion.com) databases. It's entirely replaced [**Google Calendar**](https://calendar.google.com) for me.

[**Notion**](https://notion.com) is particularly well-suited to creating to-do lists and habit/progress trackers, and offers many primitives to let you build it how you need it.

Data visualisation is built in if you want to run some analysis on your workspace. It's hardly Jupyter, but it does a decent enough job of generating graphs that operate on existing data and update automatically, without having to handle data exports first.

Functionality extension is done using Widgets. There are a bunch of built-in rich embeds for various sites, but custom widgets are also supported. We'll get to my choice of custom embeds, [**Apption**](https://apption.co), later.

AI features are useful without being intrusive. The two features I use the most are automatically generated and updated summaries and tags, which update as you edit a document. They have to be added with intent, there's no sneaky insertion of AI where you don't really want it.

### Publishing

[**Notion**](https://notion.com) supports publishing to the Web. You get a free [`USERNAME.notion.site`](http://USERNAME.notion.site) address with your account, or you can add custom domains for $10/mo each. Any domains you add are additive rather than replacements, so you can manage multiple sites with their own homepages if you like.

[**Google Analytics**](https://analytics.google.com) can be easily added, as well as modifying the header and colour scheme. You can also edit how your pages appear when they're rendered as previews, for example on Facebook and Twitter, as well as how search engines will present them. If you prefer, you can easily prevent search engines from indexing them which uses `robots.txt` under the hood.

Published content, like shared content, updates in real time as you type, so if you need to make changes you can know they're immediately live even if someone has already loaded the page.

### Databases

Where [**Notion**](https://notion.com) gets really interesting, however, is Databases.

Databases are very simple - they're collections of subpages. However, they can be presented in various ways, called Views. There are a few View options, including a simple table or list, a chart, a timeline, Kanban boards, and the one we'll focus on, the Gallery.

They can be their own page or they can be embedded inside another page. They can be a simple collection of pages, or each item can be an item on a to-do list or similar with attached dates, allowing them to be displayed on a timeline or as calendar events in the [**Notion Calendar**](https://calendar.notion.so/).

The important thing to take away is that they're a way of organising collections of subpages and presenting them in a particular way, including multiple presentations of the same database on the same page or different presentations of the shared database across multiple pages. It can also be filtered based on properties of the pages it contains.

A way of displaying a collection of subpages in a very flexible way? Sounds ideal for a blog. And it's what we'll end up relying on.

## How things evolved

These are the stages that [**blog.dave.io**](https://blog.dave.io) went through.

### [**Vue.js**](https://vuejs.org) with [**Nuxt**](https://nuxt.com)

I started off spending far too much time building a [**Vue.js**](https://vuejs.org) app for the blog.

[Vue.js](https://vuejs.org)

I added [**Nuxt**](https://nuxt.com) to be able to plug in features without having to develop them from scratch.

[Nuxt: The Intuitive Vue Framework](https://nuxt.com)

I deployed it, along with my other sites, to [**Cloudflare Workers**](https://developers.cloudflare.com/workers), where it pulled from [**GitHub**](https://github.com).

[Cloudflare Workers · Cloudflare Workers docs](https://developers.cloudflare.com/workers)

With the help of the [**Nuxt Content plugin**](https://content.nuxt.com/docs/getting-started), I ended up with a codebase that would read a directory of Markdown files, and apply formatting and layout to present them as blog entries along with an index listing each post.

The [**YAML front matter**](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter) defined important variables that varied with each post, and meant the only thing that had to be edited for each post was the Markdown file.

It was a good learning experience, but it was a lot of work for something that was essentially a glorified Markdown renderer.

### [**Inkdown**](https://inkdown.me)

As time passed, I got a bit annoyed at having to craft each Markdown file by hand, and looked into my options for an editor. Eventually, I came across [**Inkdown**](https://inkdown.me/).

[Inkdown – markdown editing and publishing too](https://www.inkdown.me)

It's pretty good. It's intended to do one thing well, editing Markdown files, and it does that. It also keeps images and other embeds in a `.files/` directory, which could just be copied across to the [**Vue.js**](https://vuejs.org) app and everything would work fine.

It supports its own publishing, including custom domains. It is however better suited to documentation-style content - or at least individual pieces - than a blog.

It does have its foibles, though. The biggest I came across is that the state of the files on disk and in the editor can get out of sync; it seems it renders the Markdown from its own database, and doesn't always change the on-disk version when the editor version changes. Moving the file on disk out of the workspace also doesn't remove the file from the editor workspace.

It was all a bit odd.

I could never fully get a handle on its behaviour, so I went back to the drawing board.

### [**Obsidian**](https://obsidian.md)

[**Obsidian**](https://obsidian.md) is a [**Notion**](https://notion.com) competitor. It centres more on being local-first and is built very strongly around Markdown. This made it a great option for editing posts and front matter, with the front matter presented as document properties, and operates directly on files unlike Inkdown.

[Obsidian - Sharpen your thinking](https://obsidian.md)

It's quite good, and supports publishing, but it handles images and other embedded content as files and I could never get it feeling 'clean'. Also, I was still stuck with copying the file contents across to files inside the [**Vue.js**](https://vuejs.org) app and editing them to suit what it expected.

### And finally, [**Notion**](https://notion.com)

I'd already been using [**Notion**](https://notion.com) for personal organisation and project management, and I'd needed to get a handle on the publishing system recently to share certain documents with an undefined audience. Running [**Obsidian**](https://obsidian.md) in parallel felt a bit redundant, so I came to the conclusion of using [**Notion**](https://notion.com) for all of it and running exports, then using the exported files in the [**Vue.js**](https://vuejs.org) app. It worked, but it still used a manual step.

[Your connected workspace for wiki, docs & projects | Notion](https://notion.com)

One loss from [**Obsidian**](https://obsidian.md) was the support for front matter as document properties, but it was easy enough to create as a pre-formatted text area and then copy its contents into front matter as part of the publishing process.

Suddenly, though, it struck me that maybe all that exporting, copying, and editing was unnecessary. Perhaps I could just use [**Notion**](https://notion.com) for all of it. The Gallery view of a database would work well for a blog; it wouldn't be amazing, but it would certainly do the job. I just had to see if I could make it serviceable and sustainable.

## Getting set up

With that, it's time to get the site going.

### Moving everything to [**Notion**](https://notion.com)

To start off, I got exports together of all my content in Markdown format along with all the images for each post. This got me a good starting point where everything was standardised.

Then I created a new [**Notion**](https://notion.com) database for the blog, and ran a [**Notion**](https://notion.com) import of the Markdown files with their linked images. As part of the import, [**Notion**](https://notion.com) embedded the images in the new pages. I could then ditch the files, as everything was inside [**Notion**](https://notion.com) now.

To this database, I added a couple of new properties.

The first was `Published`. This was a Select comprising two options: **Yes** and **No**. Automation was configured to initialise it to **No** when a page was created.

The second was `Published Date`. This was a date field. I configured automation to set it to today's date when a page was created. It remained freely editable, this just ensured that it was valid and not empty by default.

I set the default view to Gallery, set the sort order to `Published Date` descending, set the filter to `Published = Yes`, and published this database as the root of a new site, [**blog.dave.io**](https://blog.dave.io).

I added the DNS `CNAME` and `TXT` records required by [Notion](https://notion.com) Then I checked everything was rendering properly and [Notion](https://notion.com) saw the site as ready.

> If you use [**Cloudflare**](https://cloudflare.com), leave proxying **off** while you set things up. Once [**Notion**](https://notion.com) has validated the domain and it appears ready in the [**Notion**](https://notion.com) custom domain configuration, you can switch proxying **on**.
>
> This is because proxying changes the value returned for the `CNAME`. It doesn't affect the `TXT` record. It might work anyway, but leaving proxying **off** while you set things up makes absolutely certain that when [**Notion**](https://notion.com) checks, it gets the values it's expecting for both records.

I configured the site settings for [**blog.dave.io**](https://blog.dave.io), adding [**Google Analytics**](https://analytics.google.com), disabling the [**Notion**](https://notion.com) logo and the **Duplicate as Template** button, enabling **dark mode**, and configuring the search engine preview text.

Because the site is configured as a single database, the settings configured here will apply to all subpages by default. They can of course be edited for each page individually; what that translates to in practical terms is editing the search engine preview and URL path for each subpage.

### Setting up comments

[**Notion**](https://notion.com) has support for comments, but they're unsuitable for a blog. They require being logged in with a [**Notion**](https://notion.com) account which most users won't have. I'd need to integrate some form of third-party comments system.

The first thing I thought of was [**Disqus**](https://disqus.com) which is essentially 'comments as a service'. It's an excellent choice for static sites which don't otherwise have the ability to implement dynamic comments, and has a huge feature set and set of moderation tools.

[#1 in audience engagement and community growth | Disqus](https://disqus.com)

I set up the [**Disqus**](https://disqus.com) code as a custom [**Apption**](https://apption.co) embed for each post, and defined `this.page.identifier` for each embed.

It worked, but I ran into some annoyances. The biggest issue was that the [**Disqus**](https://disqus.com) CSS didn't play nice with [**Notion**](https://notion.com), and all text was rendering as the default `serif` font (usually Times New Roman or similar). This was pretty ugly, and created the impression that it wasn't going to work properly, which would impair the number of people who might leave comments.

It was also unfortunate that I had to create a separate embed for each post, duplicating the code, as [**Notion**](https://notion.com) has no support for variables in embeds beyond the embed URL itself.

Then I noticed that [**Apption**](https://apption.co) had its own comment system.

[Apption - Notion friendly Embeddable Widget Apps](https://apption.co)

This persuaded me to pay for [**Apption**](https://apption.co) service, which came in at $40 per year. I thought this was pretty reasonable given the level of utility it was offering me, but that's a conclusion you'll have to come to for yourself if you try to implement this.

It's extremely basic, and still requires creating independent comment-type embeds for each post, but didn't suffer from any of the other hassles that [**Disqus**](https://disqus.com) did.

I attached comment embeds to each of the pages, and comments were up and running. You can see it in action at the bottom of this post.

### Managing posts

Along with the blog itself, I also created a private page embedding the blog database. The reason for this is that while the blog interface lists posts, by default it only lists posts where `Published` is set to `Yes`. In order to write posts and manage my queue, I'd need to be able to see all posts regardless of `Published` status.

Because it was an independent page, I could configure the view to be in **Table** mode, and ignore the `Published` field, without affecting the main view of the blog.

An important consequence of this is that non-published posts **are not private**. It's possible to disable the filter on the main page and list all the posts. For my purposes, I'm not overly concerned by this, as there's nothing sensitive in unpublished posts, and gives me the ability to easily share drafts. If, however, that's an issue for you, then you'll need to do something like set up a separate database for non-published posts and shuttle them between databases to publish and unpublish them.

I also added a **Notes** section to the top of each post. I use this to hold sources, links, information, images, and bullet-point skeletons of what I'm going write about. I remove this before setting `Published` to `Yes` and going live with the post.

### Bringing in AI

While [**Notion AI**](https://www.notion.com/product/ai) isn't at all forced on you, I did find it useful.

First, I added a `Summary` field to the database, and configured [**Notion AI**](https://www.notion.com/product/ai) in **summary** mode to fill it out and update it as the contents of the post changed. I set it to display on the database main page (the list of posts) to provide a quick summary of the post for browsing's sake.

I also added a `Topics` field, also set to display on the list of posts, which uses [**Notion AI**](https://www.notion.com/product/ai) in **keywords** mode to flesh out the summary in an easily skimmed way. It's also useful for SEO, as it often includes terms which aren't mentioned in the post itself, but are key to the content. Like `Summary`, it's set to update itself as the post's content is edited.

I also display both on the post itself too, mostly for SEO reasons.

### Making it look good

While it would be possible to get exciting with the design by using a page with an embedded database as the main page, I chose to use the database itself with a **Gallery** view.

I added some short attribution text as the `Description` of the database, displayed below the database title.

I then enabled all the properties on the post list page except for `Published`. The same set of properties is used on the posts themselves, with `Published` hidden but revealable.

I configured the post list to display the cover image for the post rather than the beginnnings of the post text. The `Summary` provides an idea of what the post is about, and it looks better to have the post tiles centre around an image.

## It's not perfect

There are improvements I'd like to make over time.

### There's no RSS feed

While RSS isn't extensively used these days, it's something that I really would rather have for the few people who might use it.

A custom embed doesn't seem likely to help, due to the way RSS works.

I think the most likely solution is going to be some offsite code, for which I have my personal API, `api.dave.io`. This is a **TypeScript** app running on [**Cloudflare Workers**](https://developers.cloudflare.com/workers) and it operates as a backend for a few things, including retrieving redirect URIs for my URL shortener, `go.dave.io`, and generating Bluesky feeds for `feeds.dave.io` _(still under development)_.

I haven't looked into it yet, but my hopes are that it's possible to use the [**Notion API**](https://developers.notion.com) to fetch details of the published posts, at which point it wouldn't be hard to then generate valid RSS XML.

It would be easy enough to set up a custom route for the API endpoint, for example to have the RSS feed available at something like `blog.dave.io/rss.xml`.

If that works, the final hurdle is whether I can add a `<link>` tag using a [**Cloudflare**](https://cloudflare.com) rule, and have browsers respect it. This can't be done with a custom embed as the tag goes in the `<head>` section, which is inaccessible inside [**Notion**](https://notion.com). This is one of the reasons for switching [**Cloudflare**](https://cloudflare.com) proxying back **on** in the setup process.

If I can't get it working, it's not a huge loss; as I say, RSS is underused these days. But it'd be nice to have one for the sake of completeness.

### The comments system is very basic

The [**Apption**](https://apption.co) comments system does the job, but it's as barebones as it gets.

It may be that there's a better way to implement [**Disqus**](https://disqus.com) which doesn't suffer from the problems I've experienced so far. If I find a way of bringing it in cleanly, that solves the problem; [**Disqus**](https://disqus.com) is very fully-featured.

If not, though, the only solution might be a custom implementation on `api.dave.io`. If I'm generating custom embeds fully from scratch, that might solve the [**Disqus**](https://disqus.com) embedding issues.

If that doesn't work, it'll have to be a reimplementation of a comments system on `api.dave.io`.

This would be fairly significant effort, and I might just choose to stick with the basic [**Apption**](https://apption.co) comments.

### Internal properties like `Published` are visible in view filters

The view filter on the posts list page filters out posts where `Published` is set to anything but `Yes`. Since we're presenting the database as the home page, though, this view filter can be changed to show unpublished posts.

One approach to this would be to use entirely separate databases for published and unpublished posts, then move them between databases to publish and unpublish them.

This would, however, increase the complexity of the private post management page, though not by an enormous degree. We'd also have to ensure that the same properties were present on both databases.

The conclusion I've come to about this is that I'm happy with things as they are. There's nothing sensitive in unpublished posts - in that situation it could be noted on the private post management page.

### The only analytics we can use are Google Analytics

[**Notion**](https://notion.com) only supports [**Google Analytics**](https://analytics.google.com) on its pages.

It might be possible to embed other analytics solutions with custom embeds, or add them at the [**Cloudflare**](https://cloudflare.com) stage with page rules.

I'm happy, for now, leaving it with [**Google Analytics**](https://analytics.google.com). I also get some data through [**Cloudflare**](https://cloudflare.com). Between the two of them that's plenty of data, and fundamentally the only thing I really want to pay attention to are traffic sources and number of hits by post.

### We can't use custom fonts

[**Notion**](https://notion.com) has no support for custom fonts.

There may be ways around this, including custom embeds and [**Cloudflare**](https://cloudflare.com) page rules, but hacking the [**Notion**](https://notion.com) CSS runs the risk of breaking unexpected things is unexpected ways, and would be nigh on impossible to test for in any complete manner.

Fundamentally though this is a minor thing. I'd like to prettify things with some custom fonts, but the posts are eminently readable with things how they are now.

## And that's your lot

Hopefully this post has given you an idea on how I did things, and perhaps helps if you want to do something similar.

If you do, I'm more than happy to take a look and give you my thoughts - just [**drop me an email**](mailto:dave@dave.io) and we can talk.
