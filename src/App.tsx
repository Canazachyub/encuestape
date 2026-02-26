import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DemoDataProvider } from './context/DemoDataContext';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import VotarPage from './pages/VotarPage';
import ResultadosPage from './pages/ResultadosPage';
import NoticiasPage from './pages/NoticiasPage';
import ArticuloPage from './pages/ArticuloPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <DemoDataProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/votar/:id" element={<VotarPage />} />
            <Route path="/resultados" element={<ResultadosPage />} />
            <Route path="/resultados/:id" element={<ResultadosPage />} />
            <Route path="/noticias" element={<NoticiasPage />} />
            <Route path="/noticias/:id" element={<ArticuloPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DemoDataProvider>
  );
}
