import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { analyzeStain, sendOrderEmail } from "@/inngest/functions";

// Create an API that serves zero, one, or many functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeStain,
    sendOrderEmail,
  ],
});
