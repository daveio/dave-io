package main

import (
	"fmt"
	"html"
	"io"
	"net/http"
	"strings"
	"syscall/js" // trunk-ignore(golangci-lint2/typecheck)
	"time"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
	catppuccin "github.com/catppuccin/go"
)

// Config holds application configuration
type Config struct {
	RequestTimeout time.Duration
	MaxContentSize int64
	UserAgent      string
}

// LoadConfig returns default configuration for WASM
func LoadConfig() *Config {
	return &Config{
		RequestTimeout: 30 * time.Second,
		MaxContentSize: 10 * 1024 * 1024, // 10MB
		UserAgent:      "Go-Reader/1.0 (+https://github.com/your-username/go-reader)",
	}
}

// processURL fetches and processes a URL, returning readable HTML
func processURL(targetURL string) (string, error) {
	config := LoadConfig()

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: config.RequestTimeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return fmt.Errorf("too many redirects")
			}
			if len(via) > 0 {
				req.Header.Set("User-Agent", via[0].Header.Get("User-Agent"))
				req.Header.Set("Accept", via[0].Header.Get("Accept"))
				req.Header.Set("Accept-Language", via[0].Header.Get("Accept-Language"))
			}
			return nil
		},
	}

	// Create request with headers
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("User-Agent", config.UserAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("DNT", "1")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")

	// Fetch the webpage
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP error: %d %s", resp.StatusCode, http.StatusText(resp.StatusCode))
	}

	// Check content length
	if resp.ContentLength > config.MaxContentSize {
		return "", fmt.Errorf("content too large: %d bytes (max: %d)", resp.ContentLength, config.MaxContentSize)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	// Handle character encoding
	htmlContent := string(body)
	if !utf8.Valid(body) {
		htmlContent = strings.ToValidUTF8(string(body), "")
	}

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %v", err)
	}

	// Extract metadata
	title := extractTitle(doc)
	author := extractAuthor(doc)
	publishDate := extractPublishDate(doc)
	description := extractDescription(doc)

	// Clean document
	cleanDocument(doc)

	// Extract content
	contentHTML := extractMainContent(doc)

	// Generate readable page
	result := generateReadablePage(title, contentHTML, targetURL, author, publishDate, description)
	return result, nil
}

// extractTitle extracts the page title
func extractTitle(doc *goquery.Document) string {
	titleSources := []string{
		"meta[property='og:title']",
		"meta[name='twitter:title']",
		"h1",
		"title",
	}

	for _, selector := range titleSources {
		if title := doc.Find(selector).First().AttrOr("content", ""); title != "" {
			return strings.TrimSpace(title)
		}
		if title := doc.Find(selector).First().Text(); title != "" {
			return strings.TrimSpace(title)
		}
	}
	return "Untitled"
}

// extractAuthor extracts author information
func extractAuthor(doc *goquery.Document) string {
	authorSelectors := []string{
		"meta[name='author']",
		"meta[property='article:author']",
		".author",
		".byline",
		"[rel='author']",
	}

	for _, selector := range authorSelectors {
		if author := doc.Find(selector).First().AttrOr("content", ""); author != "" {
			return strings.TrimSpace(author)
		}
		if author := doc.Find(selector).First().Text(); author != "" {
			return strings.TrimSpace(author)
		}
	}
	return ""
}

// extractPublishDate extracts publication date
func extractPublishDate(doc *goquery.Document) string {
	dateSelectors := []string{
		"meta[property='article:published_time']",
		"meta[name='date']",
		"time[datetime]",
		".date",
		".published",
	}

	for _, selector := range dateSelectors {
		if date := doc.Find(selector).First().AttrOr("content", ""); date != "" {
			return strings.TrimSpace(date)
		}
		if date := doc.Find(selector).First().AttrOr("datetime", ""); date != "" {
			return strings.TrimSpace(date)
		}
		if date := doc.Find(selector).First().Text(); date != "" {
			return strings.TrimSpace(date)
		}
	}
	return ""
}

