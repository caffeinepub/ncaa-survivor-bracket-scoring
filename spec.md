# NCAA Survivor Bracket Scoring

## Current State
Admin panel has a Payments tab showing all entries with name, email, payment status badge, and Mark Paid/Mark Unpaid buttons.

## Requested Changes (Diff)

### Add
- `deleteEntry(entryId: Nat)` backend function.
- `useDeleteEntry` mutation hook.
- Delete button per entry row in Payments tab with AlertDialog confirmation.

### Modify
- Admin.tsx Payments tab: add delete button with confirm dialog.

### Remove
- Nothing.

## Implementation Plan
1. Add deleteEntry to main.mo.
2. Add deleteEntry to backend.d.ts.
3. Add useDeleteEntry hook to useQueries.ts.
4. Add delete button with AlertDialog to each entry row in Admin.tsx.
