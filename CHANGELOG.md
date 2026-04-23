# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.1.0 (2026-04-23)


### Features

* add interactive configuration and logging features ([76b8014](https://github.com/hexoh/claude-nvidia-proxy/commit/76b80140b7f3e0d2d6832449fd5803e2593e8f98))
* remove SECURITY.md and add new CONTRIBUTING.md and SECURITY.md files ([9ccbde5](https://github.com/hexoh/claude-nvidia-proxy/commit/9ccbde59c101515644943fc2efaca392289cce84))
* update README and README.zh.md for improved clarity and structure; add quick start guide and configuration instructions ([9822c20](https://github.com/hexoh/claude-nvidia-proxy/commit/9822c204b74a1387a508b97d5d717c77c8f011d3))


### Bug Fixes

* add .github config ([b42e6ca](https://github.com/hexoh/claude-nvidia-proxy/commit/b42e6ca42c4425039023164da9db5edb854de03d))
* fix .github npm run error ([6dd2526](https://github.com/hexoh/claude-nvidia-proxy/commit/6dd2526ad270f4a76204c2ffe8c3957c02e69cec))

## [1.0.0] - 2024-04-22

### Added
- Initial release
- Core proxy functionality
- Anthropic API format conversion
- NVIDIA API integration
- Configuration via environment variables
- Docker support
- npm package support

### Features
- Convert Anthropic requests to OpenAI/NVIDIA format
- Support for streaming responses
- Support for tool calls
- Support for image inputs
- Token usage tracking
- Simple authentication
- Health check endpoint
- Comprehensive logging

### Documentation
- README.md
- QUICKSTART.md
- PUBLISHING.md
- CONTRIBUTING.md
- CHANGELOG.md
- Example code

### Deployment
- Dockerfile
- docker-compose.yml
- .dockerignore
- .npmignore

---

## Versioning Scheme

- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes (backwards compatible)

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Publish Docker image
6. Create GitHub Release