// extractDescription extracts page description
func extractDescription(doc *goquery.Document) string {
	descSelectors := []string{
		"meta[property='og:description']",
		"meta[name='description']",
		"meta[name='twitter:description']",
	}

	for _, selector := range descSelectors {
		if desc := doc.Find(selector).First().AttrOr("content", ""); desc != "" {
			return strings.TrimSpace(desc)
		}
	}
	return ""
}

// cleanDocument removes unwanted elements
func cleanDocument(doc *goquery.Document) {
	unwantedSelectors := []string{
		"script", "style", "noscript", "iframe", "embed", "object",
		"nav", "header", "footer", "aside",
		".advertisement", ".ads", ".ad", ".social-share", ".social-sharing",
		".comments", ".comment", ".sidebar", ".navigation", ".menu",
		".popup", ".modal", ".overlay", ".banner", ".cookie-notice",
		"[aria-hidden='true']", ".screen-reader-text", ".visually-hidden",
	}

	for _, selector := range unwantedSelectors {
		doc.Find(selector).Remove()
	}

	// Remove suspicious content
	doc.Find("*").Each(func(i int, s *goquery.Selection) {
		text := strings.ToLower(s.Text())
		if strings.Contains(text, "advertisement") ||
			strings.Contains(text, "sponsored") ||
			strings.Contains(text, "cookie") && strings.Contains(text, "accept") {
			s.Remove()
		}
	})
}

// extractMainContent finds main content
func extractMainContent(doc *goquery.Document) string {
	contentSelectors := []string{
		"article", "main", "[role='main']",
		".post-content", ".entry-content", ".article-content",
		".content", "#content", "#main",
		".post", ".entry", ".article",
	}

	var contentSelection *goquery.Selection
	var maxLength int

	for _, selector := range contentSelectors {
		selection := doc.Find(selector).First()
		if selection.Length() > 0 {
			text := selection.Text()
			if len(text) > maxLength {
				maxLength = len(text)
				contentSelection = selection
			}
		}
	}

	if contentSelection == nil || maxLength < 100 {
		contentSelection = doc.Find("body")
		contentSelection.Find("header, footer, nav, aside, .sidebar, .navigation, .menu").Remove()
	}

	contentHTML, err := contentSelection.Html()
	if err != nil {
		return ""
	}
	return contentHTML
}

