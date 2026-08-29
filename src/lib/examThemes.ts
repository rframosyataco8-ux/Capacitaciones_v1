export interface FormTheme {
  id: string
  name: string
  bgStyle: string
  cardBorder: string
  accentColor: string
  headerBg: string
  previewColor: string
}

export const FORM_THEMES: FormTheme[] = [
  {
    id: 'romex-cacao',
    name: 'ROMEX Cacao & Calidad',
    bgStyle: 'linear-gradient(135deg, #1e130c 0%, #3d2314 50%, #150c07 100%)',
    cardBorder: '#c4a35a',
    accentColor: '#c4a35a',
    headerBg: 'linear-gradient(90deg, #3d2314 0%, #0f4c81 100%)',
    previewColor: '#3d2314',
  },
  {
    id: 'haccp-blue',
    name: 'Inocuidad & HACCP Azul',
    bgStyle: 'linear-gradient(135deg, #091e3a 0%, #0f4c81 50%, #1a3a60 100%)',
    cardBorder: '#3b82c4',
    accentColor: '#0f4c81',
    headerBg: 'linear-gradient(90deg, #0f4c81 0%, #2563eb 100%)',
    previewColor: '#0f4c81',
  },
  {
    id: 'organic-green',
    name: 'Orgánico & Sostenibilidad',
    bgStyle: 'linear-gradient(135deg, #062419 0%, #047857 50%, #0f3e2e 100%)',
    cardBorder: '#10b981',
    accentColor: '#047857',
    headerBg: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
    previewColor: '#047857',
  },
  {
    id: 'm365-purple',
    name: 'Microsoft 365 Violeta',
    bgStyle: 'linear-gradient(135deg, #1b0c36 0%, #581c87 50%, #2e1065 100%)',
    cardBorder: '#a855f7',
    accentColor: '#7c3aed',
    headerBg: 'linear-gradient(90deg, #6b21a8 0%, #7c3aed 100%)',
    previewColor: '#6b21a8',
  },
  {
    id: 'sunset-amber',
    name: 'Energía & Seguridad Ámbar',
    bgStyle: 'linear-gradient(135deg, #2e1005 0%, #9a3412 50%, #431407 100%)',
    cardBorder: '#f97316',
    accentColor: '#ea580c',
    headerBg: 'linear-gradient(90deg, #9a3412 0%, #ea580c 100%)',
    previewColor: '#c2410c',
  },
  {
    id: 'clean-slate',
    name: 'Minimalista Corporativo',
    bgStyle: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    cardBorder: '#64748b',
    accentColor: '#0f4c81',
    headerBg: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
    previewColor: '#1e293b',
  },
]
