"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * 会議詳細ページ - リダイレクト専用
 *
 * このページは削除され、会議中画面（/meetings/[id]/active）に自動リダイレクトします
 */
export default function MeetingDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  useEffect(() => {
    // 会議中画面にリダイレクト
    router.replace(`/meetings/${meetingId}/active`);
  }, [meetingId, router]);

  return null;
}
