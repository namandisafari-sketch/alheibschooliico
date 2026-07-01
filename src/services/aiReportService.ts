// @ts-nocheck

export interface AIReportRequest {
  department?: string;
  period?: string;
  data: Record<string, any>;
}

export interface AIReportResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  trends: string[];
}

export const aiReportService = {
  generateReport: async (payload: AIReportRequest): Promise<AIReportResponse> => {
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("AI request failed");
      return await res.json();
    } catch {
      return {
        summary: "AI insights temporarily unavailable. Configure Baseten API key.",
        insights: ["System is running in offline mode."],
        recommendations: ["Set BASETEN_API_KEY in environment variables."],
        trends: ["Local data collection is active."],
      };
    }
  },

  generateDepartmentReport: async (
    department: string,
    departmentData: Record<string, any>,
    period?: string
  ): Promise<AIReportResponse> => {
    return aiReportService.generateReport({
      department,
      period: period || "this_term",
      data: departmentData,
    });
  },

  generateExecutiveSummary: async (
    allDepartmentData: Record<string, any>,
    period?: string
  ): Promise<AIReportResponse> => {
    return aiReportService.generateReport({
      department: "executive",
      period: period || "this_term",
      data: allDepartmentData,
    });
  },
};
