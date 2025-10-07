import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl shadow bg-white border">
          <div className="border-b px-6 py-5 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Meeting Facilitation PoC</h1>
            <div className="flex gap-3">
              <Link href="/meetings/new" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">新規会議作成</Link>
              <Link href="/history" className="px-4 py-2 rounded-xl bg-gray-100 border">議事録履歴一覧</Link>
            </div>
          </div>
          <div className="p-6 text-sm text-gray-600 leading-7">
            READMEで定義された画面A/B/C/Dと履歴一覧のMVP実装。
          </div>
        </div>
      </div>
    </main>
  );
}
