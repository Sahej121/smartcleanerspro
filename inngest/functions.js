import { inngest } from "../lib/inngest";

/**
 * Background function for AI Stain Analysis
 */
export const analyzeStain = inngest.createFunction(
  { id: "analyze-stain", triggers: { event: "garment/analyze" } },
  async ({ event, step }) => {
    const { orderId, imageUrl, garmentType } = event.data;

    const result = await step.run("call-hf-ai", async () => {
      const remoteUrl = process.env.STAIN_DETECTION_API_URL || process.env.STAIN_ANALYSIS_URL;
      if (!remoteUrl) throw new Error("STAIN_ANALYSIS_URL not configured");

      const res = await fetch(remoteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        body: JSON.stringify({ 
          image_base64: imageUrl,
          garment_type: garmentType,
          order_id: orderId 
        }),
      });

      if (!res.ok) throw new Error(`HF Space returned ${res.status}`);
      return await res.json();
    });

    await step.run("update-db", async () => {
      console.log(`[Inngest] AI Result for order ${orderId}:`, result);
    });

    return { success: true, result };
  }
);

/**
 * Background function for Post-Order Emails
 */
export const sendOrderEmail = inngest.createFunction(
  { id: "send-order-email", triggers: { event: "order/created" } },
  async ({ event, step }) => {
    const { orderId, customerEmail, orderNumber } = event.data;

    await step.run("send-email", async () => {
      console.log(`[Inngest] Sending email to ${customerEmail} for Order ${orderNumber}`);
    });

    return { success: true };
  }
);
