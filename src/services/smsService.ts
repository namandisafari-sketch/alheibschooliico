export interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SMSMessage {
  number: string;
  message_body: string;
}

export const smsService = {
  sendSMS: async (numbers: string, message_body: string, sender_id?: string): Promise<SMSResponse> => {
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numbers, message_body, sender_id }),
      });
      return await response.json();
    } catch (error) {
      console.error("SMS service error:", error);
      return { success: false, message: "Connection error" };
    }
  },

  sendBulkSMS: async (messages: SMSMessage[], sender_id?: string, reference?: string): Promise<SMSResponse> => {
    try {
      const response = await fetch("/api/sms/send/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, sender_id, reference }),
      });
      return await response.json();
    } catch (error) {
      console.error("Bulk SMS service error:", error);
      return { success: false, message: "Connection error" };
    }
  },

  getBalance: async (): Promise<SMSResponse> => {
    try {
      const response = await fetch("/api/sms/balance");
      return await response.json();
    } catch (error) {
      console.error("Balance service error:", error);
      return { success: false, message: "Connection error" };
    }
  },
};
