# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0] - 2024-04-23

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