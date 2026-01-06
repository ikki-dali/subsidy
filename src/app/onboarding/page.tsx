'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Users, Mail, ArrowRight, CheckCircle2, Banknote, Gift, Loader2, Lightbulb, HelpCircle } from 'lucide-react';

// 業種選択肢
const INDUSTRIES = [
  { value: 'manufacturing', label: '製造業' },
  { value: 'construction', label: '建設業' },
  { value: 'it', label: 'IT・情報サービス業' },
  { value: 'retail', label: '小売業' },
  { value: 'wholesale', label: '卸売業' },
  { value: 'food', label: '飲食サービス業' },
  { value: 'hospitality', label: '宿泊業' },
  { value: 'transport', label: '運輸業' },
  { value: 'real_estate', label: '不動産業' },
  { value: 'medical', label: '医療・福祉' },
  { value: 'education', label: '教育・学習支援' },
  { value: 'agriculture', label: '農業' },
  { value: 'other', label: 'その他' },
];

// 従業員数選択肢
const EMPLOYEE_COUNTS = [
  { value: '1-5', label: '1〜5名' },
  { value: '6-20', label: '6〜20名' },
  { value: '21-50', label: '21〜50名' },
  { value: '51-100', label: '51〜100名' },
  { value: '101-300', label: '101〜300名' },
  { value: '301+', label: '301名以上' },
];

// 年商規模選択肢
const REVENUE_RANGES = [
  { value: 'under_10m', label: '1,000万円未満' },
  { value: '10m_50m', label: '1,000万円〜5,000万円' },
  { value: '50m_100m', label: '5,000万円〜1億円' },
  { value: '100m_500m', label: '1億円〜5億円' },
  { value: '500m_1b', label: '5億円〜10億円' },
  { value: 'over_1b', label: '10億円以上' },
];

// 都道府県選択肢
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

// 補助金利用経験
const SUBSIDY_EXPERIENCES = [
  { value: 'experienced_many', label: 'ある（何度も利用している）', description: 'IT導入補助金、ものづくり補助金など複数回申請経験がある' },
  { value: 'experienced_few', label: 'ある（1-2回利用したことがある）', description: '過去に1-2回程度申請したことがある' },
  { value: 'inexperienced_interested', label: 'ない（申請したいが方法がわからない）', description: '補助金に興味はあるが、どう申請すればいいかわからない' },
  { value: 'inexperienced_not_interested', label: 'ない（興味がない/必要を感じていない）', description: '今のところ補助金の必要性を感じていない' },
];

// 補助金利用用途
const SUBSIDY_PURPOSES = [
  { value: 'it_dx', label: 'IT導入・DX推進', description: '業務システム導入、AI活用、クラウド化、ホームページ制作など' },
  { value: 'equipment', label: '設備投資・機械導入', description: '生産設備、工作機械、店舗設備、車両など' },
  { value: 'new_business', label: '新規事業・事業拡大', description: '新商品開発、新サービス、新分野進出など' },
  { value: 'training', label: '人材育成・研修', description: '社員研修、資格取得支援、スキルアップなど' },
  { value: 'marketing', label: '販路開拓・マーケティング', description: '展示会出展、広告宣伝、EC構築、海外展開など' },
  { value: 'eco', label: '省エネ・環境対策', description: '太陽光発電導入、LED化、廃棄物削減、CO2削減など' },
  { value: 'succession', label: '事業承継・M&A', description: '後継者育成、株式譲渡、事業売却・買収など' },
  { value: 'other', label: 'その他', description: '' },
];

// 現在の課題
const CURRENT_CHALLENGES = [
  { value: 'efficiency', label: '業務効率化・工数削減', description: '手作業が多い、ムダな業務が多い、残業が減らないなど' },
  { value: 'digitalization', label: 'IT化・デジタル化の遅れ', description: '紙の書類が多い、システムが古い、データ活用ができていないなど' },
  { value: 'labor_shortage', label: '人手不足・採用難', description: '人が集まらない、離職が多い、人件費が高いなど' },
  { value: 'revenue_decline', label: '売上・利益の低下', description: '売上が伸びない、利益率が低い、価格競争が激しいなど' },
  { value: 'customer_acquisition', label: '新規顧客の獲得', description: '新規顧客が取れない、営業力が弱い、認知度が低いなど' },
  { value: 'productivity', label: '生産性向上', description: '生産効率が悪い、品質が安定しない、納期が守れないなど' },
  { value: 'subsidy_knowhow', label: '補助金申請のノウハウ不足', description: '申請方法がわからない、書類作成が難しい、採択されないなど' },
  { value: 'none', label: '特になし', description: '現時点では大きな課題を感じていない' },
  { value: 'other', label: 'その他', description: '' },
];

