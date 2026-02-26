import { useCallback, useEffect, useState } from 'react';
import type { Encuesta, RegionCode } from '../types';
import { REGIONES_PERU } from '../config/constants';
import { useDemoData } from '../context/DemoDataContext';
import Navbar from '../components/layout/Navbar';
import MobileMenu from '../components/layout/MobileMenu';
import Footer from '../components/layout/Footer';
import WhatsAppFloat from '../components/layout/WhatsAppFloat';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import MapSection from '../components/landing/MapSection';
import MapActiveFilter from '../components/map/MapActiveFilter';
import EncuestaGrid from '../components/encuesta/EncuestaGrid';
import ResultsSection from '../components/landing/ResultsSection';
import HowToSection from '../components/landing/HowToSection';
import TrustSection from '../components/landing/TrustSection';
import NewsSection from '../components/landing/NewsSection';
import NewsletterSection from '../components/landing/NewsletterSection';

export default function LandingPage() {
  const { api, data } = useDemoData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | null>(null);
  const [currentTipo, setCurrentTipo] = useState('TODOS');
  const [filteredEncuestas, setFilteredEncuestas] = useState<Encuesta[]>([]);

  const loadEncuestas = useCallback(async () => {
    const result = await api.getEncuestasByFilter(
      selectedRegion || 'TODOS',
      currentTipo,
    );
    setFilteredEncuestas(result.encuestas);
  }, [api, selectedRegion, currentTipo]);

  useEffect(() => { loadEncuestas(); }, [loadEncuestas]);

  const handleRegionChange = useCallback((region: RegionCode | null) => {
    setSelectedRegion(region);
  }, []);

  const handleClearFilter = useCallback(() => {
    setSelectedRegion(null);
    setCurrentTipo('TODOS');
  }, []);

  const activeEncuesta = data.encuestas.find(e => e.estado === 'activa');
  const regionName = selectedRegion && REGIONES_PERU[selectedRegion]
    ? REGIONES_PERU[selectedRegion].nombre
    : null;

  return (
    <>
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <HeroSection activeEncuesta={activeEncuesta} />
      <StatsSection stats={data.estadisticas} />
      <NewsSection noticias={data.noticias} />
      <MapSection
        selectedRegion={selectedRegion}
        currentTipo={currentTipo}
        onRegionChange={handleRegionChange}
        onTipoChange={setCurrentTipo}
      />

      <section className="section encuestas-section" id="encuestas">
        <div className="container">
          <MapActiveFilter
            label={regionName || ''}
            visible={!!selectedRegion}
            onClear={handleClearFilter}
          />
          <h2 className="section-title">Encuestas Activas</h2>
          <p className="section-subtitle">Participa y haz que tu voz cuente</p>
          <EncuestaGrid encuestas={filteredEncuestas} regionName={regionName} />
        </div>
      </section>

      <ResultsSection />
      <HowToSection />
      <TrustSection />
      <NewsletterSection />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
