import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDaysRemaining, getDeadlineStatus } from '@/lib/jgrants';
import { FavoriteButton } from '@/components/features/favorite-button';
import { InterestButton } from '@/components/interest-button';
import { NotifySimilarButton } from '@/components/notify-similar-button';
import { ShareButton } from '@/components/features/share-button';
import { HistoryTracker } from '@/components/features/history-tracker';
import { RelatedSubsidies } from '@/components/features/related-subsidies';
import { splitIntoParagraphs, stripHtml } from '@/lib/clean-description';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Building2, 
  Wallet, 
  Percent,
  Clock,
  Users,
  Target,
  Banknote,
  CheckCircle2,
  AlertCircle,
  FileText,
  CheckSquare,
} from 'lucide-react';
import type { Subsidy } from '@/types/database';

type Props = {
  params: Promise<{ id: string }>;
};

// UUIDかどうかを判定
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function getSubsidy(id: string): Promise<Subsidy | null> {
  // UUIDならidで検索、そうでなければjgrants_idで検索
  const column = isUUID(id) ? 'id' : 'jgrants_id';
  
  const { data, error } = await supabaseAdmin
    .from('subsidies')
    .select('*')
    .eq(column, id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}


export default async function SubsidyDetailPage({ params }: Props) {
  const { id } = await params;
  const subsidy = await getSubsidy(id);

  if (!subsidy) {
    notFound();
  }

  const daysRemaining = getDaysRemaining(subsidy.end_date);
  
  // タイトルに「募集終了」「募集は終了」などが含まれている場合も募集終了として表示
  const titleIndicatesClosed = /募集.{0,2}終了|受付.{0,2}終了|申請.{0,2}終了/.test(subsidy.title);
  // is_active=false の場合、またはタイトルが終了を示している場合は募集終了として表示
  const status = subsidy.is_active === false || titleIndicatesClosed ? 'closed' : getDeadlineStatus(daysRemaining);

  const statusConfig = {
    urgent: {
      badge: 'bg-red-500 text-white border-red-500',
      bg: 'from-red-50 to-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-500',
    },
    soon: {
      badge: 'bg-amber-500 text-white border-amber-500',
      bg: 'from-amber-50 to-amber-100',
      icon: Clock,
      iconColor: 'text-amber-500',
    },
    normal: {
      badge: 'bg-emerald-500 text-white border-emerald-500',
      bg: 'from-emerald-50 to-emerald-100',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    ongoing: {
      badge: 'bg-blue-500 text-white border-blue-500',
      bg: 'from-blue-50 to-blue-100',
      icon: CheckCircle2,
      iconColor: 'text-blue-500',
    },
    closed: {
      badge: 'bg-slate-400 text-white border-slate-400',
      bg: 'from-slate-50 to-slate-100',
      icon: AlertCircle,
      iconColor: 'text-slate-400',
    },
  };

  const statusLabels = {
    urgent: '締切間近',
    soon: 'まもなく締切',
    normal: '募集中',
    ongoing: '随時募集',
    closed: '募集終了',
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatDate = (date: string | null) => {
    if (!date) return '未定';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 金額を読みやすく表示
  const formatAmountDisplay = (amount: number | null | undefined) => {
    if (!amount || amount <= 0) {
      return { value: '要問い合わせ', unit: '', isUnknown: true };
    }
    if (amount >= 100000000) {
      return { value: (amount / 100000000).toFixed(1), unit: '億円', isUnknown: false };
    } else if (amount >= 10000) {
      return { value: Math.round(amount / 10000).toLocaleString(), unit: '万円', isUnknown: false };
    }
    return { value: amount.toLocaleString(), unit: '円', isUnknown: false };
  };

  const amountDisplay = formatAmountDisplay(subsidy.max_amount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 overflow-x-hidden">
      {/* 閲覧履歴の記録 */}
      <HistoryTracker subsidyId={subsidy.id} />
      
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            補助金ナビ
            </span>
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              検索
            </Link>
            <Link href="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              お気に入り
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* パンくず */}
        <div className="mb-6">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            検索結果に戻る
          </Link>
        </div>

        {/* ヒーローセクション */}
        <div className={`rounded-xl sm:rounded-2xl bg-gradient-to-r ${config.bg} p-4 sm:p-6 mb-4 sm:mb-6 border`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <Badge className={`${config.badge} font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
                  <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                      {statusLabels[status]}
                      {daysRemaining !== null && daysRemaining >= 0 && ` (残り${daysRemaining}日)`}
                    </Badge>
                
                {amountDisplay && (
                  <Badge 
                    variant="secondary" 
                    className={`font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm ${
                      amountDisplay.isUnknown 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-white/80 text-blue-700'
                    }`}
                  >
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    {amountDisplay.isUnknown ? amountDisplay.value : `最大${amountDisplay.value}${amountDisplay.unit}`}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-3 break-words">
                {subsidy.title}
              </h1>
              
                    {subsidy.catch_phrase && (
                <p className="text-slate-600 text-lg">
                  {subsidy.catch_phrase}
                </p>
                    )}
                  </div>
            
            <div className="flex gap-2">
                  <FavoriteButton subsidyId={subsidy.id} />
              <ShareButton 
                title={subsidy.title} 
                text={subsidy.catch_phrase || undefined}
              />
            </div>
          </div>
                </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 左側：詳細情報 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 概要 */}
            {stripHtml(subsidy.description) && (
              <Card className="rounded-xl sm:rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    概要
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
                    {splitIntoParagraphs(subsidy.description, subsidy.title).map((paragraph, idx) => (
                      <p key={idx} className="text-slate-600 leading-relaxed mb-2 sm:mb-3 last:mb-0 text-sm sm:text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* 必要書類リスト */}
                  {subsidy.required_documents && subsidy.required_documents.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        申請に必要な書類
                      </div>
                      <ul className="space-y-2">
                        {subsidy.required_documents.map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">
                        ※ 詳細な必要書類は公式サイトでご確認ください
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 対象要件 */}
            <Card className="rounded-xl sm:rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  対象要件
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
                {subsidy.target_area && subsidy.target_area.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-50/50 border border-green-100">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-800 mb-2 sm:mb-3">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      対象地域
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {subsidy.target_area.map((area) => (
                        <Badge key={area} className="bg-white text-green-700 border-green-200 text-xs sm:text-sm">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {subsidy.industry && subsidy.industry.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-orange-50/50 border border-orange-100">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-orange-800 mb-2 sm:mb-3">
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      対象業種
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {subsidy.industry.map((ind) => (
                        <Badge key={ind} className="bg-white text-orange-700 border-orange-200 text-xs sm:text-sm">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {subsidy.target_number_of_employees && (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                      <Users className="h-4 w-4" />
                      対象従業員数
                    </div>
                    <p className="text-blue-700">{subsidy.target_number_of_employees}</p>
                  </div>
                )}

                {subsidy.use_purpose && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 mb-2">利用目的</div>
                    <p className="text-slate-600">{subsidy.use_purpose}</p>
                  </div>
                )}

                {/* 要件がない場合 */}
                {!subsidy.target_area?.length && !subsidy.industry?.length && !subsidy.target_number_of_employees && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>詳細な対象要件は公式サイトでご確認ください</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* この補助金を見た人はこちらも見ています / 関連する補助金 */}
            <RelatedSubsidies subsidyId={subsidy.id} />
          </div>

          {/* 右側：サマリー */}
          {/* 右側：サマリー */}
          <div className="space-y-4 sm:space-y-6">
            {/* 補助金額 */}
            <Card className="rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6">
                <div className="text-blue-100 text-xs sm:text-sm font-medium mb-1">補助上限額</div>
                {amountDisplay && !amountDisplay.isUnknown ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{amountDisplay.value}</span>
                    <span className="text-lg sm:text-xl text-blue-100">{amountDisplay.unit}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-white">要問い合わせ</span>
                    <p className="text-blue-200 text-xs mt-1">詳細は公式サイトをご確認ください</p>
                  </div>
                )}

                {subsidy.subsidy_rate && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-400/30">
                    <div className="text-blue-100 text-xs sm:text-sm font-medium mb-1">補助率</div>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200" />
                      <span className="text-xl sm:text-2xl font-bold text-white">{subsidy.subsidy_rate}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* スケジュール */}
            <Card className="rounded-xl sm:rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  スケジュール
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 sm:space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[1.3rem] top-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                    <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">募集開始</p>
                    <p className="font-semibold text-sm sm:text-base">{formatDate(subsidy.start_date)}</p>
                </div>

                  <div className="relative">
                    <div className="absolute -left-[1.3rem] top-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                    <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">募集終了</p>
                    <p className="font-semibold text-sm sm:text-base">{formatDate(subsidy.end_date)}</p>
                    {daysRemaining !== null && daysRemaining >= 0 && (
                      <p className={`text-xs sm:text-sm ${config.iconColor} font-medium mt-0.5 sm:mt-1`}>
                        残り{daysRemaining}日
                      </p>
                    )}
                </div>

                {subsidy.project_end_deadline && (
                    <div className="relative">
                      <div className="absolute -left-[1.3rem] top-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500"></div>
                      <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">事業完了期限</p>
                      <p className="font-semibold text-sm sm:text-base">{formatDate(subsidy.project_end_deadline)}</p>
                    </div>
                  )}
                  </div>
              </CardContent>
            </Card>

            {/* 外部リンク */}
            {(subsidy.front_url || subsidy.official_url) && (
              <Card className="rounded-xl sm:rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">公式情報</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
                  {subsidy.front_url && (
                    <a
                      href={subsidy.front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full justify-between rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base">
                        <span className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                          詳細ページを見る
                        </span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </a>
                  )}
                  {subsidy.official_url && (
                    <a
                      href={subsidy.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full justify-between rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base">
                        <span className="flex items-center">
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        公式サイト
                        </span>
                        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 相談ボタン / 通知ボタン */}
            {status === 'closed' ? (
              <Card className="rounded-xl sm:rounded-2xl shadow-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">
                    この補助金は募集終了しました
                  </h3>
                  <p className="text-slate-200 text-xs sm:text-sm mb-3 sm:mb-4">
                    似たような補助金が公開されたときに通知を受け取れます。
                  </p>
                  <NotifySimilarButton
                    subsidyId={subsidy.id}
                    subsidyTitle={subsidy.title}
                    subsidyIndustry={subsidy.industry || undefined}
                    variant="default"
                    size="lg"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl sm:rounded-2xl shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">
                    この補助金に興味がありますか？
                  </h3>
                  <p className="text-indigo-100 text-xs sm:text-sm mb-3 sm:mb-4">
                    専門スタッフが申請をサポートします。お気軽にご相談ください。
                  </p>
                  <InterestButton
                    subsidyId={subsidy.id}
                    subsidyTitle={subsidy.title}
                    subsidyUrl={subsidy.front_url || undefined}
                    variant="default"
                    size="lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
