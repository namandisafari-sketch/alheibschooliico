import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { documentId, filePath, documentType } = await req.json();

    if (!documentId || !filePath) {
      return new Response(
        JSON.stringify({ error: "documentId and filePath are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing OCR for document: ${documentId}, file: ${filePath}`);

    // Update status to processing
    await supabase
      .from("learner_documents")
      .update({ ocr_status: "processing" })
      .eq("id", documentId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("learner-documents")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      await supabase
        .from("learner_documents")
        .update({ ocr_status: "failed", ocr_extracted_data: { error: downloadError.message } })
        .eq("id", documentId);
      throw downloadError;
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || "application/pdf";

    // Determine extraction prompt based on document type
    let extractionPrompt = "";
    switch (documentType) {
      case "guardian_id":
        extractionPrompt = `Extract the following information from this ID document image:
- Full Name
- ID Number
- Date of Birth
- Gender
- Address
- Date of Issue
- Date of Expiry
Return the extracted data as structured JSON. If a field cannot be read, set it to null.`;
        break;
      case "academic_report":
        extractionPrompt = `Extract the following information from this academic report:
- Student Name
- School Name
- Academic Year/Term
- Class/Grade
- Subject Results (subject name, score/grade)
- Teacher Comments
- Overall Performance
Return the extracted data as structured JSON. If a field cannot be read, set it to null.`;
        break;
      case "medical_record":
        extractionPrompt = `Extract the following information from this medical document:
- Patient Name
- Date of Record
- Medical Conditions
- Allergies
- Vaccinations
- Medications
- Doctor/Clinic Name
- Recommendations
Return the extracted data as structured JSON. If a field cannot be read, set it to null.`;
        break;
      case "birth_certificate":
        extractionPrompt = `Extract the following information from this birth certificate:
- Full Name
- Date of Birth
- Place of Birth
- Father's Name
- Mother's Name
- Registration Number
- Date of Registration
Return the extracted data as structured JSON. If a field cannot be read, set it to null.`;
        break;
      default:
        extractionPrompt = `Extract all relevant text and information from this document. 
Return the extracted data as structured JSON with appropriate field names.`;
    }

    // Call Lovable AI Gateway with vision capability
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an OCR specialist that extracts information from scanned documents. 
Always respond with valid JSON only. No markdown, no explanations - just the JSON object.
If the image quality is poor, do your best to extract what you can and note any unclear fields.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: extractionPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await supabase
          .from("learner_documents")
          .update({ ocr_status: "failed", ocr_extracted_data: { error: "Rate limit exceeded" } })
          .eq("id", documentId);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const extractedContent = aiData.choices?.[0]?.message?.content;

    console.log("AI extracted content:", extractedContent);

    // Try to parse the extracted JSON
    let extractedData: any = { raw_text: extractedContent };
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = extractedContent;
      if (cleanContent.includes("```json")) {
        cleanContent = cleanContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanContent.includes("```")) {
        cleanContent = cleanContent.replace(/```\n?/g, "");
      }
      extractedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.log("Could not parse as JSON, storing raw text");
      extractedData = { raw_text: extractedContent, parse_error: true };
    }

    // Update the document with extracted data
    const { error: updateError } = await supabase
      .from("learner_documents")
      .update({
        ocr_status: "completed",
        ocr_extracted_data: extractedData,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log(`OCR completed for document: ${documentId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        extractedData,
        message: "OCR extraction completed successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OCR extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
