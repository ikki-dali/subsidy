'use client';

import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';

type ConsultationSlotsBadgeProps = {
  className?: string;
  showLabel?: boolean;
};

export function ConsultationSlotsBadge({ className = '', showLabel = true }: ConsultationSlotsBadgeProps) {
  const [slots, setSlots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch('/api/consultation/slots');
        if (res.ok) {
          const data = await res.json();
          setSlots(data.freeSlots);
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  if (isLoading || slots === null || slots === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium ${className}`}>
      <Ticket className="h-3.5 w-3.5" />
      {showLabel ? (
        <span>無料相談枠 {slots}回</span>
      ) : (
        <span>{slots}</span>
      )}
    </div>
  );
}

// 詳細表示版
export function ConsultationSlotsCard() {
  const [data, setData] = useState<{
    freeSlots: number;
    totalInvites: number;
    maxSlots: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch('/api/consultation/slots');
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { freeSlots, totalInvites, maxSlots } = data;

  return (
    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">無料相談枠</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{freeSlots}</span>
            <span className="text-sm text-slate-500">/ {maxSlots}回</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <Ticket className="h-6 w-6 text-green-600" />
        </div>
      </div>
      
      {freeSlots < maxSlots && (
        <p className="text-xs text-slate-500 mt-3">
          あと {maxSlots - totalInvites} 人招待すると、相談枠が増えます
        </p>
      )}
      
      {freeSlots === 0 && (
        <a 
          href="/invite" 
          className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          友達を招待して無料枠をGET →
        </a>
      )}
    </div>
  );
}

