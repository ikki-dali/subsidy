'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Banknote,
  Clock,
  Heart,
  Bell,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

type Client = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone?: string;
  industry: string;
  prefecture: string;
  employee_count: string;
  annual_revenue?: string;
  created_at: string;
  updated_at: string;
};

type Interest = {
  id: string;
  subsidy_id: string;
  subsidy_title: string;
  subsidy_url?: string;
  note?: string;
  status: string;
  created_at: string;
};

type Favorite = {
  id: string;
  subsidy_id: string;
  subsidy_title: string;
  subsidy_url?: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  interested: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  applied: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-100 text-slate-700',
};

const STATUS_LABELS: Record<string, string> = {
  interested: '興味あり',
  contacted: '連絡済み',
  applied: '申請済み',
  rejected: '不採用',
};

const EMPLOYEE_LABELS: Record<string, string> = {
  '1-5': '1〜5人',
  '6-20': '6〜20人',
  '21-50': '21〜50人',
  '51-100': '51〜100人',
  '101-300': '101〜300人',
  '301+': '301人以上',
};

const REVENUE_LABELS: Record<string, string> = {
  'under_10m': '1,000万円未満',
  '10m_50m': '1,000万〜5,000万円',
  '50m_100m': '5,000万〜1億円',
  '100m_500m': '1億〜5億円',
  '500m_1b': '5億〜10億円',
  'over_1b': '10億円以上',
};

export default function AdminClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interests' | 'favorites'>('interests');

  useEffect(() => {
    async function fetchClientData() {
      try {
        const res = await fetch(`/api/admin/clients/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
          setInterests(data.interests || []);
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error('Failed to fetch client:', error);
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">読み込み中...</div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">クライアントが見つかりません</p>
        <Link href="/admin/clients">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            一覧に戻る
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {client.name}
          </h1>
          <p className="text-slate-600 mt-1">{client.contact_name}</p>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                メールアドレス
              </p>
              <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="space-y-1">
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  電話番号
                </p>
                <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                所在地
              </p>
              <p>{client.prefecture}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                業種
              </p>
              <Badge variant="secondary">{client.industry}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Users className="h-4 w-4" />
                従業員数
              </p>
              <p>{EMPLOYEE_LABELS[client.employee_count] || client.employee_count}</p>
            </div>
            {client.annual_revenue && (
              <div className="space-y-1">
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  年商
                </p>
                <p>{REVENUE_LABELS[client.annual_revenue] || client.annual_revenue}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                登録日
              </p>
              <p>{formatDate(client.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブ */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'interests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('interests')}
        >
          <Bell className="inline h-4 w-4 mr-1" />
          気になる ({interests.length})
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'favorites'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart className="inline h-4 w-4 mr-1" />
          お気に入り ({favorites.length})
        </button>
      </div>

      {/* 気になるリスト */}
      {activeTab === 'interests' && (
        <div className="space-y-3">
          {interests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                「気になる」リクエストはありません
              </CardContent>
            </Card>
          ) : (
            interests.map(interest => (
              <Card key={interest.id}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={STATUS_COLORS[interest.status]}>
                          {STATUS_LABELS[interest.status]}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {formatDate(interest.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{interest.subsidy_title}</span>
                        {interest.subsidy_url && (
                          <a
                            href={interest.subsidy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          href={`/subsidies/${interest.subsidy_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          詳細
                        </Link>
                      </div>
                      {interest.note && (
                        <div className="flex gap-2 mt-2 text-sm text-slate-600">
                          <MessageSquare className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <p>{interest.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* お気に入りリスト */}
      {activeTab === 'favorites' && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                お気に入りはありません
              </CardContent>
            </Card>
          ) : (
            favorites.map(favorite => (
              <Card key={favorite.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{favorite.subsidy_title}</span>
                        {favorite.subsidy_url && (
                          <a
                            href={favorite.subsidy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          href={`/subsidies/${favorite.subsidy_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          詳細
                        </Link>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(favorite.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
