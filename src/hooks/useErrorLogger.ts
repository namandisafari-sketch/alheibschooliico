import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ErrorLevel = "info" | "warning" | "error" | "critical";

interface LogErrorParams {
  message: string;
  level?: ErrorLevel;
  details?: Record<string, any>;
  stackTrace?: string;
}

export const useErrorLogger = () => {
  const { user } = useAuth();

  const logError = async ({ message, level = "error", details, stackTrace }: LogErrorParams) => {
    try {
      await supabase.from("error_logs").insert({
        message,
        level,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        url: window.location.href,
        user_id: user?.id,
        user_agent: navigator.userAgent,
        stack_trace: stackTrace,
      });
    } catch (err) {
      console.error("Failed to log error:", err);
    }
  };

  const logAndToast = async (params: LogErrorParams) => {
    await logError(params);
  };

  return { logError, logAndToast };
};

export const logErrorStatic = async (
  message: string,
  level: ErrorLevel = "error",
  details?: Record<string, any>
) => {
  try {
    await supabase.from("error_logs").insert({
      message,
      level,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
  } catch (err) {
    console.error("Failed to log error:", err);
  }
};
