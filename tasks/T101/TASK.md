# T101 task record

## Disputes

- **2026-11-17 · `app/src/__tests__/closetBatch287.test.ts` (type-only edit, not a lock change).** The implementer widened `ArtShape` in `app/src/features/closet/artSpec.ts` to include `'accessory'`. The test's local helper type for `tileArtBox` (`shape: 'top' | 'bottom' | 'shoe'`, in the C4 test) no longer accepted `spec.shape`, so `tsc --noEmit` failed at two call sites. Added `| 'accessory'` to that parameter type. No assertion, value or behaviour changed; the test checks exactly what it did before. Made by the test writer at the coordinator's request. This file is not one of the T101 locked tests.
