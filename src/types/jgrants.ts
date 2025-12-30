// JグランツAPI レスポンス型定義

export type JGrantsSubsidy = {
  id: string;                          // "a0WJ200000CDWaWMAX"
  name: string;                        // "S-00007689"
  title: string;
  subsidy_catch_phrase?: string;
  detail?: string;                     // HTML含む
  target_area_search?: string;
  target_area_detail?: string;
  industry?: string;                   // "/"区切り
  use_purpose?: string;
  subsidy_max_limit?: number;
  subsidy_rate?: string;
  target_number_of_employees?: string;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  project_end_deadline?: string;
  front_subsidy_detail_page_url?: string;
  application_guidelines?: Array<{
    name: string;
    data: string;  // base64
  }>;
};

export type JGrantsListResponse = {
  result: JGrantsSubsidy[];
  metadata: {
    resultset: {
      count: number;
    };
  };
};

export type JGrantsDetailResponse = {
  result: JGrantsSubsidy[];
};
