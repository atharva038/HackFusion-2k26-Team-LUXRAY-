import { tool } from "@openai/agents";
import { z } from "zod";

export const exportExcelTool = tool({
  name: "export_excel",
  description: "When the user asks to export or download medicines/inventory or orders to an Excel file, use this tool to generate the special download link.",
  parameters: z.object({
    type: z.enum(["medicines", "orders"]).describe("The type of data to export. Either 'medicines' or 'orders'."),
  }),
  execute: async ({ type }) => {
    try {
      if (type === "medicines") {
        return "Ready! Please reply to the user exactly with this link: [Click here to download Medicines Excel](#export-medicines)";
      } else if (type === "orders") {
        return "Ready! Please reply to the user exactly with this link: [Click here to download Orders Excel](#export-orders)";
      }
      return "Error: Invalid export type.";
    } catch (error) {
      return `Failed to generate link: ${error.message}`;
    }
  },
});
