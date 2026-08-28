import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_EVENTS,
  INITIAL_PHOTOS,
  INITIAL_MESSAGES
} from '../data/initialData';
import { useAuth } from './AuthContext';
import { fetchCloudKey, saveCloudKey, subscribeToCloudChanges } from '../lib/cloudSync';

const DataContext = createContext();

const CONTENT_KEY = 'content';
const EVENTS_KEY = 'events';
const PHOTOS_KEY = 'photos';
const MESSAGES_KEY = 'messages';

const LOCAL_CONTENT_KEY = 'heets_site_content_v2';
const LOCAL_EVENTS_KEY = 'heets_events_v2';
const LOCAL_MESSAGES_KEY = 'heets_messages_v2';
const LEGACY_LOCAL_PHOTOS_KEY = 'sheets_photos_v2';

// Safe localStorage helpers to prevent any QuotaExceededError or SecurityError from crashing the app
const safeGetLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.warn(`[DataContext] Could not read ${key} from storage:`, err);
    return fallback;
  }
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[DataContext] Could not save ${key} to storage (quota or private mode):`, err);
  }
};

const safeRemoveLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[DataContext] Could not remove ${key} from storage:`, err);
  }
};

export const DataProvider = ({ children }) => {
  const { user, canManage, recordAuditAction } = useAuth();

  // 1. Site content (Hero, about, categories, contacts)
  const [siteContent, setSiteContent] = useState(() => {
    const saved = safeGetLocalStorage(LOCAL_CONTENT_KEY, INITIAL_SITE_CONTENT);
    if (saved && typeof saved === 'object') {
      delete saved.sponsors;
      return saved;
    }
    return INITIAL_SITE_CONTENT;
  });

  // 2. Events list
  const [events, setEvents] = useState(() => {
    return safeGetLocalStorage(LOCAL_EVENTS_KEY, INITIAL_EVENTS);
  });

  // 3. Photos (approved & pending) - MUST NOT be stored in localStorage (served directly from Supabase)
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);

  // 4. Contact messages
  const [messages, setMessages] = useState(() => {
    return safeGetLocalStorage(LOCAL_MESSAGES_KEY, INITIAL_MESSAGES);
  });

  // 1. Initial Cloud Sync on Mount & Safe legacy cleanup
  useEffect(() => {
    let isMounted = true;

    // Safely remove legacy photos cache from localStorage if present to free quota immediately
    safeRemoveLocalStorage(LEGACY_LOCAL_PHOTOS_KEY);
    safeRemoveLocalStorage('hat_photos');

    const loadCloudData = async () => {
      try {
        const [cloudContent, cloudEvents, cloudPhotos, cloudMessages] = await Promise.all([
          fetchCloudKey(CONTENT_KEY, null),
          fetchCloudKey(EVENTS_KEY, null),
          fetchCloudKey(PHOTOS_KEY, null),
          fetchCloudKey(MESSAGES_KEY, null)
        ]);

        if (!isMounted) return;

        if (cloudContent) {
          delete cloudContent.sponsors;
          setSiteContent(cloudContent);
          safeSetLocalStorage(LOCAL_CONTENT_KEY, cloudContent);
        } else {
          // Seed cloud if empty
          saveCloudKey(CONTENT_KEY, siteContent);
        }

        if (cloudEvents && Array.isArray(cloudEvents)) {
          setEvents(cloudEvents);
          safeSetLocalStorage(LOCAL_EVENTS_KEY, cloudEvents);
        } else {
          saveCloudKey(EVENTS_KEY, events);
        }

        if (cloudPhotos && Array.isArray(cloudPhotos)) {
          // Photos loaded into React state directly from Supabase, NO localStorage writing
          setPhotos(cloudPhotos);
        } else {
          saveCloudKey(PHOTOS_KEY, photos);
        }

        if (cloudMessages && Array.isArray(cloudMessages)) {
          setMessages(cloudMessages);
          safeSetLocalStorage(LOCAL_MESSAGES_KEY, cloudMessages);
        } else {
          saveCloudKey(MESSAGES_KEY, messages);
        }
      } catch (err) {
        console.warn('[DataContext] Cloud sync error on load:', err);
      }
    };

    loadCloudData();

    // 2. Real-time Live Subscription for cross-device instant sync
    const unsubscribe = subscribeToCloudChanges((key, value) => {
      if (!isMounted || value === undefined || value === null) return;

      if (key === CONTENT_KEY) {
        delete value.sponsors;
        setSiteContent(value);
        safeSetLocalStorage(LOCAL_CONTENT_KEY, value);
      } else if (key === EVENTS_KEY && Array.isArray(value)) {
        setEvents(value);
        safeSetLocalStorage(LOCAL_EVENTS_KEY, value);
      } else if (key === PHOTOS_KEY && Array.isArray(value)) {
        // Live updates update React state directly, NO localStorage write
        setPhotos(value);
      } else if (key === MESSAGES_KEY && Array.isArray(value)) {
        setMessages(value);
        safeSetLocalStorage(LOCAL_MESSAGES_KEY, value);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync state to LocalStorage for light text data only
  useEffect(() => {
    safeSetLocalStorage(LOCAL_CONTENT_KEY, siteContent);
  }, [siteContent]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_EVENTS_KEY, events);
  }, [events]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_MESSAGES_KEY, messages);
  }, [messages]);

  // Security guard for administrative functions
  const assertAuthorized = useCallback(() => {
    if (!user || (!canManage && user.role !== 'owner' && user.role !== 'moderator')) {
      throw new Error('Accesso negato: operazione riservata esclusivamente a Moderatori e Owner autorizzati.');
    }
    if (user.role === 'moderator' && user.isActive === false) {
      throw new Error('Account moderatore disattivato dall\'Owner. Permesso revocato.');
    }
  }, [user, canManage]);

  // Content Actions
  const updateSiteContent = (updatedFields) => {
    assertAuthorized();
    const sanitized = { ...updatedFields };
    delete sanitized.sponsors;

    const newContent = {
      ...siteContent,
      ...sanitized
    };

    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_CMS', 'Testi del Sito', 'Aggiornati testi, claim o info generali dal CMS');
    }
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

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_CATEGORIA', categoryId, `Aggiornata categoria ${categoryId}`);
    }
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

    const newContent = {
      ...siteContent,
      categories: [...(siteContent.categories || []), newCard]
    };

    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);

    if (recordAuditAction) {
      recordAuditAction('AGGIUNGI_RIQUADRO', newCard.title, `Aggiunto nuovo riquadro ${newCard.title}`);
    }
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

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_RIQUADRO', target?.title || categoryId, `Eliminato riquadro ${categoryId}`);
    }
  };

  const reorderCategoryCards = (orderedCategories) => {
    assertAuthorized();
    const newContent = {
      ...siteContent,
      categories: orderedCategories
    };

    setSiteContent(newContent);
    saveCloudKey(CONTENT_KEY, newContent);

    if (recordAuditAction) {
      recordAuditAction('RIORDINA_RIQUADRI', 'Home Riquadri', 'Aggiornato ordine di visualizzazione dei riquadri');
    }
  };

  // Event Actions
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

    if (recordAuditAction) {
      recordAuditAction('CREA_EVENTO', newEvent.title, `Creato nuovo evento per il ${newEvent.date} a ${newEvent.location}`);
    }
    return newEvent;
  };

  const updateEvent = (eventId, eventData) => {
    assertAuthorized();
    const updated = events.map(evt => (evt.id === eventId ? { ...evt, ...eventData } : evt));
    setEvents(updated);
    saveCloudKey(EVENTS_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_EVENTO', eventData.title || eventId, `Modificati dettagli evento ID ${eventId}`);
    }
  };

  const deleteEvent = (eventId) => {
    assertAuthorized();
    const target = events.find(e => e.id === eventId);
    const updated = events.filter(evt => evt.id !== eventId);
    setEvents(updated);
    saveCloudKey(EVENTS_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_EVENTO', target?.title || eventId, `Eliminato evento ID ${eventId}`);
    }
  };

  // Photo Actions
  const uploadUserPhoto = (photoData) => {
    const newPhoto = {
      id: 'ph-' + Date.now(),
      url: photoData.url,
      title: photoData.title || 'Momento speciale a Pinzolo',
      category: photoData.category || 'feste',
      author: photoData.author || (user?.name || 'Ospite'),
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      likes: 0
    };
    const updated = [newPhoto, ...photos];
    setPhotos(updated);
    saveCloudKey(PHOTOS_KEY, updated);
    return newPhoto;
  };

  const approvePhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.map(p => (p.id === photoId ? { ...p, status: 'approved' } : p));
    setPhotos(updated);
    saveCloudKey(PHOTOS_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('APPROVA_FOTO', target?.title || photoId, `Approvata foto di ${target?.author || 'utente'}`);
    }
  };

  const rejectPhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.filter(p => p.id !== photoId);
    setPhotos(updated);
    saveCloudKey(PHOTOS_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('RIFIUTA_FOTO', target?.title || photoId, `Rifiutata foto di ${target?.author || 'utente'}`);
    }
  };

  const deletePhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    const updated = photos.filter(p => p.id !== photoId);
    setPhotos(updated);
    saveCloudKey(PHOTOS_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_FOTO_GALLERY', target?.title || photoId, `Rimossa foto dalla gallery`);
    }
  };

  const likePhoto = (photoId) => {
    const updated = photos.map(p => (p.id === photoId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    setPhotos(updated);
    saveCloudKey(PHOTOS_KEY, updated);
  };

  // Message Actions
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
    const updated = messages.map(m => (m.id === msgId ? { ...m, read: true } : m));
    setMessages(updated);
    saveCloudKey(MESSAGES_KEY, updated);
  };

  const deleteMessage = (msgId) => {
    assertAuthorized();
    const updated = messages.filter(m => m.id !== msgId);
    setMessages(updated);
    saveCloudKey(MESSAGES_KEY, updated);

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_MESSAGGIO', msgId, `Eliminato messaggio ID ${msgId}`);
    }
  };

  // Reset to initial defaults
  const resetToDefaults = () => {
    assertAuthorized();
    setSiteContent(INITIAL_SITE_CONTENT);
    setEvents(INITIAL_EVENTS);
    setPhotos(INITIAL_PHOTOS);
    setMessages(INITIAL_MESSAGES);
    saveCloudKey(CONTENT_KEY, INITIAL_SITE_CONTENT);
    saveCloudKey(EVENTS_KEY, INITIAL_EVENTS);
    saveCloudKey(PHOTOS_KEY, INITIAL_PHOTOS);
    saveCloudKey(MESSAGES_KEY, INITIAL_MESSAGES);

    if (recordAuditAction) {
      recordAuditAction('RESET_DEFAULT', 'Tutto il Database', 'Ripristinati dati e contenuti predefiniti');
    }
  };

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
