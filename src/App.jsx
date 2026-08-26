import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { CategoriesSection } from './components/CategoriesSection';
import { CategoryDetailModal } from './components/CategoryDetailModal';
import { EventsSection } from './components/EventsSection';
import { EventDetailModal } from './components/EventDetailModal';
import { GallerySection } from './components/GallerySection';
import { LightboxModal } from './components/LightboxModal';
import { UploadModal } from './components/UploadModal';
import { ContactSection } from './components/ContactSection';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { AdminDashboard } from './admin/AdminDashboard';

export function App() {
  const { canManage } = useAuth();

  // View & Modal states
  const [currentView, setCurrentView] = useState('public'); // 'public' | 'admin'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [inviteTokenFromUrl, setInviteTokenFromUrl] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPresetCategory, setUploadPresetCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [toast, setToast] = useState(null);

  // Check URL parameters for private moderator invite link (?invite=mod_...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('invite');
      if (token) {
        setInviteTokenFromUrl(token);
        setAuthModalOpen(true);
      }
    } catch {}
  }, []);

  // Auto-switch to public if logged out or permissions revoked while in admin view
  useEffect(() => {
    if (!canManage && currentView === 'admin') {
      setCurrentView('public');
    }
  }, [canManage, currentView]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleOpenUpload = (categoryPreset = null) => {
    setUploadPresetCategory(categoryPreset);
    setUploadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-alpine-950 text-white font-sans selection:bg-cyan-400 selection:text-black">
      
      {/* Toast Notification System */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {currentView === 'admin' && canManage ? (
        /* Admin / Moderator Dashboard View */
        <AdminDashboard
          onBackToSite={() => setCurrentView('public')}
          onShowToast={showToast}
        />
      ) : (
        /* Public Website View */
        <div className="relative">
          
          {/* Fixed Header */}
          <Header
            onOpenAuth={() => {
              setInviteTokenFromUrl(null);
              setAuthModalOpen(true);
            }}
            onOpenUpload={() => handleOpenUpload()}
            onOpenAdmin={() => setCurrentView('admin')}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />

          {/* Main Content Sections */}
          <main>
            <Hero onOpenUpload={() => handleOpenUpload()} />
            <CategoriesSection onSelectCategory={(cat) => setSelectedCategory(cat)} />
            <EventsSection onSelectEvent={(evt) => setSelectedEvent(evt)} />
            <GallerySection
              onSelectPhoto={(photo) => setSelectedPhoto(photo)}
              onOpenUpload={(cat) => handleOpenUpload(cat)}
              onShowToast={showToast}
            />
            <AboutSection />
            <ContactSection onShowToast={showToast} />
          </main>

          {/* Footer */}
          <Footer
            onOpenAuth={() => {
              setInviteTokenFromUrl(null);
              setAuthModalOpen(true);
            }}
            onOpenAdmin={() => setCurrentView('admin')}
          />

          {/* Modals */}
          <CategoryDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onSelectPhoto={(photo) => setSelectedPhoto(photo)}
            onOpenUploadForCategory={(catId) => handleOpenUpload(catId)}
          />

          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onShowToast={showToast}
          />

          <LightboxModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onShowToast={showToast}
          />

          <UploadModal
            isOpen={uploadModalOpen}
            onClose={() => {
              setUploadModalOpen(false);
              setUploadPresetCategory(null);
            }}
            initialCategory={uploadPresetCategory}
            onShowToast={showToast}
          />

          <AuthModal
            isOpen={authModalOpen}
            onClose={() => {
              setAuthModalOpen(false);
              setInviteTokenFromUrl(null);
            }}
            onShowToast={showToast}
            initialInviteToken={inviteTokenFromUrl}
          />

        </div>
      )}

    </div>
  );
}

export default App;
