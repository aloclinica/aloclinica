 import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN");
     if (!PAGBANK_TOKEN) {
       throw new Error("PagBank TOKEN not configured");
     }
 
     const body = await req.json();
     const {
       customerName,
       customerEmail,
       customerCpf,
       value,
       description,
       referenceId, // appointmentId or other
       paymentMethod, // PIX or CREDIT_CARD
     } = body;
 
     const isSandbox = Deno.env.get("PAGBANK_ENV") !== "production";
     const baseUrl = isSandbox 
       ? "https://sandbox.api.pagseguro.com" 
       : "https://api.pagseguro.com";
 
     // PagBank Order creation
     const orderBody = {
       reference_id: referenceId,
       customer: {
         name: customerName,
         email: customerEmail,
         tax_id: customerCpf.replace(/\D/g, ""),
         phones: body.customerPhone ? [{
           type: "MOBILE",
           number: body.customerPhone.replace(/\D/g, ""),
           area_code: body.customerPhone.substring(0, 2),
         }] : []
       },
       items: [{
         name: description || "Serviço Médico",
         quantity: 1,
         unit_amount: Math.round(value * 100), // PagBank expects cents
       }],
       qr_codes: paymentMethod === "PIX" ? [{
         amount: { value: Math.round(value * 100) },
         expiration_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour
       }] : [],
       notification_urls: [`${Deno.env.get("SUPABASE_URL")}/functions/v1/pagbank-webhook`]
     };
 
     const response = await fetch(`${baseUrl}/orders`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${PAGBANK_TOKEN}`,
       },
       body: JSON.stringify(orderBody),
     });
 
     const data = await response.json();
 
     if (!response.ok) {
       console.error("[PagBank] Order error:", data);
       throw new Error(data.error_messages?.[0]?.description || "Error creating PagBank order");
     }
 
     return new Response(JSON.stringify({
       success: true,
       orderId: data.id,
       pixQrCode: data.qr_codes?.[0]?.links?.find((l: any) => l.rel === "QRCODE.PNG")?.href,
       pixText: data.qr_codes?.[0]?.text,
       ...data
     }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
 
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
       status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });