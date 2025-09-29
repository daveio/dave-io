---
title: Getting Started with Meshtastic
date: 2025-01-14
slug: getting-started-with-meshtastic
snippet: Meshtastic is a project utilizing LoRa technology to send short text messages over long distances with low-powered hardware. Recommended nodes include the Heltec V3 for affordability, the LILYGO T-Deck Plus for a fully loaded option, and the LILYGO T-Watch S3 as a wearable device. In the US, the frequency is 915 MHz, while in the UK and EU, 868 MHz is preferred. Users should start with the default "LongFast" modulation for optimal connectivity.
---

## What is Meshtastic?

Meshtastic is a really exciting project which uses LoRa to send short text messages (and metadata) extremely long distances with incredibly low-powered and tiny hardware.

"Tiny" should get your attention there. Yes, that means small antennas. The Heltec V3 has an integrated antenna which is just a length of wire, about 5-6cm long. In terms of range, I'm in regular contact with nodes 70 miles away.

![meshtastic-map.jpg](/images/blog/2025-01-14_getting-started-with-meshtastic/meshtastic-map.jpg)

That range grows enormously as soon as you throw a decent matched antenna its way. It really is pretty nuts.

## Let's talk LoRa

The technology which powers Meshtastic is known as LoRa. Through a bit of RF magic called chirp spread-spectrum, it is said to be detectable and readable _even below the noise floor_ . On a spectrum analyser, it looks like this.

![lora-modulation.jpg](/images/blog/2025-01-14_getting-started-with-meshtastic/lora-modulation.jpg)

A symbol can be a 'chirp up', frequency going from low to high - or 'chirp down', frequency going from high to low, as well as phase modulation. Link Labs has a decent writeup of how it works which pushes their hardware pretty hard. Still, it's a decent summary of the tech and RF mechanics behind LoRa, and includes a highly technical video if you want to really get your hands dirty.

## Getting started

You'll need a node. There are many options, but there are three that I'd recommend.

### Heltec V3

![meshtastic-heltec.jpg](/images/blog/2025-01-14_getting-started-with-meshtastic/meshtastic-heltec.jpg)

The Heltec V3 is dirt cheap and has far better RF performance than it has any right to. You can pick one up on Amazon UK for £27. It might be a clone - I'm not certain - but it'll do the job just as well. It has a small OLED display, but you're going to do most of your interacting with it using the mobile app, desktop app, or Web interface anyway.

### LILYGO T-Deck Plus

![meshtastic-tdeckplus.jpg](/images/blog/2025-01-14_getting-started-with-meshtastic/meshtastic-tdeckplus.jpg)

The T-Deck Plus is the 'fully loaded' turnkey option. It's a LILYGO T-Deck - essentially a large display and repurposed Blackberry keyboard - with GPS, battery, and a case. The real selling point of the T-Deck Plus is that you can use it without having to rely on a companion app, though that is still an option if you prefer. It's available directly from LILYGO . Don't bother paying extra for the Meshtastic firmware, you can flash it yourself.

### LILYGO T-Watch S3

![meshtastic-twatch.jpg](/images/blog/2025-01-14_getting-started-with-meshtastic/meshtastic-twatch.jpg)

This is the wildcard of the bunch. A fully functional Meshtastic node in a watch, with case and battery. It's a good second device, and the display is large enough to read messages on, but you'll need a companion app to send them. It too is available directly from LILYGO .

## Frequency and Modulation

In the US, it's easy; everyone's on 915 MHz. In the UK, and the EU, you have to choose between 433 MHz and 868 MHz.

I'll save you some trouble; forget about 433 MHz. Everyone is on 868 MHz in the UK. Don't bother buying one of each band, just stick with 868 MHz.

Meshtastic allows you to pick your modulation. It defaults to "LongFast", or "long range, fast modulation". Stick with this.

There's some talk about moving to MediumFast, but in my experience very few people have actually moved to it. Maybe give MediumFast a try to see if you can see anyone, but you're going to get the most people on LongFast.

## Let rip

Once you're online, just leave your device out and wait to see which nodes you pick up. Maybe drop a message to the main shared channel to see if anyone receives it.

Have fun!
