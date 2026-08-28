import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_EVENTS,
  INITIAL_PHOTOS,
  INITIAL_MESSAGES
} from '../data/initialData';
import { useAuth } from './AuthContext';
import { fetchCloudKey, saveCloudKey, subscribeToCloudChanges } from '../lib/cloudSync';
import { fetchAllPhotos, saveAllPhotos, subscribeToPhotos } from '../lib/photoService';

const DataContext = createContext();

// Chiavi per app_state — Photos è gestita da photoService, NON da saveCloudKey direttamente
const CONTENT_KEY = 'content';
const EVENTS_KEY = 'events';
const MESSAGES_KEY = 'messages';
// PHOTOS_KEY è gestita internamente da photoService tramite app_state key='photos'

const LOCAL_CONTENT_KEY = 'heets_site_content_v2';
const LOCAL_EVENTS_KEY = 'heets_events_v2';
const LOCAL_MESSAGES_KEY = 'heets_messages_v2';

// Chiavi localStorage legacy contenenti foto — da eliminare immediatamente su ogni dispositivo
const LEGACY_PHOTO_KEYS = [
  'heets_photos_v2',
  'sheets_photos_v2',
  'hat_photos'
];

// ---------------------------------------------------------------------------
// Safe localStorage helpers — proteggono da QuotaExceededError e modalità privata
// ---------------------------------------------------------------------------
const safeGetLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[DataContext] Cannot save ${key} to localStorage (quota/private):`, err.message);
  }
};

const safeRemoveLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

// ---------------------------------------------------------------------------
// DataProvider
// ---------------------------------------------------------------------------
export const DataProvider = ({ children }) => {
  const { user, canManage, recordAuditAction } = useAuth();

  // 1. Site content
  const [siteContent, setSiteContent] = useState(() => {
    const saved = safeGetLocalStorage(LOCAL_CONTENT_KEY, INITIAL_SITE_CONTENT);
    if (saved && typeof saved === 'object') {
      delete saved.sponsors;
      return saved;
    }
    return INITIAL_SITE_CONTENT;
  });

  // 2. Events
  const [events, setEvents] = useState(() =>
    safeGetLocalStorage(LOCAL_EVENTS_KEY, INITIAL_EVENTS)
  );

  // 3. Photos — gestite da photoService via app_state, MAI in localStorage
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [photosLoading, setPhotosLoading] = useState(true);

  // 4. Messages
  const [messages, setMessages] = useState(() =>
    safeGetLocalStorage(LOCAL_MESSAGES_KEY, INITIAL_MESSAGES)
  );

  // ---------------------------------------------------------------------------
  // Effetto 1: Pulizia legacy + caricamento content/events/messages da CloudSync
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // Elimina immediatamente tutte le chiavi foto legacy dal localStorage
    LEGACY_PHOTO_KEYS.forEach(safeRemoveLocalStorage);

    const loadCloudData = async () => {
      try {
        const [cloudContent, cloudEvents, cloudMessages] = await Promise.all([
          fetchCloudKey(CONTENT_KEY, null),
          fetchCloudKey(EVENTS_KEY, null),
          fetchCloudKey(MESSAGES_KEY, null)
          // Photos NON vengono caricate qui: usano photoService sotto
        ]);

        if (!isMounted) return;

        if (cloudContent) {
          delete cloudContent.sponsors;
          setSiteContent(cloudContent);
          safeSetLocalStorage(LOCAL_CONTENT_KEY, cloudContent);
        } else {
          saveCloudKey(CONTENT_KEY, siteContent);
        }

        if (cloudEvents && Array.isArray(cloudEvents)) {
          setEvents(cloudEvents);
          safeSetLocalStorage(LOCAL_EVENTS_KEY, cloudEvents);
        } else {
          saveCloudKey(EVENTS_KEY, events);
        }

        if (cloudMessages && Array.isArray(cloudMessages)) {
          setMessages(cloudMessages);
          safeSetLocalStorage(LOCAL_MESSAGES_KEY, cloudMessages);
        } else {
          saveCloudKey(MESSAGES_KEY, messages);
        }
      } catch (err) {
        console.warn('[DataContext] Cloud sync error (content/events/messages):', err);
      }
    };

    loadCloudData();

    // Realtime per content/events/messages (NON photos — ha il proprio canale)
    const unsubscribeCloud = subscribeToCloudChanges((key, value) => {
      if (!isMounted || value == null) return;
      if (key === CONTENT_KEY) {
        delete value.sponsors;
        setSiteContent(value);
        safeSetLocalStorage(LOCAL_CONTENT_KEY, value);
      } else if (key === EVENTS_KEY && Array.isArray(value)) {
        setEvents(value);
        safeSetLocalStorage(LOCAL_EVENTS_KEY, value);
      } else if (key === MESSAGES_KEY && Array.isArray(value)) {
        setMessages(value);
        safeSetLocalStorage(LOCAL_MESSAGES_KEY, value);
      }
      // 'photos' non viene gestito qui: usa il canale dedicato sotto
    });

    return () => {
      isMounted = false;
      unsubscribeCloud();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Effetto 2: Caricamento foto + Realtime dedicato (via photoService)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      setPhotosLoading(true);
      const dbPhotos = await fetchAllPhotos();
      if (!isMounted) return;
      // Usa i dati del DB se presenti, altrimenti fallback ai dati iniziali
      setPhotos(dbPhotos.length > 0 ? dbPhotos : INITIAL_PHOTOS);
      setPhotosLoading(false);
    };

    loadPhotos();

    // Realtime: quando un altro device salva le foto in app_state, aggiorna qui
    const unsubscribePhotos = subscribeToPhotos((updatedPhotos) => {
      if (!isMounted) return;
      setPhotos(updatedPhotos);
    });

    return () => {
      isMounted = false;
      unsubscribePhotos();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Sync localStorage per dati leggeri (NO foto)
  // ---------------------------------------------------------------------------
  useEffect(() => { safeSetLocalStorage(LOCAL_CONTENT_KEY, siteContent); }, [siteContent]);
  useEffect(() => { safeSetLocalStorage(LOCAL_EVENTS_KEY, events); }, [events]);
  useEffect(() => { safeSetLocalStorage(LOCAL_MESSAGES_KEY, messages); }, [messages]);

  // ---------------------------------------------------------------------------
  // Security guard
  // ---------------------------------------------------------------------------
  const assertAuthorized = useCallback(() => {
    if (!user || (!canManage && user.role !== 'owner' && user.role !== 'moderator')) {
      throw new Error('Accesso negato: operazione riservata esclusivamente a Moderatori e Owner autorizzati.');
    }
    if (user.role === 'moderator' && user.isActive === false) {
      throw new Error("Account moderatore disattivato dall'Owner. Permesso revocato.");
    }
  }, [user, canManage]);

  // ---------------------------------------------------------------------------
  // Content Actions
  // ---------------------------------------------------------------------------
  const updateSiteContent = (updatedFields) => {
    assertAuthorized();
    const sanitized = { ...updatedFields };
    delete sanitized.sponsors;
    const newContent = { ...siteContent, ...sanitized };
    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);
    recordAuditAction?.('MODIFICA_CMS', 'Testi del Sito', 'Aggiornati testi, claim o info generali dal CMS');
  };

  const updateCategoryContent = (categoryId, newFields) => {
    assertAuthorized();
    const newContent = {
      ...siteContent,
      categories: siteContent.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...newFields } : cat
      )
    };
    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);
    recordAuditAction?.('MODIFICA_CATEGORIA', categoryId, `Aggiornata categoria ${categoryId}`);
  };

  const addCategoryCard = (newCardData) => {
    assertAuthorized();
    const newCard = {
      id: newCardData.id || 'card-' + Date.now(),
      title: newCardData.title || 'Nuovo Riquadro',
      slug: (newCardData.title || 'nuovo-riquadro').toLowerCase().replace(/\s+/g, '-'),
      shortDesc: newCardData.shortDesc || 'Descrizione breve del riquadro.',
      longDesc: newCardData.longDesc || '',
      coverImage: newCardData.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      accentColor: newCardData.accentColor || 'from-cyan-400 to-blue-600',
      badge: newCardData.badge || 'NUOVO',
      link: newCardData.link || '',
      buttonText: newCardData.buttonText || 'Scopri',
      order: (siteContent.categories?.length || 0) + 1,
      isActive: true
    };
    const newContent = { ...siteContent, categories: [...(siteContent.categories || []), newCard] };
    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);
    recordAuditAction?.('AGGIUNGI_RIQUADRO', newCard.title, `Aggiunto nuovo riquadro ${newCard.title}`);
    return newCard;
  };

  const deleteCategoryCard = (categoryId) => {
    assertAuthorized();
    const target = siteContent.categories.find(c => c.id === categoryId);
    const newContent = {
      ...siteContent,
      categories: siteContent.categories.filter(c => c.id !== categoryId)
    };
    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);
    recordAuditAction?.('ELIMINA_RIQUADRO', target?.title || categoryId, `Eliminato riquadro ${categoryId}`);
  };

  const reorderCategoryCards = (orderedCategories) => {
    assertAuthorized();
    const newContent = { ...siteContent, categories: orderedCategories };
    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);
    recordAuditAction?.('RIORDINA_RIQUADRI', 'Home Riquadri', 'Aggiornato ordine di visualizzazione dei riquadri');
  };

  // ---------------------------------------------------------------------------
  // Event Actions
  // ---------------------------------------------------------------------------
  const addEvent = (eventData) => {
    assertAuthorized();
    const newEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
      spotsLeft: eventData.spotsLeft || 50,
      isUpcoming: eventData.isUpcoming ?? true
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    saveCloudKey(EVENTS_KEY, updated);
    recordAuditAction?.('CREA_EVENTO', newEvent.title, `Creato nuovo evento per il ${newEvent.date} a ${newEvent.location}`);
    return newEvent;
  };

  const updateEvent = (eventId, eventData) => {
    assertAuthorized();
    const updated = events.map(evt => evt.id === eventId ? { ...evt, ...eventData } : evt);
    setEvents(updated);
    saveCloudKey(EVENTS_KEY, updated);
    recordAuditAction?.('MODIFICA_EVENTO', eventData.title || eventId, `Modificati dettagli evento ID ${eventId}`);
  };

  const deleteEvent = (eventId) => {
    assertAuthorized();
    const target = events.find(e => e.id === eventId);
    const updated = events.filter(evt => evt.id !== eventId);
    setEvents(updated);
    saveCloudKey(EVENTS_KEY, updated);
    recordAuditAction?.('ELIMINA_EVENTO', target?.title || eventId, `Eliminato evento ID ${eventId}`);
  };

  // ---------------------------------------------------------------------------
  // Photo Actions
  // Ogni operazione:
  //   1. Aggiorna lo stato React immediatamente (ottimistico → UI reattiva)
  //   2. Persiste su Supabase via photoService (app_state key='photos')
  //   3. ZERO localStorage, ZERO base64, ZERO CloudSync diretto per le foto
  // ---------------------------------------------------------------------------

  const uploadUserPhoto = async (photoData) => {
    const newPhoto = {
      id: 'ph-' + Date.now(),
      url: photoData.url,           // URL pubblico Supabase Storage (non base64)
      title: photoData.title || 'Momento speciale a Pinzolo',
      category: photoData.category || 'feste',
      author: photoData.author || (user?.name || 'Ospite'),
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      likes: 0
    };

    // Aggiornamento ottimistico immediato
    const updated = [newPhoto, ...photos];
    setPhotos(updated);

    // Persistenza su app_state (solo metadati URL, niente base64)
    await saveAllPhotos(updated);

    return newPhoto;
  };

  const approvePhoto = async (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.map(p => p.id === photoId ? { ...p, status: 'approved' } : p);
    setPhotos(updated);
    await saveAllPhotos(updated);
    recordAuditAction?.('APPROVA_FOTO', target?.title || photoId, `Approvata foto di ${target?.author || 'utente'}`);
  };

  const rejectPhoto = async (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.filter(p => p.id !== photoId);
    setPhotos(updated);
    await saveAllPhotos(updated);
    recordAuditAction?.('RIFIUTA_FOTO', target?.title || photoId, `Rifiutata foto di ${target?.author || 'utente'}`);
  };

  const deletePhoto = async (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.filter(p => p.id !== photoId);
    setPhotos(updated);
    await saveAllPhotos(updated);
    recordAuditAction?.('ELIMINA_FOTO_GALLERY', target?.title || photoId, 'Rimossa foto dalla gallery');
  };

  const likePhoto = async (photoId) => {
    const updated = photos.map(p =>
      p.id === photoId ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    setPhotos(updated);
    await saveAllPhotos(updated);
  };

  // ---------------------------------------------------------------------------
  // Message Actions
  // ---------------------------------------------------------------------------
  const sendContactMessage = (msgData) => {
    const newMsg = {
      ...msgData,
      id: 'msg-' + Date.now(),
      createdAt: new Date().toISOString(),
      read: false
    };
    const updated = [newMsg, ...messages];
    setMessages(updated);
    saveCloudKey(MESSAGES_KEY, updated);
    return newMsg;
  };

  const markMessageAsRead = (msgId) => {
    assertAuthorized();
    const updated = messages.map(m => m.id === msgId ? { ...m, read: true } : m);
    setMessages(updated);
    saveCloudKey(MESSAGES_KEY, updated);
  };

  const deleteMessage = (msgId) => {
    assertAuthorized();
    const updated = messages.filter(m => m.id !== msgId);
    setMessages(updated);
    saveCloudKey(MESSAGES_KEY, updated);
    recordAuditAction?.('ELIMINA_MESSAGGIO', msgId, `Eliminato messaggio ID ${msgId}`);
  };

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  const resetToDefaults = async () => {
    assertAuthorized();
    setSiteContent(INITIAL_SITE_CONTENT);
    setEvents(INITIAL_EVENTS);
    setMessages(INITIAL_MESSAGES);
    saveCloudKey(CONTENT_KEY, INITIAL_SITE_CONTENT);
    saveCloudKey(EVENTS_KEY, INITIAL_EVENTS);
    saveCloudKey(MESSAGES_KEY, INITIAL_MESSAGES);
    // Le foto NON vengono resettate automaticamente: troppo rischio di perdita dati
    recordAuditAction?.('RESET_DEFAULT', 'Contenuti del Sito', 'Ripristinati testi, categorie e messaggi predefiniti');
  };

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  const approvedPhotos = photos.filter(p => p.status === 'approved');
  const pendingPhotos = photos.filter(p => p.status === 'pending');
  const upcomingEvents = events.filter(e => e.isUpcoming !== false);
  const pastEvents = events.filter(e => e.isUpcoming === false);

  return (
    <DataContext.Provider
      value={{
        siteContent,
        events,
        upcomingEvents,
        pastEvents,
        photos,
        approvedPhotos,
        pendingPhotos,
        photosLoading,
        messages,
        updateSiteContent,
        updateCategoryContent,
        addCategoryCard,
        deleteCategoryCard,
        reorderCategoryCards,
        addEvent,
        updateEvent,
        deleteEvent,
        uploadUserPhoto,
        approvePhoto,
        rejectPhoto,
        deletePhoto,
        likePhoto,
        sendContactMessage,
        markMessageAsRead,
        deleteMessage,
        resetToDefaults
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
