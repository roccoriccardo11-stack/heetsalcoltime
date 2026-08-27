import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CategoryImageUploader } from '../components/CategoryImageUploader';

export const ContentEditor = ({ onShowToast }) => {
  const { siteContent, updateSiteContent, resetToDefaults } = useData();
  const [formData, setFormData] = useState(siteContent);
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'about' | 'categories' | 'contacts'

  const handleHeroChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const handleAboutChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: value
      }
    }));
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCats = [...formData.categories];
    updatedCats[index] = {
      ...updatedCats[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      categories: updatedCats
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [field]: value
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSiteContent(formData);
    if (onShowToast) {
      onShowToast('Tutti i testi e contenuti del sito sono stati aggiornati!', 'success');
    }
  };

  const handleReset = () => {
    if (confirm('Vuoi ripristinare tutti i testi e dati ai valori predefiniti?')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Save & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
            EDITOR TESTI & CONTENUTI CMS
          </h3>
          <p className="text-xs text-zinc-400">Modifica testi, claim, categorie e contatti senza toccare codice</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-cyan-500/20 text-xs font-mono"
            title="Ripristina testi originali"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salva Modifiche</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'hero', label: '1. Hero & Claim' },
          { id: 'about', label: '2. Chi Siamo' },
          { id: 'categories', label: '3. Categorie (5)' },
          { id: 'contacts', label: '4. Social & Contatti' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
                : 'bg-alpine-900 text-zinc-400 hover:text-white border border-cyan-500/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Sections */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* TAB 1: HERO */}
        {activeTab === 'hero' && (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 animate-fadeIn">
            <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Hero Section & Claim Principale
            </h4>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Claim Centrale (in maiuscolo spaziato) *</label>
              <input
                type="text"
                value={formData.hero.claim}
                onChange={(e) => handleHeroChange('claim', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm font-mono font-bold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Badge Superiore</label>
                <input
                  type="text"
                  value={formData.hero.badge}
                  onChange={(e) => handleHeroChange('badge', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Tag Location Footer Hero</label>
                <input
                  type="text"
                  value={formData.hero.locationTag}
                  onChange={(e) => handleHeroChange('locationTag', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Sottotitolo / Descrizione Hero</label>
              <textarea
                rows={2}
                value={formData.hero.subtitle}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Bottone Primario</label>
                <input
                  type="text"
                  value={formData.hero.ctaPrimary}
                  onChange={(e) => handleHeroChange('ctaPrimary', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Bottone Secondario</label>
                <input
                  type="text"
                  value={formData.hero.ctaSecondary}
                  onChange={(e) => handleHeroChange('ctaSecondary', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHI SIAMO */}
        {activeTab === 'about' && (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 animate-fadeIn">
            <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Presentazione Gruppo ("Chi Siamo")
            </h4>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo Sezione</label>
              <input
                type="text"
                value={formData.about.title}
                onChange={(e) => handleAboutChange('title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Principale di Presentazione *</label>
              <textarea
                rows={5}
                value={formData.about.text}
                onChange={(e) => handleAboutChange('text', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none leading-relaxed"
              ></textarea>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIE */}
        {activeTab === 'categories' && (
          <div className="space-y-4 animate-fadeIn">
            {formData.categories.map((cat, idx) => (
              <div key={cat.id} className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                  <span className="font-display font-bold text-sm text-cyan-400 uppercase">
                    {idx + 1}. {cat.title} ({cat.id})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{cat.badge}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Titolo Categoria</label>
                  <input
                    type="text"
                    value={cat.title}
                    onChange={(e) => handleCategoryChange(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-alpine-950/70 border border-cyan-500/15">
                  <CategoryImageUploader
                    currentImageUrl={cat.coverImage}
                    onImageChange={(newUrl) => handleCategoryChange(idx, 'coverImage', newUrl)}
                    onError={(err) => {
                      if (onShowToast) onShowToast(err, 'error');
                    }}
                    label="Copertina Categoria (Carica File o URL)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Descrizione Breve (2 righe per card) *</label>
                  <input
                    type="text"
                    value={cat.shortDesc}
                    onChange={(e) => handleCategoryChange(idx, 'shortDesc', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Descrizione Estesa Pagina Categoria</label>
                  <textarea
                    rows={2}
                    value={cat.longDesc || ''}
                    onChange={(e) => handleCategoryChange(idx, 'longDesc', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CONTATTI */}
        {activeTab === 'contacts' && (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 animate-fadeIn">
            <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Social, WhatsApp & Canali Ufficiali
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={formData.contacts.instagram}
                  onChange={(e) => handleContactChange('instagram', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={formData.contacts.instagramHandle}
                  onChange={(e) => handleContactChange('instagramHandle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">TikTok URL</label>
                <input
                  type="url"
                  value={formData.contacts.tiktok}
                  onChange={(e) => handleContactChange('tiktok', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">TikTok Handle</label>
                <input
                  type="text"
                  value={formData.contacts.tiktokHandle}
                  onChange={(e) => handleContactChange('tiktokHandle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Numero WhatsApp (senza +)</label>
                <input
                  type="text"
                  value={formData.contacts.whatsappNumber}
                  onChange={(e) => handleContactChange('whatsappNumber', e.target.value)}
                  placeholder="393450000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email di Contatto</label>
                <input
                  type="email"
                  value={formData.contacts.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Location</label>
              <input
                type="text"
                value={formData.contacts.location}
                onChange={(e) => handleContactChange('location', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salva e Applica Modifiche</span>
          </button>
        </div>

      </form>

    </div>
  );
};
