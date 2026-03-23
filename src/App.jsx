import Login from './pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicForm from './pages/PublicForm'
import AdminList from './pages/AdminList'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicForm />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminList />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App