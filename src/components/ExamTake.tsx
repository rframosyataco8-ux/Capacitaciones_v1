import { useEffect, useState } from 'react'
import * as db from '../lib/db'
import type { Exam } from '../lib/db'

const THEMES: Record<string, string> = {
  blue: 'from-[#1a73e8] to-[#174ea6]',
  green: 'from-[#188038] to-[#0d652d]',
  purple: 'from-[#9334e6] to-[#681da8]',
  orange: 'from-[#e37400] to-[#b06000]',
}

export default function ExamTake({ token, onDone }: { token: string; onDone: () => void }) {
  const [exam, setExam] = useState<Exam | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<number[]>([])
  const [step, setStep] = useState<'intro' | 'quiz' | 'done'>('intro')
  const [result, setResult] = useState<{ percent: number; approved: boolean } | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    db.getExamByToken(token).then(e => {
      if (!e || e.estado !== 'Activo') setErr('Examen no disponible o no publicado.')
      else {
        setExam(e)
        setAnswers(new Array(e.questions.length).fill(-1))
      }
    })
  }, [token])

  async function submit() {
    if (!exam) return
    if (!nombre.trim()) return alert('Ingresa tu nombre')
    if (answers.some(a => a < 0)) return alert('Responde todas las preguntas')
    let score = 0
    let total = 0
    exam.questions.forEach((q, i) => {
      total += q.points
      if (answers[i] === q.correctIndex) score += q.points
    })
    const percent = total ? Math.round((score / total) * 100) : 0
    const approved = percent >= exam.notaMin
    await db.saveAttempt({
      examId: exam.id,
      nombre: nombre.trim(),
      email: email.trim() || undefined,
      answers,
      score,
      percent,
      approved,
    })
    setResult({ percent, approved })
    setStep('done')
  }

  if (err) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#f8f9fa] p-8">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <p className="text-[#d93025] mb-4">{err}</p>
          <button type="button" onClick={onDone} className="text-[#1a73e8] text-sm">Volver a CapaciHub</button>
        </div>
      </div>
    )
  }
  if (!exam) return <div className="min-h-full flex items-center justify-center text-[#5f6368]">Cargando examen...</div>

  if (step === 'intro') {
    return (
      <div className="min-h-full bg-[#f8f9fa]">
        <div className={'h-40 bg-gradient-to-r ' + (THEMES[exam.theme] || THEMES.blue) + ' flex items-end px-8 pb-6'}>
          <div className="text-white">
            <div className="text-2xl font-medium">{exam.title}</div>
            <div className="text-sm opacity-90 mt-1">{exam.description}</div>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-8">
          <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-6 space-y-4">
            <p className="text-sm text-[#5f6368]">{exam.questions.length} preguntas · Nota minima {exam.notaMin}%</p>
            <input placeholder="Tu nombre *" className="w-full h-11 px-3 rounded-lg border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input placeholder="Email (opcional)" className="w-full h-11 px-3 rounded-lg border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="button" onClick={() => setStep('quiz')} className="w-full h-11 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Comenzar</button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#f8f9fa] p-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#e8eaed] p-10 max-w-md text-center">
          <div className={'text-5xl font-medium mb-2 ' + (result.approved ? 'text-[#188038]' : 'text-[#d93025]')}>{result.percent}%</div>
          <div className="text-lg font-medium text-[#202124] mb-1">{result.approved ? 'Aprobado!' : 'No aprobado'}</div>
          <p className="text-sm text-[#5f6368] mb-6">Nota minima: {exam.notaMin}%</p>
          <button type="button" onClick={onDone} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9fa] pb-16">
      <div className={'h-20 bg-gradient-to-r ' + (THEMES[exam.theme] || THEMES.blue) + ' flex items-center px-6'}>
        <div className="text-white font-medium">{exam.title}</div>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {exam.questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-5">
            <div className="text-sm font-medium text-[#202124] mb-3">{qi + 1}. {q.text}</div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm border transition-colors ' + (answers[qi] === oi ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-transparent hover:bg-[#f8f9fa]')}>
                  <input type="radio" name={'q' + qi} checked={answers[qi] === oi} onChange={() => setAnswers(a => { const n = [...a]; n[qi] = oi; return n })} className="accent-[#1a73e8]" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={submit} className="w-full h-11 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Enviar respuestas</button>
      </div>
    </div>
  )
}
