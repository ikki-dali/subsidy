import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/features/search-form";
import { RecommendedSection } from "@/components/features/recommended-section";
import { Header } from "@/components/layout/header";
import { supabaseAdmin } from "@/lib/supabase-server";
import Link from "next/link";
import { AuthRequiredLink } from "@/components/features/auth-required-link";
import { 
  Search, 
  MapPin, 
  Clock, 
  Heart, 
  TrendingUp, 
  Banknote,
  ArrowRight,
  Sparkles,
  Users,
  Shield,
} from "lucide-react";

// 統計情報を取得
async function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [totalResult, activeResult, urgentResult] = await Promise.all([
    supabaseAdmin.from('subsidies').select('*', { count: 'exact', head: true }),
    // 募集中: end_date >= today OR end_date IS NULL（随時募集）
    supabaseAdmin.from('subsidies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`end_date.gte.${today},end_date.is.null`),
    // 締切7日以内: end_dateが設定されていて7日以内
    supabaseAdmin.from('subsidies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('end_date', today)
      .lte('end_date', sevenDaysLater),
  ]);

  return {
    total: totalResult.count || 0,
    active: activeResult.count || 0,
    urgent: urgentResult.count || 0,
  };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
      {/* ヘッダー */}
      <Header />

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* 背景エフェクト */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              全国{(Math.floor(stats.total / 100) * 100).toLocaleString()}件以上の補助金データ
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              あなたの事業に<br />
              <span className="text-blue-200">
                最適な補助金
              </span>を発見
            </h1>
            
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              全国の補助金・助成金情報を一元検索。
              地域・業種・金額から、あなたに合った支援制度を見つけましょう。
            </p>

            {/* 検索フォーム */}
            <div className="max-w-2xl mx-auto mb-12">
              <SearchForm className="bg-white rounded-2xl p-2 shadow-2xl" />
            </div>

            {/* クイック統計 */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.active.toLocaleString()}
                </div>
                <div className="text-sm text-blue-200">募集中</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-amber-300 mb-1">
                  {stats.urgent}
                </div>
                <div className="text-sm text-blue-200">締切7日以内</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-emerald-300 mb-1">
                  47
                </div>
                <div className="text-sm text-blue-200">都道府県対応</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* おすすめセクション */}
      <section className="bg-slate-50 py-16">
        <RecommendedSection />
      </section>

      {/* 機能紹介セクション */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">機能紹介</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              補助金探しを、もっとシンプルに
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              複雑な補助金情報を整理し、あなたのビジネスに合った支援制度を効率的に見つけられます。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">スマート検索</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  キーワード、地域、業種、金額など多彩な条件で横断検索。欲しい補助金がすぐに見つかります。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">地域フィルター</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  全47都道府県の地方自治体補助金に対応。お住まいの地域で使える支援を見逃しません。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">締切アラート</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  締切間近の補助金を色分け表示。大切な申請機会を逃さないようサポートします。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">お気に入り保存</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  気になる補助金をお気に入り登録。後からいつでも確認・比較できます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            今すぐ補助金を探してみましょう
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            あなたのビジネスを加速させる補助金が見つかるかもしれません。
            検索は完全無料です。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthRequiredLink href="/search">
              <Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 w-full sm:w-auto">
                補助金を検索
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </AuthRequiredLink>
            <AuthRequiredLink href="/recommended">
              <Button size="xl" className="bg-white/20 text-white border-2 border-white hover:bg-white/30 font-semibold px-8 w-full sm:w-auto">
                おすすめを見る
              </Button>
            </AuthRequiredLink>
          </div>
        </div>
      </section>

      {/* 信頼性セクション */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">毎日更新</h3>
                <p className="text-sm text-slate-600">最新の補助金情報を自動収集</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">公式情報源</h3>
                <p className="text-sm text-slate-600">政府・自治体の公式情報を収集</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">専門サポート</h3>
                <p className="text-sm text-slate-600">申請の相談も承ります</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">補助金ナビ</span>
            </div>
            
            <nav className="flex gap-6">
              <Link href="/search" className="text-sm text-slate-400 hover:text-white transition-colors">
                検索
              </Link>
              <Link href="/recommended" className="text-sm text-slate-400 hover:text-white transition-colors">
                おすすめ
              </Link>
              <Link href="/favorites" className="text-sm text-slate-400 hover:text-white transition-colors">
                お気に入り
              </Link>
            </nav>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-700 text-center">
            <p className="text-sm text-slate-500">
              © 2024 補助金ナビ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
