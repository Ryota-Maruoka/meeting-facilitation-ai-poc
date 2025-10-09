import { ClipboardList, Download, Slack } from "lucide-react";

export default function FinalSummaryPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl shadow bg-white">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <div className="text-sm font-semibold">会議名：要件すり合わせ（2025-10-07）</div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><ClipboardList size={16}/> Markdownをコピー <span className="text-amber-500">★</span></button>
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Slack size={16}/> Slackに送信 <span className="text-amber-500">★</span></button>
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Download size={16}/> ダウンロード: .md <span className="text-amber-500">★</span></button>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <h3 className="text-sm font-semibold">要約本文 <span className="text-amber-500">★</span></h3>
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="text-sm font-semibold">1) ミニ要約（時系列ダイジェスト）</div>
              <p className="text-sm leading-6">認証方式についての検討を行い、JWT案とMTLS案のメリット・デメリットを議論した。性能面ではJWTが優位だが、運用負荷とセキュリティ面での懸念事項が残った。API設計についてはAPI Aの採用が決定し、認可方式については引き続き検討が必要。</p>
              <div className="text-sm font-semibold">2) 重要論点：</div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>認証方式の比較観点（性能/運用/障害時復旧）</li>
                <li>API設計の統一性と開発効率のバランス</li>
              </ul>
            </div>

            <h3 className="text-sm font-semibold">決定 <span className="text-amber-500">★</span></h3>
            <div className="rounded-2xl border p-4">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>バックエンドはAPI A採用。理由：互換性と運用負荷。<br/>承認：田中／決定時刻 12:05</li>
              </ul>
            </div>

            <h3 className="text-sm font-semibold">未決（提案付き） <span className="text-amber-500">★</span></h3>
            <div className="rounded-2xl border p-4">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>認可方式（JWT vs MTLS） — 不足：基盤運用方針・障害事例／次の一手：PoC比較＋セキュリティレビュー依頼</li>
              </ul>
            </div>

            <h3 className="text-sm font-semibold">アクション <span className="text-amber-500">★</span></h3>
            <div className="rounded-2xl border p-4">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>佐藤：JWT PoC実施（期限：10/18）</li>
                <li>鈴木：SLA要件確認（期限：10/15）</li>
              </ul>
            </div>

            <h3 className="text-sm font-semibold">Parking Lot <span className="text-amber-500">★</span></h3>
            <div className="rounded-2xl border p-4">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>ABテスト基盤の統合案</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
