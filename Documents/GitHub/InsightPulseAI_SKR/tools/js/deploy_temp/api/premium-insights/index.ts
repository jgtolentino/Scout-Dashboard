import { AzureFunction, Context } from "@azure/functions";
import axios from "axios";

const OPENAI_KEY = process.env.AZURE_OPENAI_KEY!;
const ENDPOINT   = process.env.AZURE_OPENAI_ENDPOINT!;
const DEPLOYMENT = "gpt4o-prod";

const httpTrigger: AzureFunction = async (ctx: Context, req) => {
  const roles = (req.headers["x-ms-client-roles"] || "").split(",");
  if (!roles.includes("Gold") && !roles.includes("Platinum")) {
    ctx.res = { status: 403, body: "Premium tier required" }; 
    return;
  }

  try {
    // Sample KPI data (in production, pull from database)
    const kpi = {
      totalSales: 1240000,
      conversionRate: 0.247,
      brandSentiment: 0.762,
      hotSku: "Milo 3-in-1",
      growthRate: 0.12,
      timestamp: new Date().toISOString()
    };

    const sys = `You are an FMCG retail analyst. Reply JSON only:
    { "headline": "", "bullets": [], "recommendation": "" }`;
    const user = `Latest KPIs: ${JSON.stringify(kpi)}`;

    const { data } = await axios.post(
      `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
      { 
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user }
        ],
        temperature: 0.4,
        max_tokens: 300 
      },
      { headers: { "api-key": OPENAI_KEY } }
    );

    const aiResponse = JSON.parse(data.choices[0].message.content);
    
    ctx.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: aiResponse
    };
  } catch (error) {
    ctx.log.error('Premium insights error:', error);
    ctx.res = {
      status: 500,
      body: { error: "Failed to generate premium insights" }
    };
  }
};

export default httpTrigger;