# Product Overview

dave.io is a modern web platform that provides AI-powered text processing services and URL redirection functionality. The platform is built as a personal website and API service offering several key features:

## Core Features

- **AI Text Processing**: Split long text into social media-friendly posts with intelligent threading
- **AI Image Analysis**: Generate descriptive alt text for images using AI vision
- **AI Word Alternatives**: Find better word choices with context-aware suggestions
- **URL Redirection**: Short link system with `/go/{slug}` routes for easy sharing
- **JWT Authentication**: Hierarchical permission system with fine-grained access control

## Target Users

- Content creators who need to split long-form content across social platforms
- Developers and accessibility advocates who need AI-generated alt text
- Writers looking for word alternatives and synonyms
- Anyone needing a personal URL shortening service

## Architecture

The platform is designed as a full-stack web application with:

- Frontend: Personal website with Vue.js components
- Backend: RESTful API with comprehensive validation and error handling
- Infrastructure: Cloudflare Workers for edge computing and global distribution
- Authentication: JWT-based with hierarchical permissions (api, ai, dashboard, admin, \*)

## Business Model

Personal project and API service with token-based access control for protected endpoints.
