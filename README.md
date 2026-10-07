# Roland's Contacts

Mobile-friendly dashboard for the people Roland has met. Data is read live from Airtable
(base `appwK8xg2CmohFBZc`, table `tbl75efSdpUCLuMQv`, view `viw81nc9CWWErdzCa`).

Search by **Name**, **Notes** (any word — every contact whose notes contain it shows up) or **Event**,
or use **All** to search everything at once. Event chips filter by a specific event. Tap a contact
to see every field from Airtable, with Call / Text / Email shortcuts.

## Setup

1. Create an Airtable personal access token at https://airtable.com/create/tokens
   - Scope: `data.records:read`
   - Access: only Roland's contacts base
2. `cp .env.example .env.local` and paste the token into `AIRTABLE_TOKEN`.
3. `npm install && npm run dev`

The token is only used server-side (`/api/contacts`), so it never ships to the browser.

## Deploying

- **Vercel**: works as-is — `api/contacts.js` becomes the `/api/contacts` endpoint.
  Add `AIRTABLE_TOKEN` in the project's Environment Variables.
- Other hosts: port `api/contacts.js` to that host's function format; the logic lives in
  `server/airtable.js`.

New columns added in Airtable automatically appear on the contact detail view.
