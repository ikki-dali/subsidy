'use client';

import { Suspense } from 'react';
import { SearchPageContent } from '@/components/features/search-page-content';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            補助金ナビ
          </Link>
          <nav className="flex gap-4">
            <Link href="/search" className="text-sm text-foreground font-medium">
              検索
            </Link>
            <Link href="/favorites" className="text-sm text-muted-foreground hover:text-foreground">
              お気に入り
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white">
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
