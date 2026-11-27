# Changelog

All notable changes to Minarah will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - 2026-11-27

### Added

- A home-screen Quran companion card with a one-tap resume from the saved verse, a gentle 5/10/15-minute daily intention, and a local seven-day reading check-in.
- Reading check-ins use the same location time zone as the prayer tracker, stay on the device, and are included in local data export/import.
- The Quran reader now notifies the companion card when its saved reading position changes.

### Changed

- Daily reading is framed as a personal aid, without streak pressure, scorekeeping, or invented religious guidance.

---

## [Legacy notes] - 2025-12-02

### Performance Improvements

#### Client-Side Caching System
- **Instant Navigation**: Implemented in-memory caching for Surah data using React `useRef`
- **Smart Loading**: Surahs are cached after first visit, eliminating redundant network requests
- **Zero Latency**: Switching between previously visited Surahs is now instant
- **Memory Efficient**: Cache persists only during active session

#### Progressive Rendering
- **Faster Initial Load**: Only 10 verses render initially, reducing Time to Interactive
- **Infinite Scroll**: Additional verses load automatically as user scrolls
- **Smooth Experience**: Prevents UI freeze when loading large Surahs (e.g., Al-Baqarah with 286 verses)
- **Optimized Re-renders**: Minimized React reconciliation overhead

### Bug Fixes

#### UI/UX Fixes
- **Layout Gaps**: Fixed background color inconsistency causing visual gaps in Quran Browser
  - Changed `.content` background from `var(--color-bg)` to `var(--color-surface)`
  - Ensures seamless edge-to-edge appearance on mobile devices
- **JSX Syntax**: Resolved duplicate ternary operator causing build failures
- **Edge-to-Edge Mobile**: Perfected full-width layout for Surah list and verses on mobile

#### Error Handling
- **Seeding Resilience**: Added comprehensive error handling for API seeding logic
  - Prevents infinite retry loops on network failures
  - Displays user-friendly error messages
  - Allows graceful recovery from transient failures

### Added

#### Development Tools
- **React-Grab Integration**: Added for development mode (Alt/Option + Click to inspect elements)
  - Loads automatically in dev environment
  - Helps developers quickly understand component structure
  - Does not affect production builds

### Changed

#### Dependencies
- **Convex**: Upgraded from 1.29.3 to 1.30.0
  - Improved query performance
  - Better caching mechanisms
  - Enhanced stability

### Technical Details

#### Architecture Improvements
- Implemented two-tier caching strategy:
  1. **Convex Backend**: Persistent storage for all Surahs
  2. **Client Memory**: Session-based cache for instant access
- Progressive rendering with configurable batch size (currently 10 verses)
- Optimistic UI updates reduce perceived latency
- Error boundaries prevent cascade failures

#### Code Quality
- Enhanced TypeScript type safety in QuranBrowser component
- Improved state management with proper effect dependencies
- Added debug logging for easier troubleshooting (commented in production)

---

## Previous Versions

### [Previous commits]
See Git history for changes before this changelog was created.
