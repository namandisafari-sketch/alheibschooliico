import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Notification Edge Function (INACTIVE)
 * 
 * This function is a placeholder for SMS and WhatsApp notifications.
 * To activate, you need to:
 * 1. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets for SMS
 * 2. Add WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID secrets for WhatsApp
 * 3. Update the sending logic below to use the actual APIs
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if module is active (would need API keys configured)
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");

    if (!twilioSid && !whatsappToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Notification module is inactive. Please configure API credentials.",
          code: "MODULE_INACTIVE",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      channel, // 'sms' or 'whatsapp'
      recipients, // Array of { phone, name, learnerId?, guardianId? }
      message,
      templateId,
    } = await req.json();

    if (!channel || !recipients || !message) {
      return new Response(
        JSON.stringify({ error: "channel, recipients, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${channel} notification to ${recipients.length} recipients`);

    const results = [];

    for (const recipient of recipients) {
      // Create log entry
      const { data: logEntry, error: logError } = await supabase
        .from("notification_logs")
        .insert({
          template_id: templateId,
          recipient_phone: recipient.phone,
          recipient_name: recipient.name,
          learner_id: recipient.learnerId,
          guardian_id: recipient.guardianId,
          channel,
          message_content: message,
          status: "pending",
        })
        .select("id")
        .single();

      if (logError) {
        console.error("Failed to create log entry:", logError);
        continue;
      }

      try {
        // PLACEHOLDER: Actual sending logic would go here
        // For SMS (Twilio):
        // const twilioClient = new Twilio(twilioSid, twilioToken);
        // await twilioClient.messages.create({
        //   body: message,
        //   from: twilioPhone,
        //   to: recipient.phone
        // });

        // For WhatsApp:
        // await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${whatsappToken}` },
        //   body: JSON.stringify({
        //     messaging_product: 'whatsapp',
        //     to: recipient.phone,
        //     type: 'text',
        //     text: { body: message }
        //   })
        // });

        // For now, just mark as pending since module is inactive
        console.log(`Would send ${channel} to ${recipient.phone}: ${message.substring(0, 50)}...`);

        results.push({
          phone: recipient.phone,
          status: "pending",
          logId: logEntry.id,
        });
      } catch (sendError) {
        console.error(`Failed to send to ${recipient.phone}:`, sendError);

        await supabase
          .from("notification_logs")
          .update({
            status: "failed",
            error_message: sendError instanceof Error ? sendError.message : "Unknown error",
          })
          .eq("id", logEntry.id);

        results.push({
          phone: recipient.phone,
          status: "failed",
          error: sendError instanceof Error ? sendError.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification queued for ${results.length} recipients`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
