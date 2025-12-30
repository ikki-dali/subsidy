'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type ReminderSubsidy = {
  id: string;
  title: string;
  end_date: string;
  daysRemaining: number;
  urgency: 'urgent' | 'soon';
};

export function DeadlineReminder() {
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Skip if already shown
    if (hasShown) return;

    // Check session storage (show only once per session)
    const reminderShown = sessionStorage.getItem('deadline_reminder_shown');
    if (reminderShown) return;

    const checkReminders = async () => {
      try {
        const res = await fetch('/api/reminders');
        if (!res.ok) return;

        const data = await res.json();
        const reminders: ReminderSubsidy[] = data.reminders || [];

        if (reminders.length === 0) return;

        // Set shown flag
        setHasShown(true);
        sessionStorage.setItem('deadline_reminder_shown', 'true');

        // Show reminders
        if (reminders.length === 1) {
          const reminder = reminders[0];
          showSingleReminder(reminder);
        } else {
          showMultipleReminders(reminders);
        }
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    // Delay to show after page load
    const timer = setTimeout(checkReminders, 2000);
    return () => clearTimeout(timer);
  }, [hasShown]);

  const showSingleReminder = (reminder: ReminderSubsidy) => {
    const isUrgent = reminder.urgency === 'urgent';
    
    toast(
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`}>
          {isUrgent ? (
            <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`} />
          ) : (
            <Clock className="h-5 w-5 text-orange-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
            {isUrgent ? '締切まであと' : 'もうすぐ締切'}{reminder.daysRemaining}日！
          </p>
          <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
            {reminder.title}
          </p>
          <Link 
            href={`/subsidies/${reminder.id}`}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
          >
            詳細を確認
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>,
      {
        duration: 10000,
        className: isUrgent ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-orange-500',
      }
    );
  };

  const showMultipleReminders = (reminders: ReminderSubsidy[]) => {
    const urgentCount = reminders.filter(r => r.urgency === 'urgent').length;
    
    toast(
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${urgentCount > 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
          <AlertTriangle className={`h-5 w-5 ${urgentCount > 0 ? 'text-red-600' : 'text-orange-600'}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${urgentCount > 0 ? 'text-red-700' : 'text-orange-700'}`}>
            {reminders.length}件の補助金が締切間近です
          </p>
          <ul className="text-sm text-slate-600 mt-1 space-y-0.5">
            {reminders.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-1">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  r.urgency === 'urgent' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {r.daysRemaining}日
                </span>
                <span className="truncate">{r.title.slice(0, 20)}...</span>
              </li>
            ))}
            {reminders.length > 3 && (
              <li className="text-muted-foreground">他{reminders.length - 3}件</li>
            )}
          </ul>
          <Link 
            href="/favorites"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
          >
            お気に入りを確認
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>,
      {
        duration: 12000,
        className: urgentCount > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-orange-500',
      }
    );
  };

  // This component renders nothing
  return null;
}


