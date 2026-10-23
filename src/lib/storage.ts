// TEMPORARY: type from the spec §3.3 contract so slice 2 can build before slice 1 (data layer) merges.
// Slice 1 owns this file; on merge take its version.
export type StorageStatus = 'ok' | 'unavailable'
