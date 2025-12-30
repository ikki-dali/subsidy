/**
 * 47都道府県の補助金ポータルURL定義
 * 
 * 各都道府県の公式補助金情報ページのURLを定義
 * 産業振興機構、中小企業振興センター、商工労働部など
 */

export interface PrefecturePortal {
  code: string;           // 都道府県コード（01-47）
  name: string;           // 都道府県名
  urls: {
    main?: string;        // メイン補助金ポータル
    sme?: string;         // 中小企業向け
    industry?: string;    // 産業振興
    startup?: string;     // 創業支援
  };
  selectors?: {
    listItem?: string;    // リストアイテムのセレクター
    title?: string;       // タイトルのセレクター
    link?: string;        // リンクのセレクター
  };
}

export const PREFECTURE_PORTALS: PrefecturePortal[] = [
  // 北海道
  {
    code: '01',
    name: '北海道',
    urls: {
      main: 'https://www.hkd.meti.go.jp/hokim/subsidy/',
      sme: 'https://www.sapporo-cci.or.jp/web/business/support/subsidy.html',
      industry: 'https://www.pref.hokkaido.lg.jp/kz/csk/hojo.html',
    },
  },
  // 青森県
  {
    code: '02',
    name: '青森県',
    urls: {
      main: 'https://www.pref.aomori.lg.jp/soshiki/shoko/chikisangyo/jigyosha_shien.html',
      sme: 'https://www.21aomori.or.jp/',
    },
  },
  // 岩手県
  {
    code: '03',
    name: '岩手県',
    urls: {
      main: 'https://www.pref.iwate.jp/sangyoukoyou/chuushoukigyou/index.html',
      sme: 'https://www.joho-iwate.or.jp/',
    },
  },
  // 宮城県
  {
    code: '04',
    name: '宮城県',
    urls: {
      main: 'https://www.pref.miyagi.jp/soshiki/shinsan/',
      sme: 'https://www.smrj.go.jp/regional_hq/tohoku/news/index.html',
    },
  },
  // 秋田県
  {
    code: '05',
    name: '秋田県',
    urls: {
      main: 'https://www.pref.akita.lg.jp/pages/genre/industry/',
      sme: 'https://www.aki-sangyo.or.jp/',
    },
  },
  // 山形県
  {
    code: '06',
    name: '山形県',
    urls: {
      main: 'https://www.pref.yamagata.jp/sangyo/',
      sme: 'https://www.ynet.or.jp/',
    },
  },
  // 福島県
  {
    code: '07',
    name: '福島県',
    urls: {
      main: 'https://www.pref.fukushima.lg.jp/sec/32011a/',
      sme: 'https://www.f-iic.or.jp/',
    },
  },
  // 茨城県
  {
    code: '08',
    name: '茨城県',
    urls: {
      main: 'https://www.pref.ibaraki.jp/shokorodo/',
      sme: 'https://www.iis.or.jp/',
    },
  },
  // 栃木県
  {
    code: '09',
    name: '栃木県',
    urls: {
      main: 'https://www.pref.tochigi.lg.jp/f03/',
      sme: 'https://www.tochigi-iin.or.jp/',
    },
  },
  // 群馬県
  {
    code: '10',
    name: '群馬県',
    urls: {
      main: 'https://www.pref.gunma.jp/site/hojo/',
      sme: 'https://www.g-inf.or.jp/',
    },
  },
  // 埼玉県
  {
    code: '11',
    name: '埼玉県',
    urls: {
      main: 'https://www.pref.saitama.lg.jp/a0801/',
      sme: 'https://www.saitama-j.or.jp/',
    },
  },
  // 千葉県
  {
    code: '12',
    name: '千葉県',
    urls: {
      main: 'https://www.pref.chiba.lg.jp/sanshin/',
      sme: 'https://www.ccjc-net.or.jp/',
    },
  },
  // 東京都
  {
    code: '13',
    name: '東京都',
    urls: {
      main: 'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/sangyo.html',
      sme: 'https://www.tokyo-kosha.or.jp/support/josei/',
      industry: 'https://www.sangyo-rodo.metro.tokyo.lg.jp/chushou/',
    },
    selectors: {
      listItem: '.news-list li, .support-list li',
      title: 'a',
      link: 'a',
    },
  },
  // 神奈川県
  {
    code: '14',
    name: '神奈川県',
    urls: {
      main: 'https://www.pref.kanagawa.jp/docs/jf2/cnt/f300127/',
      sme: 'https://www.kipc.or.jp/',
    },
  },
  // 新潟県
  {
    code: '15',
    name: '新潟県',
    urls: {
      main: 'https://www.pref.niigata.lg.jp/sec/sangyoseisaku/',
      sme: 'https://www.nico.or.jp/',
    },
  },
  // 富山県
  {
    code: '16',
    name: '富山県',
    urls: {
      main: 'https://www.pref.toyama.jp/sections/1300/',
      sme: 'https://www.tonio.or.jp/',
    },
  },
  // 石川県
  {
    code: '17',
    name: '石川県',
    urls: {
      main: 'https://www.pref.ishikawa.lg.jp/sangyou/',
      sme: 'https://www.isico.or.jp/',
    },
  },
  // 福井県
  {
    code: '18',
    name: '福井県',
    urls: {
      main: 'https://www.pref.fukui.lg.jp/doc/sansei/',
      sme: 'https://www.fisc.jp/',
    },
  },
  // 山梨県
  {
    code: '19',
    name: '山梨県',
    urls: {
      main: 'https://www.pref.yamanashi.jp/shouko/',
      sme: 'https://www.yiso.or.jp/',
    },
  },
  // 長野県
  {
    code: '20',
    name: '長野県',
    urls: {
      main: 'https://www.pref.nagano.lg.jp/sangyo/',
      sme: 'https://www.nice-o.or.jp/',
    },
  },
  // 岐阜県
  {
    code: '21',
    name: '岐阜県',
    urls: {
      main: 'https://www.pref.gifu.lg.jp/page/1149.html',
      sme: 'https://www.gpc-gifu.or.jp/',
    },
  },
  // 静岡県
  {
    code: '22',
    name: '静岡県',
    urls: {
      main: 'https://www.pref.shizuoka.jp/sangyou/sa-510/',
      sme: 'https://www.ric-shizuoka.or.jp/',
    },
  },
  // 愛知県
  {
    code: '23',
    name: '愛知県',
    urls: {
      main: 'https://www.pref.aichi.jp/soshiki/kinyu/',
      sme: 'https://www.aibsc.jp/',
      industry: 'https://www.aichi-startup.jp/',
    },
  },
  // 三重県
  {
    code: '24',
    name: '三重県',
    urls: {
      main: 'https://www.pref.mie.lg.jp/SHINSAN/',
      sme: 'https://www.miesc.or.jp/',
    },
  },
  // 滋賀県
  {
    code: '25',
    name: '滋賀県',
    urls: {
      main: 'https://www.pref.shiga.lg.jp/ippan/shigotosangyou/',
      sme: 'https://www.shigaplaza.or.jp/',
    },
  },
  // 京都府
  {
    code: '26',
    name: '京都府',
    urls: {
      main: 'https://www.pref.kyoto.jp/sangyo/',
      sme: 'https://www.ki21.jp/',
    },
  },
  // 大阪府
  {
    code: '27',
    name: '大阪府',
    urls: {
      main: 'https://www.pref.osaka.lg.jp/shokosomu/',
      sme: 'https://www.mydome.jp/',
      industry: 'https://www.obda.or.jp/',
    },
    selectors: {
      listItem: '.news-list li, article',
      title: 'a, h2, h3',
      link: 'a',
    },
  },
  // 兵庫県
  {
    code: '28',
    name: '兵庫県',
    urls: {
      main: 'https://web.pref.hyogo.lg.jp/sr06/',
      sme: 'https://web.hyogo-iic.ne.jp/',
    },
  },
  // 奈良県
  {
    code: '29',
    name: '奈良県',
    urls: {
      main: 'https://www.pref.nara.jp/dd.aspx?menuid=1715',
      sme: 'https://www.nashien.or.jp/',
    },
  },
  // 和歌山県
  {
    code: '30',
    name: '和歌山県',
    urls: {
      main: 'https://www.pref.wakayama.lg.jp/prefg/060100/',
      sme: 'https://www.wsk.or.jp/',
    },
  },
  // 鳥取県
  {
    code: '31',
    name: '鳥取県',
    urls: {
      main: 'https://www.pref.tottori.lg.jp/sangyou/',
      sme: 'https://www.toriton.or.jp/',
    },
  },
  // 島根県
  {
    code: '32',
    name: '島根県',
    urls: {
      main: 'https://www.pref.shimane.lg.jp/industry/',
      sme: 'https://www.joho-shimane.or.jp/',
    },
  },
  // 岡山県
  {
    code: '33',
    name: '岡山県',
    urls: {
      main: 'https://www.pref.okayama.jp/soshiki/8/',
      sme: 'https://www.optic.or.jp/',
    },
  },
  // 広島県
  {
    code: '34',
    name: '広島県',
    urls: {
      main: 'https://www.pref.hiroshima.lg.jp/soshiki/66/',
      sme: 'https://www.hiwave.or.jp/',
    },
  },
  // 山口県
  {
    code: '35',
    name: '山口県',
    urls: {
      main: 'https://www.pref.yamaguchi.lg.jp/cms/a16200/',
      sme: 'https://www.ymg-ssz.jp/',
    },
  },
  // 徳島県
  {
    code: '36',
    name: '徳島県',
    urls: {
      main: 'https://www.pref.tokushima.lg.jp/jigyoshanokata/',
      sme: 'https://www.our-think.or.jp/',
    },
  },
  // 香川県
  {
    code: '37',
    name: '香川県',
    urls: {
      main: 'https://www.pref.kagawa.lg.jp/sangyo/',
      sme: 'https://www.kagawa-isf.jp/',
    },
  },
  // 愛媛県
  {
    code: '38',
    name: '愛媛県',
    urls: {
      main: 'https://www.pref.ehime.jp/h30000/',
      sme: 'https://www.ehime-iinet.or.jp/',
    },
  },
  // 高知県
  {
    code: '39',
    name: '高知県',
    urls: {
      main: 'https://www.pref.kochi.lg.jp/soshiki/150601/',
      sme: 'https://www.joho-kochi.or.jp/',
    },
  },
  // 福岡県
  {
    code: '40',
    name: '福岡県',
    urls: {
      main: 'https://www.pref.fukuoka.lg.jp/life/5/40/',
      sme: 'https://www.fitc.pref.fukuoka.jp/',
      industry: 'https://www.isc-fukuoka.or.jp/',
    },
  },
  // 佐賀県
  {
    code: '41',
    name: '佐賀県',
    urls: {
      main: 'https://www.pref.saga.lg.jp/list00088.html',
      sme: 'https://www.sio-saga.or.jp/',
    },
  },
  // 長崎県
  {
    code: '42',
    name: '長崎県',
    urls: {
      main: 'https://www.pref.nagasaki.jp/bunrui/shigoto-sangyo/',
      sme: 'https://nagasaki-santan.jp/',
    },
  },
  // 熊本県
  {
    code: '43',
    name: '熊本県',
    urls: {
      main: 'https://www.pref.kumamoto.jp/soshiki/62/',
      sme: 'https://www.kmt-ti.or.jp/',
    },
  },
  // 大分県
  {
    code: '44',
    name: '大分県',
    urls: {
      main: 'https://www.pref.oita.jp/site/sme/',
      sme: 'https://www.oita-startup.jp/',
    },
  },
  // 宮崎県
  {
    code: '45',
    name: '宮崎県',
    urls: {
      main: 'https://www.pref.miyazaki.lg.jp/contents/org/shoko/',
      sme: 'https://www.i-port.or.jp/',
    },
  },
  // 鹿児島県
  {
    code: '46',
    name: '鹿児島県',
    urls: {
      main: 'https://www.pref.kagoshima.jp/sangyo-rodo/',
      sme: 'https://www.kisc.or.jp/',
    },
  },
  // 沖縄県
  {
    code: '47',
    name: '沖縄県',
    urls: {
      main: 'https://www.pref.okinawa.jp/site/shoko/',
      sme: 'https://okinawa-ric.jp/',
    },
  },
];

/**
 * 都道府県コードから都道府県名を取得
 */
export function getPrefectureName(code: string): string | undefined {
  return PREFECTURE_PORTALS.find(p => p.code === code)?.name;
}

/**
 * 都道府県名から都道府県コードを取得
 */
export function getPrefectureCode(name: string): string | undefined {
  return PREFECTURE_PORTALS.find(p => p.name === name)?.code;
}

/**
 * 都道府県名からポータル情報を取得
 */
export function getPrefecturePortal(name: string): PrefecturePortal | undefined {
  return PREFECTURE_PORTALS.find(p => p.name === name);
}

/**
 * 全ての都道府県名を取得
 */
export function getAllPrefectureNames(): string[] {
  return PREFECTURE_PORTALS.map(p => p.name);
}

