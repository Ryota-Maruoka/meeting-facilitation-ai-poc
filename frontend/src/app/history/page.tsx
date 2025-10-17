"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 履歴ページ - トップページへリダイレクト
 * メインの履歴画面は / に移動しました
 */
export default function HistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
