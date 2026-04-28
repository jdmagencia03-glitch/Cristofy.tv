import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create') {
        setNotifications(prev => [event.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    const notifs = await base44.entities.Notification.list('-created_date', 50);
    setNotifications(notifs);
    const unread = notifs.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const handleMarkAsRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-gray-400 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white">Notificações</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">Sem notificações</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-blue-500/10' : ''}`}
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notif.read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="h-6 w-6 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(notif.id)}
                        className="h-6 w-6 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}