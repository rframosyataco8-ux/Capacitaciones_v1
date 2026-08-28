/// <reference types="vite/client" />

declare module 'mammoth' {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}
declare module 'xlsx' {
  export function read(data: ArrayBuffer, opts?: { type: string }): { SheetNames: string[]; Sheets: Record<string, unknown> }
  export function write(wb: unknown, opts: { bookType: string; type: string }): ArrayBuffer
  export const utils: {
    sheet_to_html(sheet: unknown, opts?: { id?: string }): string
    sheet_to_json(sheet: unknown, opts?: { header?: number; defval?: string }): unknown[]
    aoa_to_sheet(data: string[][]): unknown
    book_new(): unknown
    book_append_sheet(wb: unknown, ws: unknown, name: string): void
  }
}
declare module 'jszip' {
  export default class JSZip {
    static loadAsync(data: Blob | ArrayBuffer): Promise<JSZip>
    files: Record<string, { async(type: 'text' | 'blob'): Promise<string | Blob>; dir?: boolean }>
  }
}
declare module 'pdf-lib' {
  export class PDFDocument {
    static load(data: Uint8Array): Promise<PDFDocument>
    getPageCount(): number
    getPages(): { getSize(): { width: number; height: number }; drawText(t: string, o: unknown): void; drawRectangle(o: unknown): void }[]
    embedFont(f: unknown): Promise<unknown>
    save(): Promise<Uint8Array>
  }
  export const StandardFonts: { Helvetica: unknown }
  export function rgb(r: number, g: number, b: number): unknown
}