type Step = 1 | 2 | 3 | 4 | 5;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 招待コード関連（URLパラメータ優先、なければsessionStorageから取得）
  const urlInviteCode = searchParams.get('invite');
  const [inviteCode, setInviteCode] = useState<string | null>(urlInviteCode);
  const [inviteInfo, setInviteInfo] = useState<{
    valid: boolean;
    inviterCompanyName: string | null;
    checked: boolean;
  }>({ valid: false, inviterCompanyName: null, checked: false });

  // sessionStorageから招待コードを復元（LINEなどでパラメータが消えた場合の対策）
  useEffect(() => {
    if (!urlInviteCode) {
      const storedCode = sessionStorage.getItem('invite_code');
      if (storedCode) {
        setInviteCode(storedCode);
      }
    } else {
      // URLにある場合はsessionStorageにも保存
      sessionStorage.setItem('invite_code', urlInviteCode);
    }
  }, [urlInviteCode]);

  // 招待コードの検証
  useEffect(() => {
    if (inviteCode) {
      fetch(`/api/invitations/validate?code=${inviteCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setInviteInfo({
              valid: true,
              inviterCompanyName: data.inviterCompanyName || null,
              checked: true,
            });
          } else {
            // 無効な招待コードの場合はトップページにリダイレクト
            sessionStorage.removeItem('invite_code');
            router.push('/?error=invalid_invite');
          }
        })
        .catch(() => {
          // エラー時もトップページにリダイレクト
          sessionStorage.removeItem('invite_code');
          router.push('/?error=invalid_invite');
        });
    }
  }, [inviteCode, router]);

  // フォームデータ
  const [formData, setFormData] = useState({
    // Step 1: 会社基本情報
    companyName: '',
    industry: '',
    // Step 2: 規模情報
    employeeCount: '',
    annualRevenue: '',
    prefecture: '',
    // Step 3: 補助金ニーズ
    subsidyExperience: '',
    subsidyPurposes: [] as string[],
    subsidyPurposeOther: '',
    // Step 4: 課題
    currentChallenges: [] as string[],
    challengeOther: '',
    // Step 5: 担当者情報
    contactName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleArrayValue = (field: 'subsidyPurposes' | 'currentChallenges', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
    setError(null);
  };

  const validateStep = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.companyName.trim()) {
          setError('会社名を入力してください');
          return false;
        }
        if (!formData.industry) {
          setError('業種を選択してください');
          return false;
        }
        return true;
      case 2:
        if (!formData.employeeCount) {
          setError('従業員数を選択してください');
          return false;
        }
        if (!formData.annualRevenue) {
          setError('年商規模を選択してください');
          return false;
        }
        if (!formData.prefecture) {
          setError('所在地を選択してください');
          return false;
        }
        return true;
      case 3:
        if (!formData.subsidyExperience) {
          setError('補助金の利用経験を選択してください');
          return false;
        }
        if (formData.subsidyPurposes.length === 0) {
          setError('補助金の利用用途を1つ以上選択してください');
          return false;
        }
        if (formData.subsidyPurposes.includes('other') && !formData.subsidyPurposeOther.trim()) {
          setError('その他の用途を入力してください');
          return false;
        }
        return true;
      case 4:
        if (formData.currentChallenges.length === 0) {
          setError('現在の課題を1つ以上選択してください');
          return false;
        }
        if (formData.currentChallenges.includes('other') && !formData.challengeOther.trim()) {
          setError('その他の課題を入力してください');
          return false;
        }
        return true;
      case 5:
        if (!formData.contactName.trim()) {
          setError('担当者名を入力してください');
          return false;
        }
        if (!formData.email.trim()) {
          setError('メールアドレスを入力してください');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('有効なメールアドレスを入力してください');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('電話番号を入力してください');
          return false;
        }
        if (!formData.password) {
          setError('パスワードを入力してください');
          return false;
        }
        if (formData.password.length < 8) {
          setError('パスワードは8文字以上で入力してください');
          return false;
        }
        if (formData.password.length > 200) {
          setError('パスワードが長すぎます');
          return false;
        }
        if (formData.password !== formData.passwordConfirm) {
          setError('パスワードが一致しません');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as Step);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // 確認用フィールドはサーバに送らない
          passwordConfirm: undefined,
          // 招待コード
          inviteCode: inviteInfo.valid ? inviteCode : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }

      // 成功したら元のページ（あれば）へ戻す
      let redirectPath: string | null = null;
      try {
        redirectPath = sessionStorage.getItem('redirect_after_onboarding');
      } catch {
        redirectPath = null;
      }

      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/api')) {
        try {
          sessionStorage.removeItem('redirect_after_onboarding');
          sessionStorage.removeItem('invite_code');
        } catch {
          // ignore
        }
        router.push(redirectPath);
      } else {
        // 招待コードをクリア
        try {
          sessionStorage.removeItem('invite_code');
        } catch {
          // ignore
        }
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight">
              補助金ナビ
            </h1>
          </div>
          <p className="text-slate-500">
            あなたの会社に最適な補助金をご提案します
          </p>
        </div>

        {/* 招待バナー */}
        {inviteInfo.checked && inviteInfo.valid && inviteInfo.inviterCompanyName && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  {inviteInfo.inviterCompanyName} さんからの招待
                </p>
                <p className="text-xs text-green-600">
                  招待リンクから登録いただきありがとうございます
                </p>
              </div>
            </div>
          </div>
        )}

        {/* プログレスバー */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  s < step
                    ? 'bg-blue-600 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`w-8 h-1 mx-1 rounded transition-all duration-300 ${
                    s < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* メインカード */}
        <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 p-8 shadow-xl">
          {/* Step 1: 会社基本情報 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">会社情報を教えてください</h2>
                <p className="text-slate-500 text-sm mt-1">
                  最適な補助金をマッチングするために使用します
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="株式会社サンプル"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    業種 <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.industry} onValueChange={(v) => updateFormData('industry', v)}>
                    <SelectTrigger className="border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="業種を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 z-[100]">
                      {INDUSTRIES.map((ind) => (
                        <SelectItem
                          key={ind.value}
                          value={ind.value}
                          className="text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 規模情報 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">会社の規模を教えてください</h2>
                <p className="text-slate-500 text-sm mt-1">
                  対象となる補助金の絞り込みに使用します
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    従業員数 <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.employeeCount} onValueChange={(v) => updateFormData('employeeCount', v)}>
                    <SelectTrigger className="border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="従業員数を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 z-[100]">
                      {EMPLOYEE_COUNTS.map((ec) => (
                        <SelectItem
                          key={ec.value}
                          value={ec.value}
                          className="text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          {ec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    年商規模 <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.annualRevenue} onValueChange={(v) => updateFormData('annualRevenue', v)}>
                    <SelectTrigger className="border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="年商規模を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 z-[100]">
                      {REVENUE_RANGES.map((rr) => (
                        <SelectItem
                          key={rr.value}
                          value={rr.value}
                          className="text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          {rr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    所在地 <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.prefecture} onValueChange={(v) => updateFormData('prefecture', v)}>
                    <SelectTrigger className="border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 max-h-60 z-[100]">
                      {PREFECTURES.map((pref) => (
                        <SelectItem
                          key={pref}
                          value={pref}
                          className="text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 補助金ニーズ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="w-7 h-7 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">補助金について教えてください</h2>
                <p className="text-slate-500 text-sm mt-1">
                  最適な補助金をご提案するために使用します
                </p>
              </div>

              <div className="space-y-6">
                {/* 補助金利用経験 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    補助金・助成金の申請経験はありますか？ <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {SUBSIDY_EXPERIENCES.map((exp) => (
                      <label
                        key={exp.value}
                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.subsidyExperience === exp.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subsidyExperience"
                          value={exp.value}
                          checked={formData.subsidyExperience === exp.value}
                          onChange={(e) => updateFormData('subsidyExperience', e.target.value)}
                          className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">{exp.label}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{exp.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 補助金利用用途 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    補助金をどのような用途で利用したいですか？ <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-1">（複数選択可）</span>
                  </label>
                  <div className="space-y-2">
                    {SUBSIDY_PURPOSES.map((purpose) => (
                      <label
                        key={purpose.value}
                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.subsidyPurposes.includes(purpose.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.subsidyPurposes.includes(purpose.value)}
                          onChange={() => toggleArrayValue('subsidyPurposes', purpose.value)}
                          className="mt-1 mr-3 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-900">{purpose.label}</span>
                          {purpose.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{purpose.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {formData.subsidyPurposes.includes('other') && (
                    <Input
                      type="text"
                      placeholder="その他の用途を入力"
                      value={formData.subsidyPurposeOther}
                      onChange={(e) => updateFormData('subsidyPurposeOther', e.target.value)}
                      className="mt-2 border-slate-300 text-slate-900 placeholder:text-slate-400"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 課題 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-7 h-7 text-rose-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">会社の課題について教えてください</h2>
                <p className="text-slate-500 text-sm mt-1">
                  課題に合わせた補助金と解決策をご提案します
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  現在、会社で困っていることはありますか？ <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal ml-1">（複数選択可）</span>
                </label>
                <div className="space-y-2">
                  {CURRENT_CHALLENGES.map((challenge) => (
                    <label
                      key={challenge.value}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.currentChallenges.includes(challenge.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.currentChallenges.includes(challenge.value)}
                        onChange={() => toggleArrayValue('currentChallenges', challenge.value)}
                        className="mt-1 mr-3 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-900">{challenge.label}</span>
                        {challenge.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{challenge.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {formData.currentChallenges.includes('other') && (
                  <Input
                    type="text"
                    placeholder="その他の課題を入力"
                    value={formData.challengeOther}
                    onChange={(e) => updateFormData('challengeOther', e.target.value)}
                    className="mt-2 border-slate-300 text-slate-900 placeholder:text-slate-400"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600">
                  選択された課題は、無料相談の際にも活用させていただきます。
                  課題に応じた補助金と、具体的な解決策をご提案いたします。
                </p>
              </div>
            </div>
          )}

          {/* Step 5: 担当者情報 */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">ご担当者情報</h2>
                <p className="text-slate-500 text-sm mt-1">
                  補助金情報のお知らせをお送りします
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    担当者名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="山田 太郎"
                    value={formData.contactName}
                    onChange={(e) => updateFormData('contactName', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="taro@example.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="03-1234-5678"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    パスワード <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="8文字以上"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    8文字以上で設定してください
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    パスワード（確認） <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="もう一度入力"
                    value={formData.passwordConfirm}
                    onChange={(e) => updateFormData('passwordConfirm', e.target.value)}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* 登録内容サマリー */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-3">登録内容の確認</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">会社名</span>
                    <span className="text-slate-900 font-medium">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">業種</span>
                    <span className="text-slate-900 font-medium">
                      {INDUSTRIES.find(i => i.value === formData.industry)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">従業員数</span>
                    <span className="text-slate-900 font-medium">
                      {EMPLOYEE_COUNTS.find(e => e.value === formData.employeeCount)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">所在地</span>
                    <span className="text-slate-900 font-medium">{formData.prefecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">補助金経験</span>
                    <span className="text-slate-900 font-medium">
                      {SUBSIDY_EXPERIENCES.find(e => e.value === formData.subsidyExperience)?.label.split('（')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                戻る
              </Button>
            )}
            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                次へ <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50"
              >
                {isSubmitting ? '登録中...' : '登録して始める'}
              </Button>
            )}
          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-slate-500 text-xs mt-6">
          登録することで、
          <a href="#" className="text-blue-600 hover:underline">利用規約</a>
          と
          <a href="#" className="text-blue-600 hover:underline">プライバシーポリシー</a>
          に同意したものとみなされます
        </p>

        {/* ログインリンク */}
        <div className="text-center mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-2">
            すでに登録済みの方は
          </p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            ログインはこちら →
          </Link>
        </div>
      </div>
    </div>
  );
}

// Suspenseでラップしてエクスポート
function OnboardingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>読み込み中...</span>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
