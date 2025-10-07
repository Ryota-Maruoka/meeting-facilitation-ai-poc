"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Upload, Download, Plus, Search, Filter, Eye, Pencil, Copy, Trash2 } from "lucide-react";

interface Row { date: string; title: string; members: string; status: string; tags: string[]; decided: number; unresolved: number; actions: number }

const SAMPLE: Row[] = [
  { date: "2025-10-07", title: "要件すり合わせ", members: "田中、佐藤、鈴木、山田", status: "完了", tags: ["要件定義","設計"], decided: 1, unresolved: 1, actions: 2 },
  { date: "2025-10-05", title: "API設計レビュー", members: "田中、高橋、伊藤", status: "完了", tags: ["設計レビュー"], decided: 3, unresolved: 0, actions: 4 },
  { date: "2025-10-03", title: "週次進捗確認", members: "田中、佐藤、鈴木、山田、伊藤", status: "完了", tags: ["定例","進捗"], decided: 0, unresolved: 2, actions: 5 },
  { date: "2025-10-01", title: "認証方式検討会議", members: "田中、高橋、佐藤", status: "保留中", tags: ["設計","セキュリティ"], decided: 2, unresolved: 3, actions: 1 },
  { date: "2025-09-28", title: "スプリント計画", members: "全員（8名）", status: "完了", tags: ["計画","スプリント"], decided: 5, unresolved: 1, actions: 8 },
];

export default function HistoryPage() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("2025-09-01");
  const [to, setTo] = useState("2025-10-31");

  const rows = useMemo(() => SAMPLE.filter(r => r.title.includes(q) || r.members.includes(q)), [q]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl shadow bg-white">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">議事録履歴一覧</h2>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Upload size={16}/> インポート</button>
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Download size={16}/> エクスポート</button>
              <Link href="/meetings/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2"><Plus size={16}/> 新規会議作成</Link>
            </div>
          </div>

          {/* フィルタ */}
          <div className="border-b px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500">ステータス</label>
              <select className="w-full rounded-xl border px-3 py-2 bg-white">
                <option>すべてのステータス</option>
                <option>完了</option>
                <option>保留中</option>
                <option>下書き</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500">タグ</label>
              <select className="w-full rounded-xl border px-3 py-2 bg-white">
                <option>すべてのタグ</option>
                <option>要件定義</option>
                <option>設計</option>
                <option>セキュリティ</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500">会議名・内容を検索</label>
              <div className="flex items-center gap-2">
                <input value={q} onChange={(e)=>setQ(e.target.value)} className="w-full rounded-xl border px-3 py-2"/>
                <Search size={18} className="text-gray-500"/>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500">期間：</label>
              <div className="flex items-center gap-2">
                <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-xl border px-3 py-2"/>
                <span>〜</span>
                <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-xl border px-3 py-2"/>
                <button className="rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"><Filter size={16}/></button>
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div className="px-6 py-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">日付</th>
                  <th className="py-2 pr-4">会議名</th>
                  <th className="py-2 pr-4">参加者</th>
                  <th className="py-2 pr-4">ステータス</th>
                  <th className="py-2 pr-4">タグ</th>
                  <th className="py-2 pr-4">決定</th>
                  <th className="py-2 pr-4">未決</th>
                  <th className="py-2 pr-4">アクション</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i)=> (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4 whitespace-nowrap">{r.date}</td>
                    <td className="py-2 pr-4"><Link href="/meetings/0001" className="text-indigo-600 hover:underline">{r.title}</Link></td>
                    <td className="py-2 pr-4 whitespace-nowrap">{r.members}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${r.status==="完了"?"bg-green-50 border-green-200 text-green-700": r.status==="保留中"?"bg-amber-50 border-amber-200 text-amber-700":"bg-gray-50 border-gray-200 text-gray-700"}`}>{r.status}</span>
                    </td>
                    <td className="py-2 pr-4 space-x-1">
                      {r.tags.map(t=> <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border">{t}</span>)}
                    </td>
                    <td className="py-2 pr-4">{r.decided}</td>
                    <td className="py-2 pr-4">{r.unresolved}</td>
                    <td className="py-2 pr-4">{r.actions}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Eye size={16}/><Pencil size={16}/><Copy size={16}/><Trash2 size={16}/>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 border-t pt-4">
              <div>全{rows.length}件中 1-{Math.min(rows.length,10)}件を表示</div>
              <div className="flex items-center gap-2">
                <select className="rounded-xl border px-2 py-1"><option>10件/ページ</option></select>
                <div className="flex items-center gap-1">
                  <button className="rounded-lg border px-2 py-1">‹</button>
                  <button className="rounded-lg border px-2 py-1 bg-gray-900 text-white">1</button>
                  <button className="rounded-lg border px-2 py-1">2</button>
                  <button className="rounded-lg border px-2 py-1">3</button>
                  <span>…</span>
                  <button className="rounded-lg border px-2 py-1">›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
