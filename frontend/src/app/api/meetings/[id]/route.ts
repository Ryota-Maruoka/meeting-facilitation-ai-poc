import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// frontendディレクトリ内のdataフォルダを参照
const MEETINGS_DIR = path.join(process.cwd(), "data", "meetings");

/**
 * GET /api/meetings/[id]
 * 特定の会議データを取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = path.join(MEETINGS_DIR, `${id}.json`);

    const data = await fs.readFile(filePath, "utf-8");
    const meeting = JSON.parse(data);

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error reading meeting:", error);
    return NextResponse.json(
      { error: "Meeting not found" },
      { status: 404 }
    );
  }
}

/**
 * POST /api/meetings/[id]
 * 会議データを保存（新規作成または更新）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const meeting = await request.json();

    // ディレクトリが存在しない場合は作成
    await fs.mkdir(MEETINGS_DIR, { recursive: true });

    // 個別のJSONファイルとして保存
    const filePath = path.join(MEETINGS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(meeting, null, 2), "utf-8");

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving meeting:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 * 会議データを削除
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = path.join(MEETINGS_DIR, `${id}.json`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}