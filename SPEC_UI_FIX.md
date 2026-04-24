# Spec: SimPerumahan UI Fixes (v2)

## Objective
Refine the user interface of SimPerumahan by dialing back over-customization and fixing bugs on the **Login Page**. The goal is a clean, premium look that respects Chakra UI standards while maintaining the "Flup" identity.

## Proposed UI Refinements (Login Page)

### 1. Layout & Spacing
- **Card Padding**: Reduce from 10 to **8** (standard premium padding).
- **Rounding**: 
  - Login Card: Reduce from 32px to **16px** (2xl).
  - Inputs & Buttons: Reduce from 16px to **12px** (xl).
- **Branding Side**: Reduce padding from 16 to **12**.

### 2. Password Field
- **Requirement**: Toggleable visibility using an "eye" icon.
- **Component**: Use `@/components/ui/chakra/password-input`.

### 3. Styling & Colors
- **Button Fix**: Ensure the "Login to Flup" button uses a stable Emerald background (`#10b981`) and white text.
- **Input Backgrounds**: Standardize both inputs to **White**.
- **Focus Refinement**: 2px border on focus, no glow ring.
- **Autofill Fix**: Ensure auto-filled text is immediately visible. The current behavior causes a "white blank" look until clicked.

## Success Criteria
- [ ] Password visibility can be toggled via an Eye icon.
- [ ] The "Login to Flup" button is clearly visible with an emerald background.
- [ ] Card rounding is 16px (no longer "too big").
- [ ] Inputs have consistent backgrounds and 12px rounding.
- [ ] Auto-filled fields show text immediately (no white blank state).
- [ ] `npm run build` succeeds.

## Open Questions
- None. User's last prompt was very specific about the issues.

## Boundaries
- **Always do**: Use Chakra UI v3 components and standard design tokens.
- **Ask first**: If adding a new animation library (e.g. framer-motion extensions).
- **Never do**: Use inline `style` tags; always use Chakra props or the CSS variables in `index.css`.
