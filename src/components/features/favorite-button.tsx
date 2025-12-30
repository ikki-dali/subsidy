'use client';

import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/use-favorites';

type FavoriteButtonProps = {
  subsidyId: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function FavoriteButton({ subsidyId, size = 'icon' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const isFav = isFavorite(subsidyId);

  if (!isLoaded) {
    return (
      <Button variant="ghost" size={size} disabled>
        <Heart className="h-5 w-5 text-gray-300" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => toggleFavorite(subsidyId)}
      title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
        }`}
      />
    </Button>
  );
}
