CREATE TABLE IF NOT EXISTS `redirects` (
	`slug` text PRIMARY KEY NOT NULL,
	`destination` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `redirects_slug_unique` ON `redirects` (`slug`);
