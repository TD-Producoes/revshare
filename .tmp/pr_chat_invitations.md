## Description
Implements project-scoped chat (Conversation) and invitation messaging UI, unifying invitation thread chat with the same canonical conversation used by the global chat drawer.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [x] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Changes Made
- Add Conversations + ConversationMessages backend + APIs (list, start, messages, options)
- Add chat drawer UI with start-conversation picker (per project/person)
- Add founder + marketer invitation thread pages with chat UI
- Founder can edit invitation terms; posting an automatic chat message with new terms
- Deprecate InvitationMessage as chat source of truth (invitation messages endpoint now proxies to Conversation)

## Testing
Describe how you tested your changes:
- [x] Tested locally
- [ ] Added/updated tests
- [x] All existing tests pass

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [x] My code follows the project's style guidelines
- [x] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [x] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
