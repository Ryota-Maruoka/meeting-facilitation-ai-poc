import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// frontendディレクトリ内のdataフォルダを参照
const MEETINGS_DIR = path.join(process.cwd(), "data", "meetings");

/**
 * GET /api/meetings
 * 全ての会議データを取得（全JSONファイルを読み込み）
 */
export async function GET() {
  try {
    // ディレクトリが存在するか確認
    try {
      await fs.access(MEETINGS_DIR);
    } catch {
      return NextResponse.json([]);
    }

    // ディレクトリ内の全ファイルを取得
    const files = await fs.readdir(MEETINGS_DIR);

    // .jsonファイルのみフィルタ（.sample.jsonは除外）
    const jsonFiles = files.filter(
      (file) => file.endsWith(".json") && !file.endsWith(".sample.json")
    );

    // 全JSONファイルを読み込み
    const meetingsData = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(MEETINGS_DIR, file);
          const data = await fs.readFile(filePath, "utf-8");
          const parsed = JSON.parse(data);

          // 配列が返された場合は無視（古い形式のファイル）
          if (Array.isArray(parsed)) {
            return null;
          }

          return parsed;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
          return null;
        }
      })
    );

    // nullを除外
    const meetings = meetingsData.filter((m) => m !== null);

    // 日付でソート（新しい順）
    meetings.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error reading meetings:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}