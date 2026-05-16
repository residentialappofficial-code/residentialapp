# Changelog

All notable changes to the HABITIX platform will be documented in this file.

## [3.0.3] - 2026-05-16

### Added
- **Premium Auth UI**: Redesigned Login, Register, and Forgot Password with monochrome slate-900 premium system.
- **Micro-Animations**: Added slide-up-fade-in entry transitions for authentication elements.

### Fixed
- **Sidebar ReferenceError**: Resolved `ArrowRight is not defined` runtime error.

### Improved
- **Dashboard Cleanup**: Removed unused props and variables from the main Dashboard component.


## [3.0.1] - 2026-05-16

### Added
- **Hide and Show Password**: Integrated dedicated visibility toggle in Login and Register forms.
- **Unified UI System**: Migrated all modules to the premium monochrome `slate-900` design system.
- **Changelog**: Added clickable versioning and historical change tracking.

### Fixed
- **ReferenceErrors**: Resolved `Textarea is not defined` across Profile and Complex management pages.
- **Import Standardization**: Synchronized all UI components to use the centralized `@/components/ui` barrel export.
- **Asset Management Queries**: Fixed Supabase join errors in asset tracking and citizen portal.

### Improved
- **Code Quality**: Resolved over 15 ESLint warnings related to unused variables and imports.
- **Sidebar UX**: Optimized accessibility and role-based navigation logic.
