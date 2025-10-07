"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Dot, Square, FileText, TriangleAlert, RotateCcw, ParkingSquare, X, Eye, Pencil, Copy, Trash2 } from "lucide-react";

function Pill({ children, active=false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs border ${active?"bg-indigo-50 border-indigo-200 text-indigo-700":"bg-gray-50 border-gray-200 text-gray-700"}`}>{children}</span>
}

function Section({ title, star=false, children }: { title: string; star?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold mb-2">{title} {star && <span className="text-amber-500">★</span>}</h3>
      <div className="rounded-2xl border bg-white">{children}</div>
    </section>
  );
}

export default function MeetingLivePage() {
  const [remain, setRemain] = useState("12:34");
  const [showDeviation, setShowDeviation] = useState(false);

  const captions = [
    { t: "00:05", text: "現状はJWT検討しています。利点としては 実装の容易さと..." },
    { t: "00:42", text: "MTLS案の懸念は運用コストです。特に証明 書の..." },
    { t: "01:15", text: "要件SLAは99.99%以上必要です。これを満 たすには..." },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl shadow bg-white">
          {/* ヘッダー */}
          <div className="border-b px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/meetings/new" className="rounded-xl border px-2.5 py-1.5 bg-white hover:bg-gray-50"><ChevronLeft size={16}/></Link>
              <div className="text-sm">会議名：要件すり合わせ</div>
              <div className="flex items-center gap-1 text-sm">録音：<Dot className="text-red-500"/> </div>
              <div className="text-sm">残り：<span className="font-semibold">{remain}</span> <span className="text-amber-500">★</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/meetings/0001/summary" className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><FileText size={16}/> サマリ出力 <span className="text-amber-500">★</span></Link>
              <button className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-3 py-2"><Square size={14}/> 終了</button>
            </div>
          </div>

          {/* アジェンダ進捗バー */}
          <div className="border-b px-4 md:px-6 py-3">
            <h4 className="text-sm font-semibold">アジェンダ進捗バー <span className="text-amber-500">★</span></h4>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-gray-50 px-3 py-2 flex items-center justify-between">
                <div className="text-sm">1. 認証方式の確認</div>
                <Pill active>5/10m</Pill>
              </div>
              <div className="rounded-xl border bg-gray-50 px-3 py-2 flex items-center justify-between">
                <div className="text-sm">2. API方針の確認</div>
                <Pill>0/10m</Pill>
              </div>
              <div className="rounded-xl border bg-gray-50 px-3 py-2 flex items-center justify-between">
                <div className="text-sm">3. 次アクション決定</div>
                <Pill>0/5m</Pill>
              </div>
            </div>
          </div>

          {/* 3カラムレイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-4 md:px-6 py-5">
            {/* ライブ字幕 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">ライブ字幕 <span className="text-amber-500">★</span></h4>
              <div className="rounded-2xl border bg-white p-4 space-y-3">
                {captions.map((c, i)=> (
                  <div key={i}>
                    <div className="text-xs text-gray-500">{c.t}</div>
                    <div className="mt-1 text-sm">「{c.text}」</div>
                  </div>
                ))}
                <div className="text-xs text-gray-400">…（30-60秒で追記）</div>
              </div>
            </div>

            {/* ミニ要約 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">ミニ要約 <span className="text-amber-500">★</span></h4>
              <div className="rounded-2xl border bg-white p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold">【決定】</div>
                  <div className="mt-1 text-sm">・（空）</div>
                </div>
                <div>
                  <div className="text-xs font-semibold">【未決】</div>
                  <div className="mt-1 text-sm space-y-0.5">
                    <div>・認可方式（JWT vs MTLS）</div>
                    <div className="ml-3">├不足：基盤運用方針</div>
                    <div className="ml-3">└次の一手：PoC比較 <span className="text-amber-500">★</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold">【アクション】</div>
                  <div className="mt-1 text-sm">・佐藤：JWT PoC 10/18 <span className="text-amber-500">★</span></div>
                </div>
              </div>
            </div>

            {/* アラート/操作 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">アラート/操作 <span className="text-amber-500">★</span></h4>
              <div className="rounded-2xl border bg-white p-4 space-y-3">
                {/* アラート */}
                <div className="rounded-xl border bg-amber-50 p-3 flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 flex-shrink-0" size={16}/>
                  <div className="text-sm">脱線の可能性：直近2:10が「雑談」類似。<span className="text-amber-500">★</span></div>
                </div>
                
                {/* 操作ボタン */}
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={()=>setShowDeviation(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs bg-white hover:bg-gray-50">
                    <RotateCcw size={14}/> 軌道修正して議題1へ <span className="text-amber-500">★</span>
                  </button>
                  <button onClick={()=>setShowDeviation(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs bg-white hover:bg-gray-50">
                    <ParkingSquare size={14}/> Parking Lotへ退避 <span className="text-amber-500">★</span>
                  </button>
                  <button onClick={()=>setShowDeviation(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs bg-white hover:bg-gray-50">
                    <X size={14}/> 無視 <span className="text-amber-500">★</span>
                  </button>
                </div>

                {/* Parking Lot */}
                <div className="border-t pt-3">
                  <div className="text-sm font-semibold mb-2">Parking Lot： 3件 <span className="text-amber-500">★</span></div>
                  <div className="text-sm space-y-1 mb-3">
                    <div>1. ABテスト基盤の統合案</div>
                    <div>2. 権限設計の見直し</div>
                    <div>3. 負荷試験計画</div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs bg-white hover:bg-gray-50">
                      <Eye size={14}/> 一覧表示
                    </button>
                    <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs bg-white hover:bg-gray-50">
                      <Pencil size={14}/> 次回アジェンダ化
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* クイック操作 */}
          <div className="border-t px-4 md:px-6 py-4">
            <h4 className="text-sm font-semibold mb-3">クイック操作 <span className="text-amber-500">★</span></h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                <FileText size={14}/> 決定として確定
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                <Copy size={14}/> 未決として保持
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                <Pencil size={14}/> アクション作成
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                <Trash2 size={14}/> Slack送信 <span className="text-amber-500">★</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 画面C: 脱線モーダル */}
      {showDeviation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowDeviation(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl shadow-xl bg-white border">
            <div className="border-b px-5 py-3 text-sm font-semibold">議題からの逸脱を検知 <span className="text-amber-500">★</span></div>
            <div className="px-5 py-4 space-y-3">
              <div className="text-sm">直近 2分10秒 の会話は、アジェンダ「1. 認証方式の確認」との類似度が低い状態である。</div>
              <div className="text-sm font-semibold">候補：</div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>現在の会話は「チーム雑談」に近い（関連度 0.23）</li>
                <li>戻す先の議題候補：「1. 認証方式」「2. API方針」</li>
              </ul>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50"><RotateCcw size={14}/> 議題1へ戻す</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50"><ParkingSquare size={14}/> Parking Lotへ送る</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50"><X size={14}/> 無視</button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <label className="text-sm">件名：</label>
                <input defaultValue="会議室予約の話→次回運用会議で" className="w-full rounded-xl border px-3 py-2"/>
                <label className="inline-flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" defaultChecked className="size-4"/> 次回アジェンダに自動追加する <span className="text-amber-500">★</span>
                </label>
              </div>
            </div>
            <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
              <button onClick={()=>setShowDeviation(false)} className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
