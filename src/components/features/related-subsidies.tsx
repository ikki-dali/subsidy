'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getDaysRemaining } from '@/lib/jgrants';
import { Users, Sparkles, TrendingUp } from 'lucide-react';

type RelatedSubsidy = {
  id: string;
  title: string;
  target_area: string[] | null;
  max_amount: number | null;
  end_date: string | null;
  view_count?: number;
};

type Props = {
  subsidyId: string;
};

export function RelatedSubsidies({ subsidyId }: Props) {
  const [relatedSubsidies, setRelatedSubsidies] = useState<RelatedSubsidy[]>([]);
  const [source, setSource] = useState<'collaborative' | 'content-based'>('content-based');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/subsidies/${subsidyId}/related`);
        if (res.ok) {
          const data = await res.json();
          setRelatedSubsidies(data.subsidies || []);
          setSource(data.source || 'content-based');
        }
      } catch (error) {
        console.error('Failed to fetch related subsidies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [subsidyId]);

  if (loading) {
    return (
      <Card className="rounded-xl sm:rounded-2xl shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedSubsidies.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl sm:rounded-2xl shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          {source === 'collaborative' ? (
            <>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              この補助金を見た人はこちらも見ています
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              関連する補助金
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-3">
          {relatedSubsidies.map((related) => {
            const relDays = getDaysRemaining(related.end_date);
            return (
              <Link
                key={related.id}
                href={`/subsidies/${related.id}`}
                className="block p-3 sm:p-4 rounded-lg sm:rounded-xl border hover:bg-slate-50 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {related.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      {related.target_area?.[0] && (
                        <span className="text-xs text-muted-foreground">
                          {related.target_area[0]}
                        </span>
                      )}
                      {related.max_amount && (
                        <>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(related.max_amount)}
                          </span>
                        </>
                      )}
                      {related.view_count && related.view_count > 1 && (
                        <>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-purple-600 flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" />
                            {related.view_count}人が閲覧
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {relDays !== null && relDays >= 0 && (
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 text-xs ${
                        relDays <= 7 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-slate-50'
                      }`}
                    >
                      残り{relDays}日
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


