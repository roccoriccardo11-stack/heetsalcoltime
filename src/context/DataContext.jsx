import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_EVENTS,
  INITIAL_PHOTOS,
  INITIAL_MESSAGES
} from '../data/initialData';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const CONTENT_KEY = 'heets_site_content_v2';
const EVENTS_KEY = 'heets_events_v2';
const PHOTOS_KEY = 'heets_photos_v2';
const MESSAGES_KEY = 'heets_messages_v2';

export const DataProvider = ({ children }) => {
  const { user, canManage, recordAuditAction } = useAuth();

  // 1. Site content (Hero, about, categories, contacts)
  const [siteContent, setSiteContent] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure sponsors are removed from any old saved cache
        delete parsed.sponsors;
        return parsed;
      }
      return INITIAL_SITE_CONTENT;
    } catch {
      return INITIAL_SITE_CONTENT;
    }
  });

  // 2. Events list
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(EVENTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  // 3. Photos (approved & pending)
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem(PHOTOS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  // 4. Contact messages
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Auto-sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(siteContent));
  }, [siteContent]);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
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
    // Guarantee sponsors are not re-introduced
    const sanitized = { ...updatedFields };
    delete sanitized.sponsors;

    setSiteContent(prev => ({
      ...prev,
      ...sanitized
    }));

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_CMS', 'Testi del Sito', 'Aggiornati testi, claim o info generali dal CMS');
    }
  };

  const updateCategoryContent = (categoryId, newFields) => {
    assertAuthorized();
    setSiteContent(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...newFields } : cat
      )
    }));

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_CATEGORIA', categoryId, `Aggiornata categoria ${categoryId}`);
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
    setEvents(prev => [newEvent, ...prev]);

    if (recordAuditAction) {
      recordAuditAction('CREA_EVENTO', newEvent.title, `Creato nuovo evento per il ${newEvent.date} a ${newEvent.location}`);
    }
    return newEvent;
  };

  const updateEvent = (eventId, eventData) => {
    assertAuthorized();
    setEvents(prev =>
      prev.map(evt => (evt.id === eventId ? { ...evt, ...eventData } : evt))
    );

    if (recordAuditAction) {
      recordAuditAction('MODIFICA_EVENTO', eventData.title || eventId, `Modificati dettagli evento ID ${eventId}`);
    }
  };

  const deleteEvent = (eventId) => {
    assertAuthorized();
    const target = events.find(e => e.id === eventId);
    setEvents(prev => prev.filter(evt => evt.id !== eventId));

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_EVENTO', target?.title || eventId, `Eliminato evento ID ${eventId}`);
    }
  };

  // Photo Actions
  // Public upload (Allowed for regular users and guests)
  const uploadUserPhoto = ({ url, title, category, author }) => {
    const newPhoto = {
      id: 'ph-' + Date.now(),
      url,
      title: title || 'Momento speciale a Pinzolo',
      category: category || 'feste',
      author: author || (user?.name || 'Ospite'),
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending', // Starts in pending moderation
      likes: 0
    };
    setPhotos(prev => [newPhoto, ...prev]);
    return newPhoto;
  };

  // Moderation: Approve Photo (Moderator/Owner only)
  const approvePhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    setPhotos(prev =>
      prev.map(p => (p.id === photoId ? { ...p, status: 'approved' } : p))
    );

    if (recordAuditAction) {
      recordAuditAction('APPROVA_FOTO', target?.title || photoId, `Approvata e pubblicata foto di ${target?.author || 'utente'}`);
    }
  };

  // Moderation: Reject Photo (Moderator/Owner only)
  const rejectPhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));

    if (recordAuditAction) {
      recordAuditAction('RIFIUTA_FOTO', target?.title || photoId, `Rifiutata ed eliminata foto di ${target?.author || 'utente'}`);
    }
  };

  // Moderation: Delete Photo from live gallery (Moderator/Owner only)
  const deletePhoto = (photoId) => {
    assertAuthorized();
    const target = photos.find(p => p.id === photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));

    if (recordAuditAction) {
      recordAuditAction('ELIMINA_FOTO_GALLERY', target?.title || photoId, `Rimossa foto dalla gallery pubblica`);
    }
  };

  // Public Like
  const likePhoto = (photoId) => {
    setPhotos(prev =>
      prev.map(p => (p.id === photoId ? { ...p, likes: (p.likes || 0) + 1 } : p))
    );
  };

  // Message Actions
  const sendContactMessage = (msgData) => {
    const newMsg = {
      ...msgData,
      id: 'msg-' + Date.now(),
      createdAt: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [newMsg, ...prev]);
    return newMsg;
  };

  const markMessageAsRead = (msgId) => {
    assertAuthorized();
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, read: true } : m))
    );
  };

  const deleteMessage = (msgId) => {
    assertAuthorized();
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (recordAuditAction) {
      recordAuditAction('ELIMINA_MESSAGGIO', msgId, `Eliminato messaggio ID ${msgId}`);
    }
  };

  // Reset to initial defaults (Owner only)
  const resetToDefaults = () => {
    assertAuthorized();
    setSiteContent(INITIAL_SITE_CONTENT);
    setEvents(INITIAL_EVENTS);
    setPhotos(INITIAL_PHOTOS);
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem(CONTENT_KEY);
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(PHOTOS_KEY);
    localStorage.removeItem(MESSAGES_KEY);

    if (recordAuditAction) {
      recordAuditAction('RESET_DEFAULT', 'Tutto il Database', 'Ripristinati dati e contenuti predefiniti');
    }
  };

  // Filtered views
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
