# Security Policy

## Supported Versions

We only provide security updates for the latest version of the code.

## Reporting Security Vulnerabilities

If you find a security vulnerability, please do not report it publicly. Report it privately instead:

1. Send an email to: allenxiaohu@gmail.com
2. Use GitHub's private security reporting feature

Please include as much of the following information as possible:

- Vulnerability description
- Affected version
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Time

We will respond within 48 hours of receiving a report, and provide a fix or timeline within 7 business days.

## Security Best Practices

### For Users

1. **Protect API Keys**:
   - Do not hardcode API keys in code
   - Use environment variables for sensitive information
   - Rotate API keys regularly

2. **Use HTTPS**:
   - Always use HTTPS connections
   - Verify SSL certificates

3. **Limit Access**:
   - Use firewall to restrict access
   - Configure appropriate authentication
   - Use a reverse proxy

4. **Regular Updates**:
   - Update to the latest version promptly
   - Follow security announcements

### For Developers

1. **Dependency Management**:
   ```bash
   npm audit
   npm update
   ```

2. **Code Review**:
   - All code changes require review
   - Use static analysis tools

3. **Testing**:
   - Write security tests
   - Perform penetration testing

4. **Documentation**:
   - Document security-related configurations
   - Provide security best practices guide

## Known Security Issues

There are currently no known security issues.

## Security Updates

Security updates will be released through:

1. GitHub Security Advisories
2. npm security advisories
3. Project release notes

## Acknowledgments

Thank you to all security researchers who report issues!

## Contact

- Security email: allenxiaohu@gmail.com
- GitHub: https://github.com/hexoh/claude-nvidia-proxy/security/advisories