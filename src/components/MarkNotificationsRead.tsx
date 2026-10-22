"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/app/me/notifications/actions";

// เปิดหน้าการแจ้งเตือนแล้ว = อ่านแล้ว (ทำหลังหน้าแสดงผล เพื่อให้ยังเห็นว่ารายการไหนเป็นของใหม่)
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) void markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
