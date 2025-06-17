import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Client from './Client/Client'
import Home from './Client/components/Home/Home'
import RoleSelection from './Client/components/RoleSelection/RoleSelection'



const App = () => {
  return (
      <BrowserRouter>
        <Routes>
          
          <Route path='/' element={<Client />}>
            <Route index element={<Home />} />
          </Route>

          <Route path='/select-role' element={<RoleSelection />} />
          
          
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
  )
}

export default App