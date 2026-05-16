# UI Design Specification: HABITIX Premium

## 1. Objective
To create a high-end, premium residential management interface that is visually stunning, highly interactive, and consistent across all modules.

## 2. Design Tokens

### Colors
- **Primary**: Indigo 600 (`#4f46e5`) to 700 (`#4338ca`) for gradients.
- **Surface**: White (`#ffffff`) on Slate 50 (`#f8fafc`) background.
- **Text**: Slate 900 (`#0f172a`) for primary, Slate 400 (`#94a3b8`) for secondary.
- **Accents**: 
  - Emerald 500 (Success/Paid)
  - Rose 500 (Danger/Unpaid)
  - Amber 500 (Warning/Pending)

### Typography
- **Headings**: font-black (900), tracking-tight.
- **Body**: font-medium (500), text-sm.
- **Labels**: text-xs, font-bold, uppercase, tracking-wider.
- **Numbers**: font-black, tabular-nums.

### Effects
- **Shadow Premium**: `0 25px 50px -12px rgb(0 0 0 / 0.05), 0 10px 20px -5px rgb(0 0 0 / 0.05)`.
- **Radius**: `32px` (Cards), `16px` (Buttons/Inputs), `12px` (Badges).

## 3. Component Standards

### Cards
- Border: `1px solid #f1f5f9` (Slate 100).
- Shadow: `shadow-premium`.
- Padding: `p-8` (Large), `p-6` (Standard).

### Buttons
- Hover: `-translate-y-0.5`, `shadow-lg`.
- Active: `scale-95`, `translate-y-0`.
- Transition: `duration-300 ease-out`.

### Modals
- Backdrop: `blur-xl`, `bg-slate-900/40`.
- Animation: `spring-bounce`.

## 4. Page Specific Guidelines

### Resident Dashboard
- Focus on "Financial Clarity" (Large numbers, clear status badges).
- Minimalist layout with plenty of whitespace.

### Admin Panels
- Data density with readability.
- Clear call-to-action buttons for operational tasks.

## 5. Implementation Roadmap
1. Update `index.css` with global tokens.
2. Refactor `src/components/ui/` components.
3. Apply changes to `MyBills.jsx`, `Profile.jsx`, and `ForumWarga.jsx`.
4. Audit and unify all other pages.
