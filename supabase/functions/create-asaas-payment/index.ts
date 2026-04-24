import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMENT_TIMEOUT = 30000;
const DOCTOR_COMMISSION_PERCENT = 50; // 50% for doctor, 50% for platform

async function asaasFetch(url: string, options: RequestInit, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(PAYMENT_TIMEOUT),
    });
    if (res.status >= 400 && res.status < 500) return res;
    if (!res.ok && attempt < 3) {
      console.warn(`Asaas API ${res.status}, retrying (${attempt}/3)...`);
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      return asaasFetch(url, options, attempt + 1);
    }
    return res;
  } catch (error: unknown) {
    console.error(`Asaas fetch error (attempt ${attempt}/3):`, error instanceof Error ? error.message : "unknown");
    if (attempt >= 3) throw error;
    await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    return asaasFetch(url, options, attempt + 1);
  }
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    console.error("Asaas returned non-JSON:", text.substring(0, 300));
    throw new Error("Asaas API returned an invalid response");
  }
  return res.json();
}

function getBaseUrl(apiKey: string): string {
  const env = Deno.env.get("ASAAS_ENVIRONMENT"); // "production" or "sandbox"
  if (env === "production") return "https://api.asaas.com/v3";
  if (env === "sandbox") return "https://api-sandbox.asaas.com/v3";
  // Auto-detect: hmlg keys → sandbox, otherwise production
  if (apiKey.includes("hmlg") || apiKey.includes("sandbox")) {
    return "https://api-sandbox.asaas.com/v3";
  }
  return "https://api.asaas.com/v3";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Asaas not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = getBaseUrl(ASAAS_API_KEY);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      customerName,
      customerCpf,
      customerEmail,
      customerPhone,
      customerMobilePhone,
      customerPostalCode,
      customerAddress,
      customerAddressNumber,
      customerProvince,
      billingType,
      value,
      description,
      appointmentId,
      planId,
      doctorProfileId, // NEW: for split
      creditCardToken,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCcv,
      cardHolderCpf,
      cardHolderPhone,
      cardHolderEmail,
      cardHolderPostalCode,
      cardHolderAddressNumber,
      cardHolderAddress,
      cardHolderProvince,
      cycle,
      nextDueDate,
      maxPayments,
      endDate,
      installmentCount,
      installmentValue,
      totalValue,
      notificationDisabled,
    } = await req.json();

    // ─── Build split array if doctor has an Asaas wallet ───
    let splitRules: { walletId: string; fixedValue?: number; percentualValue?: number }[] | undefined;
    if (doctorProfileId) {
      const { data: walletSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", `asaas_wallet_${doctorProfileId}`)
        .maybeSingle();

      if (walletSetting?.value) {
        const doctorValue = Number((value * (DOCTOR_COMMISSION_PERCENT / 100)).toFixed(2));
        splitRules = [{
          walletId: walletSetting.value,
          fixedValue: doctorValue,
        }];
        console.info(`[Split] Doctor ${doctorProfileId} → wallet ${walletSetting.value}, commission: R$${doctorValue} (${DOCTOR_COMMISSION_PERCENT}%)`);
      } else {
        console.warn(`[Split] Doctor ${doctorProfileId} has no Asaas wallet. Payment without split.`);
      }
    }

    if (!customerName || !customerCpf || !billingType || !value) {
      return new Response(
        JSON.stringify({ error: "customerName, customerCpf, billingType, and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json",
      access_token: ASAAS_API_KEY,
    };

    // ─── Step 1: Find or create customer (per docs: POST /v3/customers) ───
    const cleanCpf = customerCpf.replace(/\D/g, "");
    const searchRes = await asaasFetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, { headers });
    const searchData = await safeJson(searchRes);

    let customerId: string;

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      // Per docs: name and cpfCnpj required. mobilePhone for cell, phone for landline.
      const customerBody: Record<string, any> = {
        name: customerName,
        cpfCnpj: cleanCpf,
      };
      if (customerEmail) customerBody.email = customerEmail;
      // Per docs: "mobilePhone" is the correct field for cell phone
      // Asaas expects Brazilian format without country code: (DD)9XXXX-XXXX or 11 digits
      if (customerMobilePhone || customerPhone) {
        let rawPhone = (customerMobilePhone || customerPhone).replace(/\D/g, "");
        // Remove country code 55 prefix if present (13 digits → 11)
        if (rawPhone.length === 13 && rawPhone.startsWith("55")) {
          rawPhone = rawPhone.substring(2);
        }
        // Only set if valid length (10-11 digits)
        if (rawPhone.length >= 10 && rawPhone.length <= 11) {
          customerBody.mobilePhone = rawPhone;
        }
      }
      if (customerPostalCode) customerBody.postalCode = customerPostalCode.replace(/\D/g, "");
      if (customerAddress) customerBody.address = customerAddress;
      if (customerAddressNumber) customerBody.addressNumber = customerAddressNumber;
      if (customerProvince) customerBody.province = customerProvince;
      if (notificationDisabled !== undefined) customerBody.notificationDisabled = notificationDisabled;

      const createCustomerRes = await asaasFetch(`${baseUrl}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify(customerBody),
      });
      const customerData = await safeJson(createCustomerRes);
      if (!createCustomerRes.ok) {
        console.error("Asaas customer error:", customerData);
        return new Response(
          JSON.stringify({ error: customerData.errors?.[0]?.description || "Error creating customer" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = customerData.id;
    }

    // ─── Step 2: Create subscription (POST /v3/subscriptions) ───
    if (cycle) {
      // Per docs: customer, billingType, value, nextDueDate, cycle are required
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const subBody: Record<string, any> = {
        customer: customerId,
        billingType,
        value,
        cycle,
        nextDueDate: nextDueDate || tomorrow,
        description: description || "Assinatura AloClínica",
      };
      if (planId) subBody.externalReference = planId;
      if (maxPayments) subBody.maxPayments = maxPayments;
      if (endDate) subBody.endDate = endDate;
      if (splitRules?.length) subBody.split = splitRules;

      // Credit card: prefer token (PCI compliant), fallback to inline
      if (billingType === "CREDIT_CARD") {
        if (creditCardToken) {
          subBody.creditCardToken = creditCardToken;
        } else if (cardNumber) {
          subBody.creditCard = {
            holderName: cardHolderName,
            number: cardNumber.replace(/\s/g, ""),
            expiryMonth: cardExpiryMonth,
            expiryYear: cardExpiryYear,
            ccv: cardCcv,
          };
          subBody.creditCardHolderInfo = {
            name: cardHolderName || customerName,
            email: cardHolderEmail || customerEmail || "",
            cpfCnpj: (cardHolderCpf || customerCpf).replace(/\D/g, ""),
            phone: (cardHolderPhone || customerMobilePhone || customerPhone || "").replace(/\D/g, ""),
            postalCode: (cardHolderPostalCode || customerPostalCode || "").replace(/\D/g, ""),
            addressNumber: cardHolderAddressNumber || customerAddressNumber || "",
            address: cardHolderAddress || customerAddress || "",
            province: cardHolderProvince || customerProvince || "",
          };
        }
      }

      const subRes = await asaasFetch(`${baseUrl}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(subBody),
      });
      const subData = await safeJson(subRes);

      if (!subRes.ok) {
        console.error("Asaas subscription error:", subData);
        return new Response(
          JSON.stringify({ error: subData.errors?.[0]?.description || "Error creating subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For PIX subscriptions, fetch the first payment's QR code
      let pixData = null;
      if (billingType === "PIX" && subData.id) {
        try {
          // Wait for Asaas to generate the first payment
          await new Promise(r => setTimeout(r, 2000));
          const paymentsRes = await asaasFetch(
            `${baseUrl}/subscriptions/${subData.id}/payments?limit=1&sort=dueDate&order=asc`,
            { headers }
          );
          const paymentsData = await safeJson(paymentsRes);
          if (paymentsData.data && paymentsData.data.length > 0) {
            const firstPaymentId = paymentsData.data[0].id;
            await new Promise(r => setTimeout(r, 1000));
            const pixRes = await asaasFetch(`${baseUrl}/payments/${firstPaymentId}/pixQrCode`, { headers });
            if (pixRes.ok) {
              pixData = await safeJson(pixRes);
            }
          }
        } catch (pixErr) {
          console.warn("PIX QR code fetch for subscription failed:", pixErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "subscription",
          subscriptionId: subData.id,
          status: subData.status,
          pixQrCode: pixData?.encodedImage || null,
          pixCopyPaste: pixData?.payload || null,
          ...subData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Step 3: Create single payment (POST /v3/payments) ───
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const paymentBody: Record<string, any> = {
      customer: customerId,
      billingType,
      value,
      dueDate: tomorrow,
      description: description || "Consulta AloClínica",
    };
    if (appointmentId) paymentBody.externalReference = appointmentId;
    if (splitRules?.length) paymentBody.split = splitRules;

    // Per docs: installment fields for parcelamento (2+ parcelas only)
    if (installmentCount && installmentCount >= 2) {
      paymentBody.installmentCount = installmentCount;
      if (totalValue) {
        paymentBody.totalValue = totalValue;
      } else if (installmentValue) {
        paymentBody.installmentValue = installmentValue;
      }
    }

    // For CREDIT_CARD: prefer token-based payment, fallback to inline card data
    if (billingType === "CREDIT_CARD" && (creditCardToken || cardNumber)) {
      // If we have a token, include it directly in the payment body (PCI compliant)
      if (creditCardToken) {
        paymentBody.creditCardToken = creditCardToken;
        const payRes = await asaasFetch(`${baseUrl}/payments`, {
          method: "POST",
          headers,
          body: JSON.stringify(paymentBody),
        });
        const payData = await safeJson(payRes);

        if (!payRes.ok) {
          console.error("Asaas token payment error:", payData);
          return new Response(
            JSON.stringify({ error: payData.errors?.[0]?.description || "Error creating payment" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            type: "payment",
            paymentId: payData.id,
            status: payData.status,
            invoiceUrl: payData.invoiceUrl,
            ...payData,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Legacy fallback: create payment then pay with raw card data
      const payRes = await asaasFetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(paymentBody),
      });
      const payData = await safeJson(payRes);

      if (!payRes.ok) {
        console.error("Asaas payment error:", payData);
        return new Response(
          JSON.stringify({ error: payData.errors?.[0]?.description || "Error creating payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cardBody: Record<string, any> = {
        creditCard: {
          holderName: cardHolderName,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: cardExpiryMonth,
          expiryYear: cardExpiryYear,
          ccv: cardCcv,
        },
        creditCardHolderInfo: {
          name: cardHolderName || customerName,
          email: cardHolderEmail || customerEmail || "",
          cpfCnpj: (cardHolderCpf || customerCpf).replace(/\D/g, ""),
          phone: (cardHolderPhone || customerMobilePhone || customerPhone || "").replace(/\D/g, ""),
          postalCode: (cardHolderPostalCode || customerPostalCode || "").replace(/\D/g, ""),
          addressNumber: cardHolderAddressNumber || customerAddressNumber || "",
          address: cardHolderAddress || customerAddress || "",
          province: cardHolderProvince || customerProvince || "",
        },
      };

      const cardRes = await asaasFetch(`${baseUrl}/payments/${payData.id}/payWithCreditCard`, {
        method: "POST",
        headers,
        body: JSON.stringify(cardBody),
      });
      const cardData = await safeJson(cardRes);

      if (!cardRes.ok) {
        console.error("Asaas credit card error:", cardData);
        return new Response(
          JSON.stringify({ error: cardData.errors?.[0]?.description || "Error processing credit card" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "payment",
          paymentId: payData.id,
          status: cardData.status || payData.status,
          invoiceUrl: payData.invoiceUrl,
          ...cardData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3 (PIX / BOLETO / UNDEFINED): create payment directly
    let payRes = await asaasFetch(`${baseUrl}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(paymentBody),
    });
    let payData = await safeJson(payRes);
    let actualBillingType = billingType;
    let fallbackUsed = false;

    // If PIX fails (e.g. account not approved), auto-fallback to BOLETO
    if (!payRes.ok && billingType === "PIX") {
      const errDesc = payData.errors?.[0]?.description || "";
      const errCode = payData.errors?.[0]?.code || "";
      console.warn("PIX unavailable, falling back to BOLETO:", errDesc);
      
      paymentBody.billingType = "BOLETO";
      actualBillingType = "BOLETO";
      fallbackUsed = true;

      payRes = await asaasFetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(paymentBody),
      });
      payData = await safeJson(payRes);
    }

    if (!payRes.ok) {
      console.error("Asaas payment error:", payData);
      return new Response(
        JSON.stringify({ error: payData.errors?.[0]?.description || "Error creating payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If PIX, get QR code (GET /v3/payments/{id}/pixQrCode)
    let pixData = null;
    if (actualBillingType === "PIX" && payData.id) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const pixRes = await asaasFetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { headers });
        if (pixRes.ok) {
          pixData = await safeJson(pixRes);
        }
      } catch (error: any) {
        console.warn("PIX QR code fetch failed, payment still created:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        type: "payment",
        paymentId: payData.id,
        status: payData.status,
        invoiceUrl: payData.invoiceUrl,
        bankSlipUrl: payData.bankSlipUrl,
        pixQrCode: pixData?.encodedImage || null,
        pixCopyPaste: pixData?.payload || null,
        billingType: actualBillingType,
        fallbackUsed,
        fallbackMessage: fallbackUsed ? "PIX indisponível no momento. Boleto gerado automaticamente." : null,
        ...payData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
