'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* 戻るリンク */}
        <Link
          href="/onboarding"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Link>

        {/* ヘッダー */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">プライバシーポリシー</h1>
          <p className="text-slate-500 text-sm">最終更新日: 2026年1月14日</p>
        </div>

        {/* 本文 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
          <section>
            <p className="text-slate-700 leading-relaxed">
              足立区補助金ナビ（以下「本サービス」といいます。）を運営する当社は、本サービスにおける、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第1条（収集する情報）
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              当社は、本サービスの提供にあたり、以下の情報を収集することがあります。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <span className="font-medium text-slate-700">会社情報：</span>
                会社名、業種、従業員数、年商規模、所在地
              </li>
              <li>
                <span className="font-medium text-slate-700">担当者情報：</span>
                氏名、メールアドレス、電話番号
              </li>
              <li>
                <span className="font-medium text-slate-700">補助金ニーズに関する情報：</span>
                補助金の利用経験、利用用途、現在の課題
              </li>
              <li>
                <span className="font-medium text-slate-700">利用履歴：</span>
                本サービスの閲覧履歴、検索履歴、お気に入り登録
              </li>
              <li>
                <span className="font-medium text-slate-700">端末情報：</span>
                IPアドレス、ブラウザの種類、オペレーティングシステム
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第2条（利用目的）
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              当社は、収集した情報を以下の目的で利用いたします。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーに適した補助金情報のマッチング・レコメンドのため</li>
              <li>補助金の申請期限や新着情報のお知らせのため</li>
              <li>無料相談サービスの提供のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>本サービスの改善・新機能開発のため</li>
              <li>利用規約に違反したユーザーの特定・対応のため</li>
              <li>上記の利用目的に付随する目的</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第3条（第三者提供）
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>
                1. 当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              </ul>
              <p>
                2. 前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第4条（個人情報の開示・訂正・削除）
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>
                1. 当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                <li>その他法令に違反することとなる場合</li>
              </ul>
              <p>
                2. 当社は、本人から、個人情報が真実でないという理由によって、個人情報の訂正、追加または削除（以下「訂正等」といいます。）を求められた場合には、遅滞なく必要な調査を行い、その結果に基づき、個人情報の内容の訂正等を行い、その旨本人に通知します。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第5条（個人情報の利用停止等）
            </h2>
            <p className="text-slate-700 leading-relaxed">
              当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行い、その結果に基づき、個人情報の利用停止等を行い、その旨本人に通知します。ただし、個人情報の利用停止等に多額の費用を有する場合その他利用停止等を行うことが困難な場合であって、本人の権利利益を保護するために必要なこれに代わるべき措置をとれる場合は、この代替策を講じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第6条（Cookieの使用について）
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>
                1. 本サービスでは、ユーザーの利便性向上、利用状況の統計的把握、サービスの改善等のためにCookieを使用しています。
              </p>
              <p>
                2. ユーザーは、ブラウザの設定によりCookieの受け取りを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第7条（アクセス解析ツール）
            </h2>
            <p className="text-slate-700 leading-relaxed">
              本サービスでは、サービスの利用状況を把握するために、アクセス解析ツールを使用することがあります。これらのツールはCookieを使用して情報を収集しますが、個人を特定する情報は含まれません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第8条（セキュリティ）
            </h2>
            <p className="text-slate-700 leading-relaxed">
              当社は、個人情報の漏洩、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。具体的には、SSL/TLS暗号化通信の使用、パスワードのハッシュ化保存、アクセス権限の適切な管理等を実施しています。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第9条（プライバシーポリシーの変更）
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>
                1. 本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
              </p>
              <p>
                2. 当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              第10条（お問い合わせ窓口）
            </h2>
            <p className="text-slate-700 leading-relaxed">
              本ポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームまたは以下の窓口までお願いいたします。
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium">サービス名：</span>足立区補助金ナビ
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">お問い合わせ：</span>本サービス内のお問い合わせフォームよりご連絡ください
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-500 text-sm">以上</p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-6 text-center">
          <Link
            href="/terms"
            className="text-blue-600 hover:underline text-sm"
          >
            利用規約を見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