// generateReadablePage creates readable HTML
func generateReadablePage(title, content, sourceURL, author, publishDate, description string) string {
	mocha := catppuccin.Mocha

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s - Go Reader</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Victor+Mono:ital,wght@0,100..700;1,100..700&family=Ysabeau+Infant:ital,wght@0,1..1000;1,1..1000&display=swap" rel="stylesheet">

    <style>
        :root {
            --base: %s; --mantle: %s; --crust: %s; --text: %s;
            --subtext1: %s; --subtext0: %s; --surface0: %s; --surface1: %s;
            --surface2: %s; --blue: %s; --lavender: %s; --sapphire: %s;
            --sky: %s; --green: %s; --mauve: %s;
        }

        body {
            background-color: rgb(var(--base)); color: rgb(var(--text));
            font-family: 'Ysabeau Infant', sans-serif; font-weight: 300;
            line-height: 1.7; margin: 0; padding: 2rem 1rem;
        }

        .reader-container { max-width: 65ch; margin: 0 auto; }

        .reader-header {
            border-bottom: 2px solid rgb(var(--surface0));
            padding-bottom: 2rem; margin-bottom: 3rem;
        }

        .reader-title {
            font-size: 2.5rem; font-weight: 700; color: rgb(var(--blue));
            margin-bottom: 1rem; line-height: 1.2;
        }

        .reader-meta {
            color: rgb(var(--subtext1)); font-size: 0.9rem;
            display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }

        .reader-source {
            color: rgb(var(--sapphire)); text-decoration: none;
            padding: 0.25rem 0.75rem; background-color: rgb(var(--surface0));
            border-radius: 0.5rem; font-size: 0.8rem;
        }

        .reader-source:hover { background-color: rgb(var(--surface1)); }

        .reader-content h1, .reader-content h2, .reader-content h3,
        .reader-content h4, .reader-content h5, .reader-content h6 {
            color: rgb(var(--lavender)); font-weight: 600;
            margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.3;
        }

        .reader-content p { margin-bottom: 1.5rem; text-align: justify; }

        .reader-content a {
            color: rgb(var(--blue)); text-decoration: underline;
            text-decoration-color: rgb(var(--surface2)); text-underline-offset: 3px;
        }

        .reader-content a:hover {
            color: rgb(var(--sky)); text-decoration-color: rgb(var(--sky));
        }

        .reader-content code {
            font-family: 'Victor Mono', monospace; background-color: rgb(var(--surface0));
            color: rgb(var(--green)); padding: 0.2rem 0.4rem;
            border-radius: 0.25rem; font-size: 0.9em;
        }

        .reader-content pre {
            font-family: 'Victor Mono', monospace; background-color: rgb(var(--crust));
            color: rgb(var(--text)); padding: 1.5rem; border-radius: 0.5rem;
            overflow-x: auto; margin: 2rem 0; border: 1px solid rgb(var(--surface0));
        }

        .reader-content blockquote {
            border-left: 4px solid rgb(var(--mauve)); background-color: rgb(var(--mantle));
            padding: 1.5rem; margin: 2rem 0; border-radius: 0 0.5rem 0.5rem 0;
            font-style: italic; color: rgb(var(--subtext1));
        }

        @media (max-width: 768px) {
            .reader-container { padding: 1rem 0.75rem; }
            .reader-title { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="reader-container">
        <header class="reader-header">
            <h1 class="reader-title">%s</h1>
            <div class="reader-meta">
                <span>Go Reader</span>
                %s %s
                <a href="%s" class="reader-source" target="_blank" rel="noopener noreferrer">
                    View Original
                </a>
            </div>
        </header>

        <main class="reader-content">
            %s
        </main>
    </div>
</body>
</html>`,
		html.EscapeString(title),
		colorToRGB(mocha.Base()), colorToRGB(mocha.Mantle()), colorToRGB(mocha.Crust()),
		colorToRGB(mocha.Text()), colorToRGB(mocha.Subtext1()), colorToRGB(mocha.Subtext0()),
		colorToRGB(mocha.Surface0()), colorToRGB(mocha.Surface1()), colorToRGB(mocha.Surface2()),
		colorToRGB(mocha.Blue()), colorToRGB(mocha.Lavender()), colorToRGB(mocha.Sapphire()),
		colorToRGB(mocha.Sky()), colorToRGB(mocha.Green()), colorToRGB(mocha.Mauve()),
		html.EscapeString(title),
		formatAuthor(author), formatPublishDate(publishDate),
		html.EscapeString(sourceURL),
		content,
	)
}

// formatAuthor formats author for display
func formatAuthor(author string) string {
	if author == "" {
		return ""
	}
	return fmt.Sprintf(`<span class="author">By %s</span>`, html.EscapeString(author))
}

// formatPublishDate formats date for display
func formatPublishDate(publishDate string) string {
	if publishDate == "" {
		return ""
	}
	return fmt.Sprintf(`<span class="publish-date">%s</span>`, html.EscapeString(publishDate))
}

// colorToRGB converts catppuccin color to RGB format
func colorToRGB(color catppuccin.Color) string {
	return fmt.Sprintf("%d %d %d", color.RGB[0], color.RGB[1], color.RGB[2])
}

// processReaderWASM is the WASM entry point
func processReaderWASM(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]interface{}{
			"error": "URL parameter required",
		}
	}

	url := args[0].String()

	// Process the URL
	content, err := processURL(url)
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	return map[string]interface{}{
		"html": content,
	}
}

func main() {
	// Register the reader function for WASM
	js.Global().Set("processReader", js.FuncOf(processReaderWASM))

	// Keep the program running
	select {}
}
