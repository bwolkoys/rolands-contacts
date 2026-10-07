export interface AirtableConfig {
  token?: string
  baseId: string
  tableId: string
  viewId?: string
}
export interface ContactRecord {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}
export interface ContactsPayload {
  baseId: string
  tableId: string
  records: ContactRecord[]
}
export function configFromEnv(env: Record<string, string | undefined>): AirtableConfig
export function fetchContacts(config: AirtableConfig): Promise<ContactsPayload>
