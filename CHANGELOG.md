# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.4](https://github.com/residentialappofficial-code/residentialapp/compare/v3.0.3...v0.3.4) (2026-06-15)


### Features

* complete full mobile responsive layouts and table-to-card conversions across all portals ([18f3cc5](https://github.com/residentialappofficial-code/residentialapp/commit/18f3cc5b89cc23e94a616c85e3bbdb8dd8ac45de))
* Habitix v3.1 (Dashboard RPC, CSV Export, Cron Billing, Audit, Webhook, QR) ([289d5e4](https://github.com/residentialappofficial-code/residentialapp/commit/289d5e4e211d13a7acb937dba116c835f51a81c6))
* implement centralized payment gateway and SaaS subscription system ([dcc1747](https://github.com/residentialappofficial-code/residentialapp/commit/dcc1747c985433ee97b69377659843a66119cf5f))


### Bug Fixes

* resolve className propagation/overwriting in base UI components ([f8411fd](https://github.com/residentialappofficial-code/residentialapp/commit/f8411fdcb15ece7e6f6efa1b6a5c10eb0ed7fd2a))

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
