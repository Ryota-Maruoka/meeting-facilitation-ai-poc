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
  TranscriptChunk,
  MiniSummary,
  DeviationAlert
} from "./types";

// サンプル会議データ
export const mockMeetings: Meeting[] = [
  {
    id: "meeting-1",
    title: "プロダクト要件定義会議",
    purpose: "新機能の要件を明確にし、開発方針を決定する",
    expectedOutcome: "機能仕様書の承認と開発スケジュールの確定",
    participants: ["田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲"],
    recordingConsent: true,
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
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "meeting-2",
    title: "週次定例会議",
    purpose: "今週の進捗確認と来週の計画策定",
    expectedOutcome: "各チームの進捗状況の共有と課題の解決",
    participants: ["山田次郎", "伊藤三郎", "渡辺四郎"],
    recordingConsent: false,
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
    createdAt: "2024-01-14T14:00:00Z",
    updatedAt: "2024-01-14T15:30:00Z"
  },
  {
    id: "meeting-3",
    title: "デザインレビュー",
    purpose: "UI/UXデザインの方向性を決定する",
    expectedOutcome: "デザインシステムの基本方針の承認",
    participants: ["デザイナーA", "デザイナーB", "PM", "エンジニア"],
    recordingConsent: true,
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
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z"
  }
];

// サンプル文字起こしデータ
export const mockTranscripts: TranscriptChunk[] = [
  {
    id: "transcript-1",
    text: "それでは、本日の会議を始めさせていただきます。まず、現状の課題について整理していきましょう。",
    startTime: 0,
    endTime: 8.5,
    speaker: "田中太郎",
    confidence: 0.95
  },
  {
    id: "transcript-2", 
    text: "現在、ユーザーからのフィードバックで最も多いのは、ログイン機能の使いにくさですね。",
    startTime: 8.5,
    endTime: 15.2,
    speaker: "佐藤花子",
    confidence: 0.92
  },
  {
    id: "transcript-3",
    text: "確かに、現在のログイン画面は3ステップもあって、ユーザーが離脱してしまう原因になっています。",
    startTime: 15.2,
    endTime: 22.8,
    speaker: "鈴木一郎", 
    confidence: 0.88
  },
  {
    id: "transcript-4",
    text: "では、シングルサインオンを導入して、ワンクリックでログインできるようにするのはどうでしょうか？",
    startTime: 22.8,
    endTime: 30.1,
    speaker: "高橋美咲",
    confidence: 0.94
  }
];

// サンプル決定事項
export const mockDecisions: Decision[] = [
  {
    id: "decision-1",
    content: "ログイン機能の改善として、シングルサインオンを導入する",
    reason: "ユーザビリティの向上と離脱率の削減のため",
    owner: "高橋美咲",
    timestamp: "2024-01-15T09:45:00Z",
    status: "confirmed"
  },
  {
    id: "decision-2",
    content: "MVP機能の範囲を、認証・ダッシュボード・基本CRUD操作に限定する",
    reason: "開発期間とリソースの制約を考慮",
    owner: "田中太郎",
    timestamp: "2024-01-15T10:15:00Z",
    status: "confirmed"
  }
];

// サンプルアクションアイテム
export const mockActions: Action[] = [
  {
    id: "action-1",
    content: "SSOプロバイダーの選定とコスト試算",
    assignee: "鈴木一郎",
    dueDate: "2024-01-22T17:00:00Z",
    priority: "high",
    status: "pending",
    createdAt: "2024-01-15T09:50:00Z"
  },
  {
    id: "action-2",
    content: "認証フローのワイヤーフレーム作成",
    assignee: "佐藤花子",
    dueDate: "2024-01-20T17:00:00Z", 
    priority: "medium",
    status: "in_progress",
    createdAt: "2024-01-15T10:20:00Z"
  }
];

// サンプルParking Lot
export const mockParkingLot: ParkingLotItem[] = [
  {
    id: "parking-1",
    title: "モバイルアプリの開発について",
    description: "Webアプリの後にモバイルアプリも検討したい",
    addToNextAgenda: true,
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "parking-2",
    title: "多言語対応の検討",
    description: "将来的に海外展開を考えている",
    addToNextAgenda: false,
    createdAt: "2024-01-15T10:35:00Z"
  }
];

// サンプルミニサマリ
export const mockMiniSummary: MiniSummary = {
  decisions: [
    "ログイン機能の改善として、シングルサインオンを導入する",
    "MVP機能の範囲を、認証・ダッシュボード・基本CRUD操作に限定する"
  ],
  unresolved: [
    "具体的なSSOプロバイダーの選定",
    "認証フローの詳細設計",
    "セキュリティ要件の詳細化"
  ],
  actions: [
    "SSOプロバイダーの選定とコスト試算（鈴木一郎）",
    "認証フローのワイヤーフレーム作成（佐藤花子）"
  ]
};

// サンプル脱線アラート
export const mockDeviationAlert: DeviationAlert = {
  id: "deviation-1",
  message: "現在の話題が会議の目的から逸脱している可能性があります",
  similarity: 0.3,
  suggestedTopics: [
    "会議の目的に戻る",
    "この話題をParking Lotに移動する",
    "時間を延長する"
  ],
  created_at: "2024-01-15T10:25:00Z"
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
