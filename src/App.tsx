import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Cronograma from './pages/Cronograma'
import Examenes from './pages/Examenes'
import DataStorage from './pages/DataStorage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/inicio" replace />} />
        <Route path="inicio" element={<Inicio />} />
        <Route path="cronograma" element={<Cronograma />} />
        <Route path="examenes" element={<Examenes />} />
        <Route path="data-storage" element={<DataStorage />} />
      </Route>
    </Routes>
  )
}
