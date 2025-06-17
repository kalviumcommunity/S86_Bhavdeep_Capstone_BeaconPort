import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Client from './Client/Client'
import Home from './Client/components/Home/Home'
import Login from './Client/components/Login/Login'
import Register from './Client/components/Register/Register'
import ResetPassword from './Client/components/Login/ResetPassword'
import { AuthProvider } from './context/AuthContext'
import RoleSelection from './Client/components/RoleSelection/RoleSelection'
import Logout from './Client/components/Logout/Logout'
import ProtectedRoute from './Guard/ProtectedRoute'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Home Route */}
          <Route path='/' element={<Client />}>
            <Route index element={<Home />} />
          </Route>

          {/* Authentication Routes - These are standalone, not nested */}
          <Route path='/select-role' element={<RoleSelection />} />
          <Route path='/login/:role' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/logout' element={<Logout />} />
          
          {/* Password Reset Route - Must be standalone */}
          <Route path='/reset-password/:token' element={<ResetPassword />} />

          {/* Legacy login route (for backward compatibility) */}
          <Route path='/login' element={<RoleSelection />} />


          {/* Catch-all route for 404 - Optional */}
          <Route path='*' element={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
                <p className="text-gray-300 mb-4">The page you're looking for doesn't exist.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
                >
                  Go Home
                </button>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App