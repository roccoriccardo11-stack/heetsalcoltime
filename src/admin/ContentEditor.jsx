import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Link2,
  Heart
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { CategoryImageUploader } from '../components/CategoryImageUploader';

export const ContentEditor = ({ onShowToast }) => {
  const { siteContent, updateSiteContent, resetToDefaults } = useData();
  const [formData, setFormData] = useState(siteContent);
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'about' | 'categories' | 'contacts'

  // Sync state if siteContent changes externally
  useEffect(() => {
    if (siteContent) {
      setFormData(siteContent);
    }
  }, [siteContent]);

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

  const handleAboutStatChange = (index, field, value) => {
    setFormData(prev => {
      const existingStats = prev.about?.stats && Array.isArray(prev.about.stats)
        ? [...prev.about.stats]
        : [
            { value: '6+', label: 'Anni di Feste' },
            { value: '80+', label: 'Eventi Organizzati' },
            { value: '1000+', label: 'Momenti in Quota' }
          ];

      while (existingStats.length <= index) {
        existingStats.push({ value: '', label: '' });
      }

      existingStats[index] = {
        ...existingStats[index],
        [field]: value
      };

      return {
        ...prev,
        about: {
          ...prev.about,
          stats: existingStats.slice(0, 3)
        }
      };
    });
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCats = [...(formData.categories || [])];
    updatedCats[index] = {
      ...updatedCats[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      categories: updatedCats
    }));
  };

  const handleAddCategory = () => {
    const newIdx = (formData.categories?.length || 0) + 1;
    const newCard = {
      id: 'card-' + Date.now(),
      title: `Nuovo Riquadro ${newIdx}`,
      slug: `nuovo-riquadro-${newIdx}`,
      shortDesc: 'Inserisci qui una breve descrizione del formato o evento.',
      longDesc: '',
      coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      accentColor: 'from-cyan-400 to-blue-600',
      badge: 'FORMAT',
      link: '',
      buttonText: 'Scopri',
      order: newIdx,
      isActive: true
    };

    setFormData(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCard]
    }));

    if (onShowToast) {
      onShowToast('Nuovo riquadro aggiunto alla lista! Compila i campi e premi Salva.', 'info');
    }
  };

  const handleDeleteCategory = (index) => {
    const catToDelete = formData.categories[index];
    if (confirm(`Sei sicuro di voler eliminare il riquadro "${catToDelete.title}"?`)) {
      const updatedCats = formData.categories.filter((_, i) => i !== index);
      // Re-index order
      const reindexed = updatedCats.map((c, i) => ({ ...c, order: i + 1 }));
      setFormData(prev => ({
        ...prev,
        categories: reindexed
      }));
      if (onShowToast) {
        onShowToast(`Riquadro "${catToDelete.title}" rimosso. Ricordati di salvare le modifiche!`, 'info');
      }
    }
  };

  const handleMoveCategory = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.categories.length) return;

    const updatedCats = [...formData.categories];
    const temp = updatedCats[index];
    updatedCats[index] = updatedCats[targetIndex];
    updatedCats[targetIndex] = temp;

    // Update order values
    const reindexed = updatedCats.map((c, i) => ({ ...c, order: i + 1 }));
    setFormData(prev => ({
      ...prev,
      categories: reindexed
    }));
  };

  const handleToggleCategoryActive = (index) => {
    const updatedCats = [...formData.categories];
    const currentStatus = updatedCats[index].isActive !== false;
    updatedCats[index] = {
      ...updatedCats[index],
      isActive: !currentStatus
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
    if (e && e.preventDefault) e.preventDefault();
    updateSiteContent(formData);
    if (onShowToast) {
      onShowToast('Modifiche salvate correttamente.', 'success');
    }
  };

  const handleReset = () => {
    if (confirm('Vuoi ripristinare tutti i testi e dati ai valori predefiniti?')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  const categoriesCount = formData.categories?.length || 0;
  const activeCategoriesCount = formData.categories?.filter(c => c.isActive !== false).length || 0;

  return (
    <div className="space-y-6">
      
      {/* Top Save & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
            EDITOR CONTENUTI & GRAFICA CMS
          </h3>
          <p className="text-xs text-zinc-400">Modifica testi, immagine Hero, riquadri/card e contatti del sito</p>
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
          { id: 'hero', label: '1. Hero & Immagine Principale' },
          { id: 'about', label: '2. Chi Siamo' },
          { id: 'categories', label: `3. Riquadri Home (${activeCategoriesCount}/${categoriesCount})` },
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

      {/* Editor Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* TAB 1: HERO */}
        {activeTab === 'hero' && (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-6 animate-fadeIn">
            <div>
              <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Hero Section — Immagine Principale & Testi
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Personalizza l'immagine di sfondo e tutti i titoli/testi visualizzati nella schermata iniziale del sito.
              </p>
            </div>

            {/* Hero Background Image Uploader */}
            <div className="p-5 rounded-2xl bg-alpine-950/70 border border-cyan-500/25 space-y-2">
              <CategoryImageUploader
                currentImageUrl={formData.hero?.backgroundImage || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=85"}
                onImageChange={(newUrl) => handleHeroChange('backgroundImage', newUrl)}
                onError={(err) => {
                  if (onShowToast) onShowToast(err, 'error');
                }}
                label="Immagine di Sfondo Principale (Hero Background)"
              />
            </div>

            {/* Hero Main Title */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo Principale Hero *</label>
              <input
                type="text"
                value={formData.hero?.title || "HEETS ALCOL TIME"}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                placeholder="HEETS ALCOL TIME"
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm font-display font-black tracking-wide focus:outline-none"
              />
            </div>

            {/* Hero Claim */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Claim Centrale (in maiuscolo spaziato) *</label>
              <input
                type="text"
                value={formData.hero?.claim || ''}
                onChange={(e) => handleHeroChange('claim', e.target.value)}
                placeholder="PINZOLO · MADONNA DI CAMPIGLIO · TUTTO L'ANNO"
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm font-mono font-bold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Badge Superiore</label>
                <input
                  type="text"
                  value={formData.hero?.badge || ''}
                  onChange={(e) => handleHeroChange('badge', e.target.value)}
                  placeholder="ALPS · SKI · NIGHTS · PARTY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Tag Location Footer Hero</label>
                <input
                  type="text"
                  value={formData.hero?.locationTag || ''}
                  onChange={(e) => handleHeroChange('locationTag', e.target.value)}
                  placeholder="Pinzolo & Madonna di Campiglio · Val Rendena"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Sottotitolo / Descrizione Hero</label>
              <textarea
                rows={2}
                value={formData.hero?.subtitle || ''}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none leading-relaxed"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Bottone Primario</label>
                <input
                  type="text"
                  value={formData.hero?.ctaPrimary || ''}
                  onChange={(e) => handleHeroChange('ctaPrimary', e.target.value)}
                  placeholder="Prossimi Eventi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Bottone Secondario</label>
                <input
                  type="text"
                  value={formData.hero?.ctaSecondary || ''}
                  onChange={(e) => handleHeroChange('ctaSecondary', e.target.value)}
                  placeholder="Guarda i Momenti"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHI SIAMO */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Left side card: Testi Principali */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4">
              <div>
                <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Heart className="w-4 h-4 text-cyan-400" />
                  1. Parte Sinistra — Testi Principali ("Chi Siamo")
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Modifica il titolo e il testo descrittivo principale visualizzato a sinistra.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo Sezione</label>
                <input
                  type="text"
                  value={formData.about?.title || ''}
                  onChange={(e) => handleAboutChange('title', e.target.value)}
                  placeholder="NON SOLO AMICI, UNA SECONDA FAMIGLIA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Principale di Presentazione *</label>
                <textarea
                  rows={5}
                  value={formData.about?.text || ''}
                  onChange={(e) => handleAboutChange('text', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none leading-relaxed"
                ></textarea>
              </div>
            </div>

            {/* Right side card: Contenuto laterale (Immagine e 3 Riquadri) */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-6">
              <div>
                <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  2. Parte Destra — Contenuto Laterale (Immagine e 3 Riquadri)
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Sostituisci l'immagine e personalizza singolarmente i 3 riquadri numerici con valori e descrizioni.
                </p>
              </div>

              {/* Immagine Sezione Chi Siamo */}
              <div className="p-5 rounded-2xl bg-alpine-950/70 border border-cyan-500/25 space-y-2">
                <CategoryImageUploader
                  currentImageUrl={formData.about?.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80"}
                  onImageChange={(newUrl) => handleAboutChange('image', newUrl)}
                  onError={(err) => {
                    if (onShowToast) onShowToast(err, 'error');
                  }}
                  label="Immagine Chi Siamo (Destra)"
                />
              </div>

              {/* I 3 Riquadri Numerici */}
              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  I 3 Riquadri (Valori e Testi)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Riquadro 1 */}
                  <div className="p-4 rounded-2xl bg-alpine-950/80 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Riquadro 1</span>
                      <span className="text-[10px] font-mono text-zinc-400">Box #1</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Valore</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[0]?.value ?? '6+'}
                        onChange={(e) => handleAboutStatChange(0, 'value', e.target.value)}
                        placeholder="es. 6+ o 12+"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white font-bold text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo / Testo</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[0]?.label ?? 'Anni di Feste'}
                        onChange={(e) => handleAboutStatChange(0, 'label', e.target.value)}
                        placeholder="es. Anni di Feste o Eventi organizzati"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Riquadro 2 */}
                  <div className="p-4 rounded-2xl bg-alpine-950/80 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Riquadro 2</span>
                      <span className="text-[10px] font-mono text-zinc-400">Box #2</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Valore</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[1]?.value ?? '80+'}
                        onChange={(e) => handleAboutStatChange(1, 'value', e.target.value)}
                        placeholder="es. 80+"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white font-bold text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo / Testo</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[1]?.label ?? 'Eventi Organizzati'}
                        onChange={(e) => handleAboutStatChange(1, 'label', e.target.value)}
                        placeholder="es. Eventi Organizzati"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Riquadro 3 */}
                  <div className="p-4 rounded-2xl bg-alpine-950/80 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Riquadro 3</span>
                      <span className="text-[10px] font-mono text-zinc-400">Box #3</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Valore</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[2]?.value ?? '1000+'}
                        onChange={(e) => handleAboutStatChange(2, 'value', e.target.value)}
                        placeholder="es. 1000+"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white font-bold text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo / Testo</label>
                      <input
                        type="text"
                        value={formData.about?.stats?.[2]?.label ?? 'Momenti in Quota'}
                        onChange={(e) => handleAboutStatChange(2, 'label', e.target.value)}
                        placeholder="es. Momenti in Quota o Community & Amici"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-900 border border-cyan-500/20 focus:border-cyan-400 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pulsante Salva dedicato per comodità */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Modifiche Chi Siamo</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CATEGORIE / RIQUADRI */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Toolbar for Cards */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-alpine-900/80 border border-cyan-500/20">
              <div>
                <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Gestione Riquadri della Home ({categoriesCount})
                </h4>
                <p className="text-xs text-zinc-400">
                  Aggiungi, modifica, riordina o nascondi i riquadri visualizzati nella Home.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Riquadro</span>
              </button>
            </div>

            {/* List of Cards */}
            <div className="space-y-5">
              {formData.categories?.map((cat, idx) => {
                const isActive = cat.isActive !== false;

                return (
                  <div
                    key={cat.id || idx}
                    className={`glass-panel p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                      isActive ? 'border-cyan-500/25 bg-alpine-900/90' : 'border-zinc-700/50 bg-alpine-950/70 opacity-75'
                    }`}
                  >
                    {/* Card Header & Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-display font-black text-base text-white uppercase tracking-tight">
                          {cat.title || 'Nuovo Riquadro'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                          {cat.badge || 'FORMAT'}
                        </span>
                      </div>

                      {/* Controls: Active toggle, Reorder, Delete */}
                      <div className="flex items-center gap-1.5">
                        {/* Active/Inactive Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(idx)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                          }`}
                          title={isActive ? 'Riquadro visibile nella Home' : 'Riquadro nascosto'}
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Attivo' : 'Nascosto'}</span>
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-alpine-950 hover:bg-cyan-950/60 text-zinc-300 hover:text-cyan-300 border border-cyan-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Sposta Su"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'down')}
                          disabled={idx === formData.categories.length - 1}
                          className="p-1.5 rounded-lg bg-alpine-950 hover:bg-cyan-950/60 text-zinc-300 hover:text-cyan-300 border border-cyan-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Sposta Giù"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(idx)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors ml-1"
                          title="Elimina Riquadro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Uploader */}
                    <div className="p-4 rounded-2xl bg-alpine-950/70 border border-cyan-500/15">
                      <CategoryImageUploader
                        currentImageUrl={cat.coverImage}
                        onImageChange={(newUrl) => handleCategoryChange(idx, 'coverImage', newUrl)}
                        onError={(err) => {
                          if (onShowToast) onShowToast(err, 'error');
                        }}
                        label={`Copertina Riquadro ${idx + 1} (Carica File o URL)`}
                      />
                    </div>

                    {/* Title & Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Titolo Riquadro *</label>
                        <input
                          type="text"
                          value={cat.title}
                          onChange={(e) => handleCategoryChange(idx, 'title', e.target.value)}
                          placeholder="es. Feste & Collette"
                          className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Categoria / Etichetta Badge</label>
                        <input
                          type="text"
                          value={cat.badge || ''}
                          onChange={(e) => handleCategoryChange(idx, 'badge', e.target.value)}
                          placeholder="es. NIGHTLIFE, WINTER VIBES"
                          className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Link Destination & Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-cyan-400" />
                          <span>Link di Destinazione / Pagina (lascia vuoto per aprire modale)</span>
                        </label>
                        <input
                          type="text"
                          value={cat.link || ''}
                          onChange={(e) => handleCategoryChange(idx, 'link', e.target.value)}
                          placeholder="es. #eventi, #gallery, https://..."
                          className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Testo Bottone / Azione</label>
                        <input
                          type="text"
                          value={cat.buttonText || 'Scopri'}
                          onChange={(e) => handleCategoryChange(idx, 'buttonText', e.target.value)}
                          placeholder="es. Scopri, Guarda Foto"
                          className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Short Description */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Descrizione Breve (visualizzata sulla card) *</label>
                      <input
                        type="text"
                        value={cat.shortDesc || ''}
                        onChange={(e) => handleCategoryChange(idx, 'shortDesc', e.target.value)}
                        placeholder="Breve descrizione di max 2 righe"
                        className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Long Description */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Descrizione Estesa (mostrata nella modale di dettaglio)</label>
                      <textarea
                        rows={2}
                        value={cat.longDesc || ''}
                        onChange={(e) => handleCategoryChange(idx, 'longDesc', e.target.value)}
                        placeholder="Descrizione completa..."
                        className="w-full px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white focus:outline-none resize-none leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                );
              })}
            </div>

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
                  value={formData.contacts?.instagram || ''}
                  onChange={(e) => handleContactChange('instagram', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={formData.contacts?.instagramHandle || ''}
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
                  value={formData.contacts?.tiktok || ''}
                  onChange={(e) => handleContactChange('tiktok', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">TikTok Handle</label>
                <input
                  type="text"
                  value={formData.contacts?.tiktokHandle || ''}
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
                  value={formData.contacts?.whatsappNumber || ''}
                  onChange={(e) => handleContactChange('whatsappNumber', e.target.value)}
                  placeholder="393450000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email di Contatto</label>
                <input
                  type="email"
                  value={formData.contacts?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Testo Location</label>
              <input
                type="text"
                value={formData.contacts?.location || ''}
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
