# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT open a public issue** for security vulnerabilities
2. Email us at **tiagoantunespt@gmail.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Updates**: We will provide updates on our progress
- **Resolution**: We aim to resolve critical issues within 7 days
- **Credit**: We will credit you in our security acknowledgments (unless you prefer anonymity)

### Scope

The following are in scope:
- The RevShare web application
- API endpoints
- Authentication and authorization systems
- Data handling and storage

The following are out of scope:
- Third-party services (Stripe, Supabase, etc.)
- Social engineering attacks
- Denial of service attacks

## Security Best Practices

When self-hosting RevShare:

1. **Environment Variables**: Never commit secrets to version control
2. **Database**: Use strong passwords and restrict network access
3. **HTTPS**: Always use HTTPS in production
4. **Updates**: Keep dependencies updated
5. **Access Control**: Limit who has access to production systems

## Acknowledgments

We thank the following individuals for responsibly disclosing vulnerabilities:

- (Your name could be here!)
