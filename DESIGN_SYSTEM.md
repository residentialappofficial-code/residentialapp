# SimPerumahan Design System (v1.0)

This document defines the core visual language and component usage for SimPerumahan. All new features must adhere to these tokens and components to maintain the **Premium Black & White** aesthetic.

---

## 1. Color Palette

### Neutrals (Core)
- **Primary Black**: `slate-950` (`#020617`) - Used for primary buttons, sidebar, and headers.
- **Deep Slate**: `slate-900` (`#0f172a`) - Used for primary text and headings.
- **Medium Slate**: `slate-500` (`#64748b`) - Used for secondary text and descriptions.
- **Border/Divider**: `slate-200` (`#e2e8f0`) - Used for card borders and table dividers.
- **Subtle Surface**: `slate-50` (`#f8fafc`) - Used for page backgrounds and input fields.
- **White**: `white` (`#ffffff`) - Used for cards, modals, and container backgrounds.

### Feedback Colors
- **Success**: `green-600` (Text) / `green-50` (Bg) - Confirmed actions, paid status.
- **Warning**: `amber-600` (Text) / `amber-50` (Bg) - Pending actions, in-progress.
- **Danger**: `red-600` (Text) / `red-50` (Bg) - Critical errors, unpaid status, delete actions.

---

## 2. Typography

- **Headings**: `font-bold` or `font-black`, `text-slate-900`.
- **Body Text**: `font-medium`, `text-slate-700` or `text-slate-500`.
- **Small Caps**: `text-[10px]`, `font-bold`, `uppercase`, `tracking-widest`. (Used for labels and tags).

---

## 3. Core Components (`src/components/ui/`)

### 🔳 Button
Use the standard `Button` component from `@/components/ui`.
- **Primary**: `variant="primary"` (Black background, white text).
- **Outline**: `variant="outline"` (White background, slate border).
- **Ghost**: `variant="ghost"` (No background, subtle hover).
- **Danger**: `variant="danger"` (Red background).

### 📇 Card
Use for grouping related content.
- **Default**: `p-6`, rounded-xl, border-slate-200.
- **Interactive**: Add `hover:shadow-md transition-all`.

### 📝 Input & Form
- **Default**: `bg-slate-50`, `border-slate-200`, `focus:border-black`.
- **Padding**: Use `px-4 py-3` for a premium, spacious feel.
- **Icons**: Always place icons in `absolute` containers on the left (e.g., `pl-10`).

### 🏷️ Badge
- **Variants**: `green`, `red`, `blue`, `slate`.
- **Style**: `rounded-full`, `text-[10px]`, `font-bold`, `uppercase`.

---

## 4. Layout Rules

- **Page Padding**: Use `p-6` or `p-8` for main content areas.
- **Card Gaps**: Use `gap-6` for vertical spacing between cards.
- **Sidebar**: Fixed `w-64`, background `slate-950`.
- **Border Radius**: Use `rounded-xl` (12px) for general components and `rounded-2xl` or `3xl` for large cards/modals.

---

## 5. Usage Example

```jsx
import { Button, Card, Input, Badge } from "@/components/ui";
import { Plus, Search } from "lucide-react";

export default function Example() {
  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Module Title</h2>
        <Badge variant="green">Active</Badge>
      </div>
      
      <Input placeholder="Search items..." icon={Search} className="mb-4" />
      
      <Button variant="primary" icon={Plus}>
        Create New
      </Button>
    </Card>
  );
}
```
