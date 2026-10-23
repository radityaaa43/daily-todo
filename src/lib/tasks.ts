// TEMPORARY: types from the spec §2 data model so slice 2 can build before slice 1 (data layer) merges.
// Slice 1 owns this file; on merge take its version.
export type DateKey = string

export interface Task {
  id: string
  text: string
  done: boolean
  createdAt: number
  createdDate: DateKey
  completedAt: number | null
  completedDate: DateKey | null
}
