# Contributing Guide

Thank you for your interest in the claude-nvidia-proxy project! We welcome contributions in all forms.

## How to Contribute

### Reporting Bugs

1. Search existing issues on [GitHub Issues](https://github.com/hexoh/claude-nvidia-proxy/issues)
2. If no relevant issue exists, create a new one
3. Provide detailed information:
   - Issue description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (Node.js version, OS, etc.)
   - Relevant logs or error messages

### Proposing New Features

1. Discuss your idea on [GitHub Discussions](https://github.com/hexoh/claude-nvidia-proxy/discussions)
2. After receiving feedback, create a Feature Request Issue
3. Describe the use case and expected behavior

### Submitting Code

#### 1. Fork the Repository

Click the "Fork" button on the GitHub page.

#### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/claude-nvidia-proxy.git
cd claude-nvidia-proxy
```

#### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 4. Make Changes

- Follow existing code style
- Add necessary comments
- Update relevant documentation
- Add tests if applicable

#### 5. Run Tests

```bash
npm install
npm test
npm run build
```

#### 6. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
# or
git commit -m "fix: describe your bug fix"
```

#### 7. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### 8. Create Pull Request

1. Visit your fork page
2. Click "New Pull Request"
3. Fill in the PR description:
   - Clear title
   - Detailed description
   - Links to relevant issues
   - Screenshots if applicable

## Code Standards

### JavaScript/Node.js

- Use ES6+ syntax
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting (no functional change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test related
- `chore`: Build/tool related

**Examples:**

```bash
feat(api): add support for streaming responses

fix(proxy): handle missing usage field in streaming responses

docs(readme): update installation instructions

test(proxy): add integration tests for tool calls
```

## Development Environment Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
- Git

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Run Development Server

```bash
npm run dev
# or
node src/index.js start
```

### Build Project

```bash
npm run build
```

### Test a Model

```bash
# Interactive model selection
cnp test

# Test with specific model
cnp test z-ai/glm4.7
```

### Run Tests

```bash
npm test
```

## Project Structure

```
claude-nvidia-proxy/
├── src/
│   ├── cli/
│   │   ├── index.js              # CLI entry
│   │   └── commands/
│   │       ├── start.js          # Start command
│   │       ├── stop.js           # Stop command
│   │       ├── restart.js        # Restart command
│   │       ├── config.js         # Config command
│   │       ├── status.js         # Status command
│   │       ├── logs.js           # Logs command
│   │       ├── model.js          # Model management command
│   │       └── test.js           # Test command
│   ├── config/
│   │   └── index.js              # Configuration management
│   ├── logger/
│   │   └── index.js              # Logger management
│   ├── server/
│   │   └── index.js              # HTTP server
│   ├── proxy/
│   │   └── index.js              # Proxy logic
│   ├── converter/
│   │   └── index.js              # Format conversion
│   ├── utils/
│   │   └── index.js              # Utilities
│   ├── origin/
│   │   └── service.js           # Original Anthropic service
│   └── index.js                  # Main entry
├── config/
│   ├── models.json               # Default model list
│   └── settings.example.json   # Config example
├── script/
│   └── build.js                  # Build script
├── dist/                         # Build output
├── package.json                  # Project config
├── README.md                     # Project documentation
├── CHANGELOG.md                  # Changelog
└── LICENSE                       # MIT License
```

## Testing Guide

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

Use curl or Postman to test the API:

```bash
curl -X POST http://localhost:8888/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "z-ai/glm4.7",
    "max_tokens": 100,
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Documentation Contribution

### Updating Documentation

- Keep documentation concise and clear
- Include code examples
- Update relevant sections
- Check spelling and grammar

### Adding Examples

Add new usage examples in the `examples/` directory:

```javascript
// examples/new-feature.js
import { createProxy } from 'claude-nvidia-proxy';

async function example() {
  // Your example code
}

export { example };
```

## Release Process

1. Update version number
2. Update CHANGELOG.md
3. Create Git tags
4. Publish to npm
5. Publish Docker image
6. Create GitHub Release

## Code of Conduct

- Respect all contributors
- Welcome constructive criticism
- Focus on what's best for the community
- Be open to differing opinions

## Getting Help

If you have any questions:

1. Check the [documentation](README.md)
2. Search [Issues](https://github.com/hexoh/claude-nvidia-proxy/issues)
3. Ask in [Discussions](https://github.com/hexoh/claude-nvidia-proxy/discussions)
4. Contact the maintainers

## License

By contributing code, you agree that your contribution will be published under the MIT License.

## Acknowledgments

Thank you to all contributors!

---

Thank you for your contribution!