# NCAA Survivor Bracket Scoring

## Current State
The app has a backend with Team, Entry, Game types. Entry stores participantName, picks, totalPoints, activeTeams. The admin panel has Teams, Games, and Settings tabs. The entry form collects an email field but does NOT pass it to the backend (it's frontend-only state). Payment is manual via PayPal; there is no payment tracking in the backend.

## Requested Changes (Diff)

### Add
- `email` field to the `Entry` type in the backend (stored with each entry)
- `paymentConfirmed` boolean field to the `Entry` type
- `confirmPayment(entryId: Nat) : async ()` backend function to mark an entry as paid
- `getLeaderboard` already returns all entries; no new query needed
- A new "Payments" tab in the Admin panel listing all entries (name, email, entry ID) with payment status badge and a "Mark Paid" / "Mark Unpaid" toggle button per row

### Modify
- `registerEntry` backend function to accept an `email: Text` parameter
- `useRegisterEntry` hook to pass email through
- `EntryForm` to pass the collected email to `registerEntry`

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend with email + paymentConfirmed on Entry, updated registerEntry(email), and new confirmPayment() function
2. Update useRegisterEntry hook to accept and pass email
3. Update EntryForm to pass email when calling registerEntry
4. Add useConfirmPayment mutation hook in useQueries.ts
5. Add "Payments" tab to Admin.tsx with entry list, payment status badges, and Mark Paid/Unpaid buttons
