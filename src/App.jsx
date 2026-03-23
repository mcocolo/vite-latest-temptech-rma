import Login from './pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicForm from './pages/PublicForm'
import AdminList from './pages/AdminList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicForm />} />
        <Route path="/admin" element={<AdminList />} />
       <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
