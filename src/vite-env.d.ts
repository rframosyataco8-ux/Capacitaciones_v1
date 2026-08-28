/// <reference types="vite/client" />

declare module 'mammoth' {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}
declare module 'xlsx' {
  export function read(data: ArrayBuffer, opts?: { type: string }): { SheetNames: string[]; Sheets: Record<string, unknown> }
  export const utils: { sheet_to_html(sheet: unknown, opts?: { id?: string }): string }
}
declare module 'jszip' {
  export default class JSZip {
    static loadAsync(data: Blob | ArrayBuffer): Promise<JSZip>
    files: Record<string, { async(type: 'text'): Promise<string> }>
  }
}
