# Specification: Laporan & Keluhan (Complaints)

## Objective
Provide a robust communication channel between residents and administrators/staff for reporting issues within the residential complex, ensuring privacy for residents and efficient task management for staff.

## Roles & Permissions

| Action | Warga (Resident) | Admin / Super Admin | Staff (Pengurus) |
|--------|-----------------|---------------------|------------------|
| Submit Complaint | ✅ Yes | ✅ Yes (as staff) | ✅ Yes (as staff) |
| View All Complaints | ❌ No | ✅ Yes | ❌ No |
| View Own Complaints | ✅ Yes | ✅ Yes | ✅ Yes |
| View Assigned Complaints | ❌ No | ✅ Yes | ✅ Yes |
| Assign Staff | ❌ No | ✅ Yes | ❌ No |
| Update Status | ❌ No | ✅ Yes | ✅ Yes (if assigned) |

## Database Schema (`keluhan`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `perumahan_id` | UUID | Foreign Key to `perumahan` |
| `warga_id` | UUID | Foreign Key to `profiles` (Submitter) |
| `kategori` | TEXT | Security, Cleanliness, Infrastructure, etc. |
| `deskripsi` | TEXT | The content of the complaint |
| `foto_url` | TEXT | Optional attachment (R2/Supabase Storage) |
| `status` | TEXT | 'Open', 'In Progress', 'Resolved' |
| `assigned_to` | UUID | Foreign Key to `profiles` (Staff assigned) |
| `created_at` | TIMESTAMPTZ | Timestamp |

## Logic Implementation

### 1. Data Fetching (Multi-Tenancy & Privacy)
- **Admin**: `SELECT * FROM keluhan WHERE perumahan_id = X`
- **Warga/Staff**: `SELECT * FROM keluhan WHERE perumahan_id = X AND (warga_id = ME OR assigned_to = ME)`

### 2. Status Workflow
- **Open**: Default state when submitted.
- **In Progress**: Set by Admin or Assigned Staff when work begins.
- **Resolved**: Final state when the issue is fixed.

### 3. UI Requirements
- **Resident View**: Clean list of cards with status badges. "New Report" button prominently displayed.
- **Admin View**: Dashboard-style list with "Assign" dropdown and "Update Status" buttons.
- **Staff View**: List of tasks assigned to them, with "Update Status" capability.

## Boundaries
- Residents MUST NOT be able to see other residents' complaints (enforced via RLS or query filters).
- Only Admins can re-assign a complaint to someone else.
