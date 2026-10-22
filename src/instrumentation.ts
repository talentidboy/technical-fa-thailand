import type { Instrumentation } from "next";

// ทุก error ฝั่งเซิร์ฟเวอร์ (หน้า, Server Action, API) ถูกบันทึกลงตาราง error_logs ให้แอดมินดูที่ /errors
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const error = err as Error & { digest?: string };
    const { logError } = await import("./lib/error-log");
    await logError({
      source: "SERVER",
      message: error.message,
      digest: error.digest,
      path: request.path,
      routeType: context.routeType,
      stack: error.stack,
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : null,
    });
  } catch {
    // การบันทึกล้มเหลวต้องไม่กระทบผู้ใช้
  }
};
