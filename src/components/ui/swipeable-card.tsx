'use client';

import { useState, useRef, ReactNode } from 'react';
import { Heart, ArrowRight } from 'lucide-react';

type SwipeableCardProps = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon?: ReactNode;
    label: string;
    color: string;
  };
  disabled?: boolean;
};

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <ArrowRight className="h-6 w-6" />,
    label: '詳細',
    color: 'bg-blue-500',
  },
  rightAction = {
    icon: <Heart className="h-6 w-6" />,
    label: 'お気に入り',
    color: 'bg-pink-500',
  },
  disabled = false,
}: SwipeableCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.touches[0].clientX - startX;
    // 最大スワイプ距離を制限
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setCurrentX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    
    if (currentX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (currentX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setCurrentX(0);
    setIsDragging(false);
  };

  const opacity = Math.min(Math.abs(currentX) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden rounded-xl md:overflow-visible h-full">
      {/* 左スワイプ時のアクション表示（右側に表示） */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-24 ${leftAction.color} text-white transition-opacity md:hidden`}
        style={{ opacity: currentX < 0 ? opacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1">
          {leftAction.icon}
          <span className="text-xs font-medium">{leftAction.label}</span>
        </div>
      </div>

      {/* 右スワイプ時のアクション表示（左側に表示） */}
      <div
        className={`absolute inset-y-0 left-0 flex items-center justify-center w-24 ${rightAction.color} text-white transition-opacity md:hidden`}
        style={{ opacity: currentX > 0 ? opacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1">
          {rightAction.icon}
          <span className="text-xs font-medium">{rightAction.label}</span>
        </div>
      </div>

      {/* メインカード */}
      <div
        ref={cardRef}
        className="relative bg-white transition-transform duration-150 ease-out touch-pan-y h-full"
        style={{
          transform: `translateX(${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

