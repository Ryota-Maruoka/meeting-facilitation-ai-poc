"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Save, File, Play, Star, Plus, CalendarDays } from "lucide-react";

interface AgendaItem { id: string; title: string; minutes: number; outcome?: string; url?: string }

export default function NewMeetingPage() {
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [artifact, setArtifact] = useState("");
  const [participants, setParticipants] = useState("");
  const [consent, setConsent] = useState(true);
  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { id: "1", title: "議題1のタイトル", minutes: 10, outcome: "この議題で得たい結果" },
    { id: "2", title: "議題2のタイトル", minutes: 15, outcome: "この議題で得たい結果" },
  ]);

  const total = useMemo(() => agenda.reduce((s, a) => s + (a.minutes || 0), 0), [agenda]);

  const onAddAgenda = () => setAgenda((a) => [...a, { id: String(a.length + 1), title: "", minutes: 5 }]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl shadow bg-white">
          {/* 1.1.1.1 Background+HorizontalBorder */}
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">新規会議作成 <span className="text-amber-500">★</span></h2>
            <div className="flex items-center gap-2">
              {/* 保存 */}
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-gray-50 hover:bg-gray-100"><Save size={16}/> 保存</button>
              {/* 下書き */}
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-gray-50 hover:bg-gray-100"><File size={16}/> 下書き</button>
              {/* 開始 */}
              <Link href={{ pathname: "/meetings/0001" }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2"><Play size={16}/> 開始 <Star size={14} className="text-amber-500"/></Link>
            </div>
          </div>

          {/* 会議メタ情報 */}
          <section className="px-6 py-5 border-b">
            <h3 className="text-base font-semibold">会議メタ情報 <span className="text-amber-500">★</span></h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* タイトル */}
              <div>
                <label className="block text-sm text-gray-600">タイトル：</label>
                <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="会議タイトルを入力" className="mt-1 w-full rounded-xl border px-3 py-2"/>
              </div>
              {/* 目的 */}
              <div>
                <label className="block text-sm text-gray-600">目的：<span className="text-amber-500">★</span></label>
                <input value={purpose} onChange={(e)=>setPurpose(e.target.value)} placeholder="何を決めたいか１行で" className="mt-1 w-full rounded-xl border px-3 py-2"/>
              </div>
              {/* 成果物 */}
              <div>
                <label className="block text-sm text-gray-600">成果物：<span className="text-amber-500">★</span></label>
                <input value={artifact} onChange={(e)=>setArtifact(e.target.value)} placeholder="決定文の雛形（何を/なぜ/誰が/いつまで）" className="mt-1 w-full rounded-xl border px-3 py-2"/>
              </div>
              {/* 参加者 */}
              <div>
                <label className="block text-sm text-gray-600">参加者：</label>
                <input value={participants} onChange={(e)=>setParticipants(e.target.value)} placeholder="＠tanaka ＠suzuki ＠...（任意）" className="mt-1 w-full rounded-xl border px-3 py-2"/>
              </div>
              {/* 録音同意 */}
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="size-4"/>
                  録音同意：全員に録音同意を取得する <span className="text-amber-500">★</span>
                </label>
              </div>
            </div>
          </section>

          {/* アジェンダエリア */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">アジェンダエリア <span className="text-amber-500">★</span></h3>
              <div className="flex items-center gap-2">
                <button onClick={onAddAgenda} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Plus size={16}/> 議題を追加</button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {agenda.map((item, idx) => (
                <div key={item.id} className="rounded-2xl border bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-1 text-sm text-gray-500">{idx+1})</div>
                    <div className="md:col-span-5">
                      <label className="block text-xs text-gray-500">タイトル</label>
                      <input value={item.title} onChange={(e)=>{
                        const v = e.target.value; setAgenda(a=>a.map(x=>x.id===item.id?{...x,title:v}:x));
                      }} placeholder={`議題${idx+1}のタイトル`} className="mt-1 w-full rounded-xl border bg-white px-3 py-2"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500">時間</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input type="number" min={0} value={item.minutes} onChange={(e)=>{
                          const v = Number(e.target.value||0); setAgenda(a=>a.map(x=>x.id===item.id?{...x,minutes:v}:x));
                        }} className="w-20 rounded-xl border bg-white px-3 py-2"/>
                        <span className="text-sm">分</span>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-500">期待成果 <span className="text-amber-500">★</span></label>
                      <input value={item.outcome||""} onChange={(e)=>{
                        const v = e.target.value; setAgenda(a=>a.map(x=>x.id===item.id?{...x,outcome:v}:x));
                      }} placeholder="この議題で得たい結果" className="mt-1 w-full rounded-xl border bg-white px-3 py-2"/>
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-xs text-gray-500">関連資料URL <span className="text-sky-500">◇</span></label>
                      <input value={item.url||""} onChange={(e)=>{
                        const v = e.target.value; setAgenda(a=>a.map(x=>x.id===item.id?{...x,url:v}:x));
                      }} placeholder="https://..." className="mt-1 w-full rounded-xl border bg-white px-3 py-2"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">合計時間：<span className="font-semibold">{total}分</span></div>
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><CalendarDays size={16}/> カレンダーから読込 <span className="text-sky-500">◇</span></button>
            </div>
          </section>

          {/* テンプレ & チェック */}
          <section className="px-6 py-5">
            <h3 className="text-base font-semibold">テンプレ & チェック <span className="text-amber-500">★</span></h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-600">テンプレ：</label>
                <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2">
                  <option>要件定義</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">欠落チェック：</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "purpose", label: "目的" },
                    { id: "artifact", label: "成果物" },
                    { id: "decision", label: "決定ポイント" },
                    { id: "time", label: "時間配分" },
                  ].map((c) => (
                    <label key={c.id} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="size-4"/> {c.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
