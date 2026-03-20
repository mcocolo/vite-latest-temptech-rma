import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicForm from './pages/PublicForm'
import AdminList from './pages/AdminList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicForm />} />
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
