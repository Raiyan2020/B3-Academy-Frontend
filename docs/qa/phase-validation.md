# Phase validation contract

Run these gates after every phase:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`

The build output is compared with `route-inventory.md`. Acceptance tests must cover guest, member, subscriber, owner, doctor, and admin states as those roles become available. Manual QA reset helpers belong in repositories/test fixtures and are not rendered in production UI.
