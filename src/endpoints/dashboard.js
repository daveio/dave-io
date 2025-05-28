import { OpenAPIRoute } from "chanfana";
import Parser from "rss-parser";
import { getDashboardItems } from "../kv/dashboard";
import { DashboardRouteSchema } from "../schemas/dashboard";
export class Dashboard extends OpenAPIRoute {
    // @ts-ignore - Schema validation working, type compatibility issue with external Zod definitions
    schema = DashboardRouteSchema;
    /**
     * Create a standardized dashboard response
     */
    createDashboardResponse(name, items, error = null) {
        return {
            dashboard: name,
            error,
            items,
            timestamp: Date.now()
        };
    }
    /**
     * Create a standardized error item for display
     */
    createErrorItem(message) {
        return {
            title: "Error loading data",
            subtitle: message,
            linkURL: undefined,
            imageURL: undefined
        };
    }
    async handle(c) {
        // Extract name directly from context params
        const name = c.req.param("name");
        if (!name) {
            return c.json({ error: "No dashboard name provided" }, 404);
        }
        c.env.ANALYTICS.writeDataPoint({
            blobs: ["dashboard_request", name],
            indexes: ["dashboard"]
        });
        // Execute different code paths based on dashboard name
        switch (name) {
            case "demo":
                try {
                    // Load items from KV storage
                    const items = await getDashboardItems(c.env, "demo");
                    if (!items) {
                        throw new Error("Failed to retrieve demo dashboard items");
                    }
                    return c.json(this.createDashboardResponse(name, items));
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    console.error("Error retrieving demo dashboard:", errorMessage);
                    return c.json(this.createDashboardResponse(name, [this.createErrorItem(errorMessage)]));
                }
            case "hacker-news":
                try {
                    const response = await fetch("https://news.ycombinator.com/rss");
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const feedText = await response.text();
                    const parser = new Parser();
                    const feed = await parser.parseString(feedText);
                    const items = feed.items.map((item) => ({
                        title: item.title || "No Title",
                        subtitle: item.creator || "Hacker News",
                        linkURL: item.link || "https://news.ycombinator.com"
                    }));
                    return c.json(this.createDashboardResponse(name, items));
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    return c.json({ error: `Failed to fetch Hacker News feed: ${errorMessage}` }, 500);
                }
            default:
                return c.json({ error: `Dashboard '${name}' not found` }, 404);
        }
    }
}
//# sourceMappingURL=dashboard.js.map