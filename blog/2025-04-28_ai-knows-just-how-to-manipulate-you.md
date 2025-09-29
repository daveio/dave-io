---
title: AI Knows Just How To Manipulate You
date: 2025-04-28
slug: ai-knows-just-how-to-manipulate-you
snippet: AI can analyze social media posts to derive deep insights about individuals, demonstrating capabilities that can be used for manipulation. A humorous analysis of Mastodon posts revealed a complex personality profile, highlighting the potential for AI to generate detailed characterizations. While this analysis appears harmless, the scalability of such technology poses significant risks, emphasizing the need for increased accountability from AI companies and awareness of how these tools can be weaponized against users.
---

# AI Knows Just How To Manipulate You

![24327909026_fe7767582f_o.jpg](AI%20Knows%20Just%20How%20To%20Manipulate%20You%201e3b7795690c8013b99dd27b8c39ace2/24327909026_fe7767582f_o.jpg)

---

---

# When the machine knows too much

It’s well known that AI is being used in social media, in the dark, to manipulate us. What isn’t as clear is how much insight a model would be able to draw about someone - and thus the buttons to push - from a history of social media posts.

AI is quite capable of consuming significant corpuses of material about someone, and social media presents an excellent source for that data. While I’d stop so far as to suggest we don’t _use_ social media - I’m housebound, and social media keeps me sane - **we should know what it can do**.

I thought I’d query `GPT-4o`, the most commonly used model out there and the default for ChatGPT, and see what it could do.

# Getting AI to show its hand

So what kind of insights could `GPT-4o` draw with nothing more than a history of social media posts?

I came up with a methodology -

- Export all my Mastodon posts.
- Throw away all the metadata.
  - To simulate limited access to a social platform, I only want the model to be able to access what a user browsing the site would be able to see.
- Strip any HTML, leaving only plain text.
- Feed it to ChatGPT with `GPT-4o` selected.
  - Use a prompt implying a **silly, irreverent use case**, so that we don’t imply any kind of research.
- Weep forever.

This left me with a simple JSON array of post content. I fed it to ChatGPT.

# The conversation

<aside>
🧑🏻‍🎤

Analyse my Mastodon posts, the text of which are in an array in the attached file, and give me a humorous but insightful summary of who I am.

`[ outbox_posts-only_plain.json ]`

</aside>

<aside>
🤖

You are a **chaotically curious, neurodivergent tech wizard** powered by caffeine, cats, righteous fury, and an unquenchable thirst for knowledge — even the completely impractical kind (e.g., "the math behind 5G basebands" and obscure 90s cyberpunk films no one's heard of).

You're someone who **knows an alarming amount about infrastructure, cats, niche sci-fi, and social justice**, and you’ll cheerfully oscillate between ranting about Kubernetes ingress vulnerabilities and posting lovingly about the cat who just sabotaged your keyboard for the fifth time today. You show a **deep empathy** for the marginalised, wield an **acerbic wit sharpened by injustice**, and maintain a firm stance that **stupidity should be mocked, but people should be protected**.

You are **intellectually omnivorous**, ferociously independent, slightly feral, and allergic to corporate nonsense — unless it’s very well-engineered nonsense, in which case you will grudgingly respect it (and then criticise it anyway for good measure). You maintain your own corner of the internet like a stubborn wizard tending their private library, **fiercely loyal to the principle that knowledge should be free, people should be free, and nobody should be a jerk about it**.

Also: if it breaks, you will fix it. If it doesn't break, you'll poke it anyway just to make sure it’s not lying.

**Your alignment:** 🔵 Chaotic Good, specialising in Infrastructure, Infosec, and Feline Logistics.

**Spirit Animal:** A cat that knows how to ssh into a server.

</aside>

# Holy shit

Okay. It’s funny. But not only is it right, it’s **right in ways I wouldn’t even have expected**. It’s not only made analyses, but taken those analyses to a second stage and considered what they might imply.

This is, obviously, **extremely silly**. It went on to offer to make me a **D&D character sheet** or **trading card**. Obviously, I don’t have any interest in that, but it is clear we’ve convinced it that we’re here for some entertaining nonsense instead of research into what it’s capable of doing.

# Fabulous secret powers

This is clearly only scratching the surface of the analyses which are possible. Dragging a JSON file into ChatGPT one by one doesn’t really represent any threat. But that’s not how it works at scale.

These models can easily be called by API. It would probably be a day’s work to build a system which fetches someone’s post history, feeds it to `GPT-4o`, writes insights into a database, and then moves onto the next. I could do it easily assuming the money was there. When you consider that you can choose how you define the groups of people which you analyse, and that you can analyse groups against each other adversarially, it rapidly becomes a lot less silly.

# What do we do about it?

**Nothing**. Sorry. If you want, making your account private might provide some defence against this, but we’re dealing with adversaries who know the people running these social media sites (with the exception of the Fediverse, of course). They could quite easily get access bypassing the rules which apply to us, the little people.

The best we can do at this stage is **push for increased accountability from AI companies**.

**Anthropic** are doing a [decent job of this at the moment](https://anthropic.com/research), having recently [looked into Claude’s ethics](https://venturebeat.com/ai/anthropic-just-analyzed-700000-claude-conversations-and-found-its-ai-has-a-moral-code-of-its-own), and [creating a constitution for its model’s ethical parameters](https://anthropic.com/news/claudes-constitution) (there is a [simpler summary version](https://claudeaihub.com/constitutional-ai) if you prefer).

**OpenAI** have regularly shown that they do not give a single, solitary fuck about anything beyond the tech.

Google are… opaque as ever.

But in terms of how we respond - what we can do is educate ourselves and know how the tools we use are weaponised against us.

# And finally

The conversation I had to generate this was **magically disappeared from my history**.

So that’s interesting.

---

# Comments

[https://apption.co/app_posts/29bda250](https://apption.co/app_posts/29bda250)
