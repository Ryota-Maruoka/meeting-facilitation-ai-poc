/**
 * モックデータ
 * 
 * 開発・テスト用のサンプルデータを提供
 */

import type { 
  Meeting, 
  AgendaItem, 
  Decision, 
  Action, 
  ParkingLotItem, 
  MeetingSummary,
  Transcript,
  MiniSummary,
  DeviationAlert,
  UnresolvedItem
} from "./types";

// サンプル会議データ
export const mockMeetings: Meeting[] = [
  {
    id: "meeting-1",
    title: "プロダクト要件定義会議",
    purpose: "新機能の要件を明確にし、開発方針を決定する",
    expectedOutcome: "機能仕様書の承認と開発スケジュールの確定",
    participants: ["田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲"],
    agenda: [
      {
        id: "agenda-1",
        title: "現状課題の整理",
        duration: 15,
        expectedOutcome: "主要な課題を3つまで絞り込む",
        status: "completed"
      },
      {
        id: "agenda-2", 
        title: "新機能の要件検討",
        duration: 30,
        expectedOutcome: "MVP機能の範囲を決定する",
        status: "in_progress"
      },
      {
        id: "agenda-3",
        title: "技術的制約の確認",
        duration: 20,
        expectedOutcome: "実装可能な技術スタックを決定する",
        status: "pending"
      }
    ],
    status: "active",
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "meeting-2",
    title: "週次定例会議",
    purpose: "今週の進捗確認と来週の計画策定",
    expectedOutcome: "各チームの進捗状況の共有と課題の解決",
    participants: ["山田次郎", "伊藤三郎", "渡辺四郎"],
    agenda: [
      {
        id: "agenda-4",
        title: "進捗報告",
        duration: 20,
        expectedOutcome: "各チームの進捗状況を共有",
        status: "completed"
      },
      {
        id: "agenda-5",
        title: "課題の議論",
        duration: 25,
        expectedOutcome: "ブロッカーを特定し解決策を決定",
        status: "completed"
      }
    ],
    status: "completed",
    created_at: "2024-01-14T14:00:00Z",
    updated_at: "2024-01-14T15:30:00Z"
  },
  {
    id: "meeting-3",
    title: "デザインレビュー",
    purpose: "UI/UXデザインの方向性を決定する",
    expectedOutcome: "デザインシステムの基本方針の承認",
    participants: ["デザイナーA", "デザイナーB", "PM", "エンジニア"],
    agenda: [
      {
        id: "agenda-6",
        title: "デザインコンセプトの説明",
        duration: 30,
        expectedOutcome: "デザインの方向性を全員で理解する",
        status: "pending"
      }
    ],
    status: "draft",
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z"
  }
];

// サンプル文字起こしデータ
export const mockTranscripts: Transcript[] = [
  {
    id: "transcript-1",
    text: "それでは、本日の会議を始めさせていただきます。まず、現状の課題について整理していきましょう。",
    timestamp: "00:00",
    speaker: "田中太郎",
  },
  {
    id: "transcript-2", 
    text: "現在、ユーザーからのフィードバックで最も多いのは、ログイン機能の使いにくさですね。",
    timestamp: "00:08",
    speaker: "佐藤花子",
  },
  {
    id: "transcript-3",
    text: "確かに、現在のログイン画面は3ステップもあって、ユーザーが離脱してしまう原因になっています。",
    timestamp: "00:15",
    speaker: "鈴木一郎",
  },
  {
    id: "transcript-4",
    text: "では、シングルサインオンを導入して、ワンクリックでログインできるようにするのはどうでしょうか？",
    timestamp: "00:22",
    speaker: "高橋美咲",
  }
];

// サンプル決定事項
export const mockDecisions: Decision[] = [
  {
    id: "decision-1",
    content: "ログイン機能の改善として、シングルサインオンを導入する",
    reason: "ユーザビリティの向上と離脱率の削減のため",
    decided_by: "高橋美咲",
    decided_at: "2024-01-15T09:45:00Z"
  },
  {
    id: "decision-2",
    content: "MVP機能の範囲を、認証・ダッシュボード・基本CRUD操作に限定する",
    reason: "開発期間とリソースの制約を考慮",
    decided_by: "田中太郎",
    decided_at: "2024-01-15T10:15:00Z"
  }
];

// サンプルアクションアイテム
export const mockActions: Action[] = [
  {
    id: "action-1",
    content: "SSOプロバイダーの選定とコスト試算",
    assignee: "鈴木一郎",
    dueDate: "2024-01-22T17:00:00Z",
    status: "pending",
    created_at: "2024-01-15T09:50:00Z"
  },
  {
    id: "action-2",
    content: "認証フローのワイヤーフレーム作成",
    assignee: "佐藤花子",
    dueDate: "2024-01-20T17:00:00Z", 
    status: "in_progress",
    created_at: "2024-01-15T10:20:00Z"
  }
];

// サンプルParking Lot
export const mockParkingLot: ParkingLotItem[] = [
  {
    id: "parking-1",
    title: "モバイルアプリの開発について",
    content: "Webアプリの後にモバイルアプリも検討したい",
    addToNextAgenda: true,
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "parking-2",
    title: "多言語対応の検討",
    content: "将来的に海外展開を考えている",
    addToNextAgenda: false,
    created_at: "2024-01-15T10:35:00Z"
  }
];

// サンプルミニサマリ
export const mockMiniSummary: MiniSummary = {
  id: "mini-summary-1",
  content: "会議の要約内容",
  decisions: mockDecisions,
  unresolved: [
    {
      id: "unresolved-1",
      topic: "具体的なSSOプロバイダーの選定",
      missingInfo: ["コスト比較", "セキュリティ要件"],
      nextSteps: ["3社比較検討", "PoC実施"],
      priority: "high"
    },
    {
      id: "unresolved-2",
      topic: "認証フローの詳細設計",
      missingInfo: ["UI/UX要件", "技術仕様"],
      nextSteps: ["ワイヤーフレーム作成", "技術検証"],
      priority: "medium"
    }
  ],
  actions: mockActions,
  generated_at: "2024-01-15T10:30:00Z"
};

// サンプル脱線アラート
export const mockDeviationAlert: DeviationAlert = {
  id: "deviation-1",
  is_deviation: true,
  confidence: 0.8,
  similarity: 0.3,
  best_agenda: "認証方式の確認",
  message: "現在の話題が会議の目的から逸脱している可能性があります",
  suggestedTopics: [
    "認証方式の確認",
    "API方針の確認"
  ],
  recent_text: "会議室の予約について話し合っています",
  created_at: "2024-01-15T10:25:00Z",
  timestamp: "2024-01-15T10:25:00Z"
};

// サンプル会議サマリ
export const mockMeetingSummary: MeetingSummary = {
  id: "summary-1",
  meetingId: "meeting-1",
  content: "# プロダクト要件定義会議 - サマリ\n\n本会議では、新機能の要件定義について議論し、ログイン機能の改善とMVP機能の範囲を決定しました。主な成果として、シングルサインオンの導入と機能範囲の明確化が挙げられます。",
  decisions: mockDecisions,
  unresolved: [],
  actions: mockActions,
  parkingLot: mockParkingLot,
  generated_at: "2024-01-15T11:00:00Z"
};

// 会議統計データ
export const mockMeetingStats = {
  totalMeetings: 3,
  activeMeetings: 1,
  completedMeetings: 1,
  draftMeetings: 1,
  totalDuration: 180,
  averageDuration: 60,
  mostActiveParticipant: "田中太郎",
  totalDecisions: 2,
  totalActions: 2
};
