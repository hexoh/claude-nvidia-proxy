# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of claude-nvidia-proxy
- Support for Anthropic to NVIDIA API conversion
- Streaming and non-streaming response support
- Tool calls support
- Image input support
- Token usage statistics
- Basic authentication mechanism
- Docker support
- npm package distribution

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- Fixed usage field in message_start event
- Fixed streaming response handling
- Fixed port binding issues

### Security
- N/A

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