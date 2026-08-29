import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Exam, ExamSubmission } from './db'

export function generateCertificatePDF(submission: ExamSubmission, exam: Exam) {
  // Certificado en orientación horizontal (A4 landscape)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  // Fondo elegante con doble marco
  doc.setDrawColor(15, 76, 129) // ROMEX primary #0f4c81
  doc.setLineWidth(2)
  doc.rect(8, 8, width - 16, height - 16)

  doc.setDrawColor(196, 163, 90) // Gold accent #c4a35a
  doc.setLineWidth(0.8)
  doc.rect(12, 12, width - 24, height - 24)

  // Cabecera Institucional
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 76, 129)
  doc.text('EXPORTADORA ROMEX S.A.', width / 2, 24, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Planta de Procesamiento de Cacao · Chincha · Sistema HACCP 004', width / 2, 29, { align: 'center' })

  // Título del Certificado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(15, 23, 42)
  doc.text('CONSTANCIA DE APROBACIÓN', width / 2, 42, { align: 'center' })

  // Subtítulo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text('El Departamento de Aseguramiento de la Calidad e Inocuidad certifica que:', width / 2, 51, { align: 'center' })

  // Nombre del participante (destacado)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(15, 76, 129)
  doc.text(submission.evaluadoNombre.toUpperCase(), width / 2, 65, { align: 'center' })

  // DNI / Área si existe
  const metaText = [
    submission.evaluadoDni ? `DNI: ${submission.evaluadoDni}` : null,
    submission.evaluadoArea ? `Área: ${submission.evaluadoArea}` : null,
  ].filter(Boolean).join('  |  ')

  if (metaText) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(metaText, width / 2, 71, { align: 'center' })
  }

  // Línea divisoria decorativa
  doc.setDrawColor(196, 163, 90)
  doc.setLineWidth(0.5)
  doc.line(width / 2 - 50, 75, width / 2 + 50, 75)

  // Descripción de la capacitación y aprobación
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  const temaCap = exam.tema || exam.titulo
  const desc = `Ha participado y APROBADO satisfactoriamente la evaluación correspondiente al programa de capacitación técnica en:`
  doc.text(desc, width / 2, 85, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 76, 129)
  doc.text(`"${temaCap}"`, width / 2, 94, { align: 'center' })

  // Cuadro con Calificación
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(width / 2 - 45, 102, 90, 15, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(4, 120, 87) // Verde #047857
  doc.text(`Calificación Obtenida: ${submission.notaBase20.toFixed(1)} / 20  (${submission.porcentaje}%)`, width / 2, 111, { align: 'center' })

  // Fecha y lugar
  const fechaStr = new Date(submission.fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Chincha, ${fechaStr}`, width / 2, 126, { align: 'center' })

  // Firmas institucionales
  const signY = 148
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.4)

  // Firma 1: Jefatura de Calidad
  doc.line(35, signY, 105, signY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Blga. Nereyda Huachua', 70, signY + 4, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Jefe de Aseguramiento de la Calidad', 70, signY + 8, { align: 'center' })

  // Firma 2: Instructor / Responsable
  doc.line(width - 105, signY, width - 35, signY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Ing. Carlos Villanueva', width - 70, signY + 4, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Gerencia de Planta / Operaciones', width - 70, signY + 8, { align: 'center' })

  // Sello / Hash de verificación inferior
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  const certId = `CERT-ROMEX-${submission.id || Date.now()}-${submission.notaBase20.toFixed(0)}`
  doc.text(`Registro de Certificación: ${certId} · Documento controlado interno`, 15, height - 14)

  doc.save(`Certificado_${submission.evaluadoNombre.replace(/\s+/g, '_')}_ROMEX.pdf`)
}

export function exportSubmissionsExcel(submissions: ExamSubmission[], exam: Exam) {
  const data = submissions.map((s, idx) => ({
    'N°': idx + 1,
    'Nombre Completo': s.evaluadoNombre,
    'DNI / Documento': s.evaluadoDni || '—',
    'Área / Puesto': s.evaluadoArea || '—',
    'Puntos Obtenidos': `${s.puntajeObtenido} / ${s.puntajeMaximo}`,
    'Nota (Base 20)': s.notaBase20.toFixed(1),
    'Porcentaje (%)': `${s.porcentaje}%`,
    'Estado': s.aprobado ? 'APROBADO' : 'DESAPROBADO',
    'Tiempo Empleado': `${Math.floor(s.tiempoEmpleadoSegundos / 60)}m ${s.tiempoEmpleadoSegundos % 60}s`,
    'Fecha de Evaluación': new Date(s.fecha).toLocaleString('es-PE'),
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados')
  XLSX.writeFile(wb, `Reporte_Examen_${exam.titulo.replace(/[<>:"/\\|?*]/g, '_').slice(0, 30)}.xlsx`)
}

export function exportExamSummaryPDF(exam: Exam, submissions: ExamSubmission[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const total = submissions.length
  const aprobados = submissions.filter((s) => s.aprobado).length
  const desaprobados = total - aprobados
  const avg = total > 0 ? (submissions.reduce((acc, s) => acc + s.notaBase20, 0) / total).toFixed(1) : '0.0'
  const tasaAprobacion = total > 0 ? Math.round((aprobados / total) * 100) : 0

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 76, 129)
  doc.text('EXPORTADORA ROMEX S.A. — Planta de Cacao', 14, 14)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Informe Ejecutivo de Resultados de Evaluación', 14, 20)

  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(exam.titulo, 14, 29)

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`Tema: ${exam.tema || 'General'} · Preguntas: ${exam.preguntas.length} · Nota mínima: ${exam.config?.notaMinimaAprobatoria || 14}/20`, 14, 35)

  // Resumen Métricas
  autoTable(doc, {
    startY: 40,
    head: [['Evaluados Totales', 'Aprobados', 'Desaprobados', 'Tasa de Aprobación', 'Nota Promedio']],
    body: [[String(total), String(aprobados), String(desaprobados), `${tasaAprobacion}%`, `${avg} / 20`]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [15, 76, 129] },
  })

  // Tabla detallada de alumnos
  const lastY = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Evaluados', 14, lastY)

  autoTable(doc, {
    startY: lastY + 4,
    head: [['#', 'Colaborador', 'DNI', 'Área', 'Nota (20)', 'Resultado', 'Fecha']],
    body: submissions.map((s, i) => [
      String(i + 1),
      s.evaluadoNombre,
      s.evaluadoDni || '—',
      s.evaluadoArea || '—',
      s.notaBase20.toFixed(1),
      s.aprobado ? 'APROBADO' : 'DESAPROBADO',
      new Date(s.fecha).toLocaleDateString('es-PE'),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  })

  doc.save(`Informe_${exam.titulo.replace(/[<>:"/\\|?*]/g, '_').slice(0, 30)}.pdf`)
}

