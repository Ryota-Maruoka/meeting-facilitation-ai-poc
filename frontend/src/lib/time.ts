// 時間ユーティリティ（経過時間の統一フォーマット）

export const pad2 = (n: number): string => String(n).padStart(2, "0");

// エポックms差分から hh:mm:ss を生成
export const formatElapsedHMSFromMs = (elapsedMs: number): string => {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};

// ISO時刻の基準と現在から hh:mm:ss を生成（パース不可時は元文字列）
export const formatElapsedHMSFromIso = (baseIso: string | undefined, currentIso: string): string => {
  // 既に mm:ss / hh:mm:ss の場合は正規化
  const simple = currentIso.match(/^\d{1,2}:\d{2}(?::\d{2})?$/);
  if (simple) {
    const parts = currentIso.split(":").map((p) => parseInt(p, 10));
    const h = parts.length === 3 ? parts[0] : 0;
    const m = parts.length === 3 ? parts[1] : parts[0];
    const s = parts.length === 3 ? parts[2] : parts[1];
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  const base = baseIso ? Date.parse(baseIso) : NaN;
  const cur = Date.parse(currentIso);
  if (!Number.isNaN(base) && !Number.isNaN(cur)) {
    return formatElapsedHMSFromMs(cur - base);
  }

  return currentIso;
};


