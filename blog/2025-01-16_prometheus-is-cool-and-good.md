---
title: Prometheus is Cool and Good
date: 2025-01-16
slug: prometheus-is-cool-and-good
snippet: Prometheus is a distributed monitoring system designed for containerized environments, offering a unified approach to metrics collection, alerting, and data storage. It consists of components like the Prometheus Server, Push Gateway, Alert Manager, and Exporters, each handling specific tasks. Prometheus simplifies monitoring by dynamically discovering targets and providing a basic web UI, while third-party tools like Grafana enhance data visualization and dashboard creation.
---

# Prometheus is Cool and Good

![](https://images.unsplash.com/photo-1643218850012-b3a9792c8dea?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb)

---

or, **_Monitoring Your Junk In The Age Of Containers_**
or, **_Keeping Your Good Zeus-Fearing Liver Away From Those Pesky Eagles_**

---

---

# Welcome to the New World

So you're probably here because you're running a ~~mature and stable~~ old and busted monitoring solution, you've heard all the cool kids talking about their Pokeymans and their Amojis and their shiny new ✨**Cloud Native✨** infra tooling. You're thinking that you spent all that time migrating from virtualisation to containerisation, so you should probably deal with your monitoring tech debt too.

This is a good idea. While you _can_ monitor a containerised estate with a more traditional solution like Nagios or Zabbix, it's a pain, and you'll spend hours writing and refining the configuration manually.

# Enter Prometheus

Unlike Nagios or Zabbix, Prometheus is a distributed system, made up of various independent components with their own binary. It's not quite as distributed as a microservice pattern, but you can see how it was designed when we were _on the way_ to microservices.

Each component has its own concerns, and in theory could be replaced with compatible alternatives without the other components needing to worry or even know about it.

The various components are written in Go, which is a very accessible systems programming language, but most notably produces static binaries which don't have any external library dependencies. This makes them ideal candidates for containerisation.

# The big difference

A traditional monitoring system - again, thinking of examples like Nagios and Zabbix - does all of this in one application. It needs to provide, all on the same machine (and generally in the same process)

- a method of configuring what metrics to gather, where the targets are, and when to alert
- functionality for gathering those metrics, usually through plugins or scripts
- a TSDB (time-series database) or other log of what happened, and when
- functionality for sending alerts, again through plugins or scripts
- a user interface, be it just for observing status (Nagios) or for full-fledged operation (Zabbix)

Prometheus splits these concerns up.

# The Prometheus components

![The Prometheus distributed system. Click to embiggen. Components which are part of Prometheus proper are in red, and have the Prometheus logo at the top right.](Prometheus%20is%20Cool%20and%20Good%20ec212ad2a01e45dd92b9edf6e1ca4aa6/prom.png)

The Prometheus distributed system. Click to embiggen. Components which are part of Prometheus proper are in red, and have the Prometheus logo at the top right.

## Prometheus Server

The core of the system is the Prometheus Server. This is essentially a TSDB, with functionality to pull targets and metrics, push alerts, and accept and respond to queries to the TSDB.

The big difference is that instead of an array of plugins and scripts for checks and alerts, it performs each task **a single, unified way**.

For metric fetches, that means an outbound HTTP request to an endpoint (usually `/metrics`) on one or more **Exporters** or **Push Gateways**.

The important backing storage for the system is attached to the **Prometheus Server** instance, and it is responsible for storing historical data for later query.

The **Prometheus Server** also maintains a list of targets (ie `/metrics` endpoints). It can obtain these through various means, most commonly via calls to the Kubernetes orchestration API to read labels and annotations on running workloads, a simple file which may be human- or machine-generated, or even (rarely) command-line parameters. This dynamic discovery system reduces the need for constant human reconfiguration - because the **Prometheus Server** only needs to know where to fetch metrics and has a single method of doing so, automatic discovery of new targets is possible.

## Push Gateway

In some situations, you need something you're monitoring to _push_ metrics to the monitoring system instead of having the monitoring system pull them. An example might be a batch job, where you want to know about job successes and failures.

The **Prometheus Server** only knows how to pull metrics, so the **Push Gateway** exists for situations like this.

Jobs make an HTTP call to the **Push Gateway** when they want to send a metric (in the case of a batch process, that would be events like "job started", maybe milestones throughout the job or details of any branching logic, and "job finished" with success or failure.

The **Push Gateway** then makes these metrics available on its own `/metrics` endpoint for the **Prometheus Server** to pull them.

Use of the **Push Gateway** should be treated as a last resort, and only used in situations where scraping metrics directly is entirely unsuitable.

## Alert Manager

Any good monitoring system needs to be able to send alerts when things go wrong. The **Alert Manager** provides a unified API for the **Prometheus Server** to use to send alerts, and handles getting those alerts sent out via various communication channels. It's also capable of deduplicating, grouping, and selectively routing the alerts.

Importantly, the configuration for the **Alert Manager** does not include the alert thresholds themselves. They're configured on the **Prometheus Server**, as part of the configuration discovery process.

## Web UI

Prometheus also includes a first-party web UI, allowing PromQL queries to be issued and the results returned. It's extremely basic but it's good enough to check that metrics are coming in properly.

![The Web UI is extremely basic, but does the job in a pinch.](Prometheus%20is%20Cool%20and%20Good%20ec212ad2a01e45dd92b9edf6e1ca4aa6/Untitled.png)

The Web UI is extremely basic, but does the job in a pinch.

It's best replaced with something like **Grafana**, which we'll get to shortly.

# Third-party components

## Exporters

Exporters have one job - collect metrics from the system they're an Exporter for (for example, the MySQL Exporter will know how to collect MySQL metrics but nothing else), then make those metrics available via HTTP on the `/metrics` endpoint we mentioned earlier. Multiple Exporters will commonly run on the same host or in multiple sidecar containers. Each Exporter has a defined port, and a list is maintained to avoid clashes.

The Prometheus project maintains a range of Exporters, and third parties produce many more.

You can check out the port database - and thus get an idea of the breadth of Exporters out there - at [https://github.com/prometheus/prometheus/wiki/Default-port-allocations](https://github.com/prometheus/prometheus/wiki/Default-port-allocations)

There is another category of Exporter, one which operates independently and does not interact with anything local. These might be used to pull metrics from a SaaS API, and make them available to Prometheus.

The end result is that the **Prometheus Server** doesn't have to care about how the metrics were fetched - just where to send HTTP requests.

**Exporters** are easy to write, and can be written in any language, but are particularly easy to write using Go. To see quite how simple they can be, you can check out one I wrote at [https://github.com/daveio/aaisp-exporter](https://github.com/daveio/aaisp-exporter) which is fully functional in under 200 lines of Go.

## Grafana

[**Grafana**](https://grafana.com/) is a third-party tool by Grafana Labs. It's a data visualisation platform, which includes first-class support for Prometheus as a data source, among others.

![Grafana makes it easy to build attractive, real-time dashboards using the data from Prometheus.](Prometheus%20is%20Cool%20and%20Good%20ec212ad2a01e45dd92b9edf6e1ca4aa6/Untitled%201.png)

Grafana makes it easy to build attractive, real-time dashboards using the data from Prometheus.

It can be run on-premises for free, or hosted by Grafana Labs. The hosted service includes a free tier with fairly impressive limits for a free tier (10,000 time series, 50GB logs).

It includes its own implementation of alerting, separate from the **Alert Manager**. You can use either or both of them, as they're independent of each other.

Even though it's a third-party tool, many consider it a must-have part of any Prometheus deployment.

---

# Comments

[https://apption.co/app_posts/b32a3ab7](https://apption.co/app_posts/b32a3ab7)
