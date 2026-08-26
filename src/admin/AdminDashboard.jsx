import React, { useState } from 'react';
import { Shield, Image as ImageIcon, Calendar, Edit3, MessageSquare, ArrowLeft, LogOut, Users, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PhotoModeration } from './PhotoModeration';
import { EventsManager } from './EventsManager';
import { ContentEditor } from './ContentEditor';
import { MessagesViewer } from './MessagesViewer';
import { ModeratorsManager } from './ModeratorsManager';
import { IcebergLogoIcon } from '../components/Logo';

export const AdminDashboard = ({ onBackToSite, onShowToast }) => {
  const { user, isOwner, isModerator, logout } = useAuth();
  const { pendingPhotos, messages } = useData();
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'events' | 'content' | 'messages' | 'moderators'

  const unreadMessagesCount = messages.filter(m => !m.read).length;

  const tabs = [
    {
      id: 'photos',
      label: 'Moderazione Foto',
      icon: ImageIcon,
      badge: pendingPhotos.length > 0 ? pendingPhotos.length : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'events',
      label: 'Gestione Eventi',
      icon: Calendar,
      badge: null
    },
    {
      id: 'content',
      label: 'Editor Testi & CMS',
      icon: Edit3,
      badge: null
    },
    {
      id: 'messages',
      label: 'Messaggi & Liste',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: 'bg-cyan-400 text-black'
    },
    // Tab visible ONLY to the OWNER
    ...(isOwner ? [{
      id: 'moderators',
      label: 'Team Moderatori & Inviti',
      icon: Users,
      badge: 'OWNER',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-alpine-950 text-white pb-20 pt-6">
      
      {/* Top Admin Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
          
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-600 p-[1.5px] shadow-glow-cyan">
              <div className="w-full h-full bg-alpine-900 rounded-[14px] flex items-center justify-center">
                <IcebergLogoIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-lg text-white uppercase tracking-tight">
                  PANNELLO GESTIONALE HEETS
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isOwner
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                    : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                }`}>
                  {isOwner ? '👑 OWNER' : '🛡️ MODERATORE'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Autenticato come <span className="text-zinc-200 font-semibold">{user?.name || 'Gestore'}</span> ({user?.email})
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-alpine-900/80 hover:bg-cyan-950/40 text-zinc-200 hover:text-white border border-cyan-500/20 hover:border-cyan-400/50 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Torna al Sito Pubblico</span>
            </button>

            <button
              onClick={() => {
                logout();
                onBackToSite();
              }}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title="Disconnetti"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Dashboard Section Tabs */}
        <div className={`grid grid-cols-2 ${isOwner ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2 sm:gap-3 mt-6`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center sm:justify-start gap-2.5 p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 text-black border-cyan-400 shadow-glow-cyan font-extrabold'
                    : 'glass-card text-zinc-300 hover:text-white border-cyan-500/15 hover:border-cyan-500/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    isActive ? 'bg-black text-cyan-400' : tab.badgeColor
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/20 shadow-2xl">
          {activeTab === 'photos' && <PhotoModeration onShowToast={onShowToast} />}
          {activeTab === 'events' && <EventsManager onShowToast={onShowToast} />}
          {activeTab === 'content' && <ContentEditor onShowToast={onShowToast} />}
          {activeTab === 'messages' && <MessagesViewer onShowToast={onShowToast} />}
          {activeTab === 'moderators' && isOwner && <ModeratorsManager onShowToast={onShowToast} />}
        </div>
      </div>

    </div>
  );
};
