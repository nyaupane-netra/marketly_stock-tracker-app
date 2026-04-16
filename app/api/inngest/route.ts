import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import {checkPriceAlerts, sendDailyNewsSummary} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendDailyNewsSummary, checkPriceAlerts],
})
