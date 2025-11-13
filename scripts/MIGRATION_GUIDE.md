# Competition Registration Migration Guide

## What This Migration Does

**Changes:**
- Updates `competitionId` field in `CompetitionRegistration` table
- Moves registrations from "Innovative Design Challenge 2025" → "Archalley Competition 2025"

**Preserves (NO data loss):**
- ✅ All user information
- ✅ All payment records (PayHere & Bank Transfer)
- ✅ All registration numbers
- ✅ All team names and members
- ✅ All submission files
- ✅ All timestamps and status
- ✅ All other database tables remain untouched

## Safety Features

1. **Backup before migration** - All affected records saved to JSON file
2. **Validation checks** - Verifies competitions exist
3. **Transaction-based** - All-or-nothing operation
4. **Rollback capability** - Can restore from backup if needed
5. **Dry-run first** - Shows what will change before executing

## How to Run

### Step 1: Get Competition IDs

Open Prisma Studio and copy the full IDs:
```bash
npm run prisma:studio
```

Navigate to `Competition` table and copy:
- `innovative-design-challenge-2025` → **SOURCE_COMPETITION_ID**
- `archalley-competition-2025` → **TARGET_COMPETITION_ID**

### Step 2: Update Script

Edit `scripts/migrate-competition-registrations.ts`:
```typescript
const SOURCE_COMPETITION_ID = 'YOUR_ACTUAL_ID_HERE'; // Replace with full ID
const TARGET_COMPETITION_ID = 'YOUR_ACTUAL_ID_HERE'; // Replace with full ID
```

### Step 3: Run Dry-Run (Review Only)

```bash
npx ts-node scripts/migrate-competition-registrations.ts
```

This will show you:
- How many registrations will move
- Sample of registrations to migrate
- What will change

**The script is PAUSED by default** - it won't actually migrate until you enable it.

### Step 4: Enable Migration

After reviewing, edit the script and change:
```typescript
// Line ~110 - Comment this line:
// throw new Error('🛑 MIGRATION PAUSED...');

// Uncomment this line:
const proceed = true;
```

### Step 5: Run Migration

```bash
npx ts-node scripts/migrate-competition-registrations.ts
```

### Step 6: Verify

1. Check admin dashboard - all registrations should show under one competition
2. Verify counts match
3. Keep backup file safe

## Rollback (If Needed)

If something goes wrong, use the backup file:

```typescript
// In the script, call:
rollback('./migration-backup-TIMESTAMP.json');
```

Or manually in Prisma Studio:
```sql
-- Copy from backup file and run for each registration
UPDATE "CompetitionRegistration" 
SET "competitionId" = 'old_id' 
WHERE id = 'registration_id';
```

## Post-Migration

### Update Competition Title
```sql
UPDATE "Competition" 
SET 
  title = 'Archalley Competition 2025 - Christmas in Future',
  description = 'Design innovative Christmas trees for tomorrow with the theme: Christmas in Future'
WHERE id = 'TARGET_COMPETITION_ID';
```

### (Optional) Delete Unused Competition
**Only after verifying everything works:**
```sql
DELETE FROM "Competition" 
WHERE id = 'SOURCE_COMPETITION_ID';
```

## Risk Assessment

**Risk Level: LOW** ✅

- Only 1 table affected
- Only 1 field changed (competitionId)
- Backup created automatically
- Transaction ensures atomicity
- Easy rollback available

## What Cannot Be Lost

The migration **only changes which competition record the registrations point to**. Think of it like:
- Moving files from Folder A to Folder B
- The files themselves don't change
- Just their location reference changes

All registration data, payments, users, files remain intact.

## Support

If you encounter issues:
1. Keep the backup file
2. Don't delete the source competition yet
3. Check the backup file has all registration IDs
4. You can always rollback

## Example Output

```
🚀 Starting Competition Registration Migration

📋 Step 1: Verifying competitions...
  ✅ Source: "Innovative Design Challenge 2025" (innovative-design-challenge-2025)
  ✅ Target: "Archalley Competition 2025" (archalley-competition-2025)

📊 Step 2: Counting registrations...
  Source competition: 1 registrations
  Target competition: 7 registrations
  Total after migration: 8 registrations

💾 Step 3: Creating backup...
  ✅ Backed up 1 registrations

📝 Sample of registrations to migrate:
  - E7JEZN | admin@archalley.com | PAYHERE

✨ Migration completed successfully!
```
