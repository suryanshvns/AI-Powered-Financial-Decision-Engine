import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppStateProvider } from './context/AppStateProvider'
import MainLayout from './layout/MainLayout'
import OverviewPage from './pages/OverviewPage'

const App = () => (
  <BrowserRouter>
    <AppStateProvider>
      <Toaster
        position="top-center"
        containerStyle={{ top: '1.25rem' }}
        toastOptions={{
          duration: 4200,
          className: '!font-sans !text-sm !shadow-lg !rounded-2xl !px-4 !py-3',
          style: {
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
            maxWidth: 'min(420px, 92vw)',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
          },
          success: {
            iconTheme: { primary: '#0d9488', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#e11d48', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppStateProvider>
  </BrowserRouter>
)

export default App
