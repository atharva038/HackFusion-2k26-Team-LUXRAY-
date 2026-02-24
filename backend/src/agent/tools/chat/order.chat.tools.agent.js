import { tool } from "@openai/agents";
import { z } from "zod";
import { loadProducts } from "../../service/loadInfo.service.agent.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";
import { reduceQuantity } from "../../service/reduceQuantity.service.js";
import { orderConfirmation } from "../../service/email.service.agent.js";

export const order = tool({
  name: "order_medicine",
  description:
    "Place a medicine order. It checks stock, reduces inventory, and records the transaction.",

  parameters: z.object({
    patientId: z.string(),
    age: z.number(),
    gender: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    dosageFrequency: z.string(),
    prescriptionRequired: z.string(),
  }),

  execute: async ({
    patientId,
    age,
    gender,
    productName,
    quantity,
    dosageFrequency,
    prescriptionRequired,
  }) => {
    const products = await loadProducts(2);

    const product = products.find((p) => {
      if (productName)
        return p["product name"]
          .toLowerCase()
          .includes(productName.toLowerCase());
      return false;
    });

    if (!product) {
      return "❌ Product not found.";
    }

    const currentQty = Number(product["Current_Quantity"]);
    const price = Number(product["price rec"]);

    if (currentQty < quantity) {
      return `❌ Insufficient stock. Available: ${currentQty}`;
    }

    const updateResult = reduceQuantity({
      productId: product["product id"],
      quantity,
    });

    if (updateResult.error) {
      return `❌ ${updateResult.error}`;
    }

    const totalPrice = price * quantity;

    addTransaction({
      patientId,
      age,
      gender,
      purchaseDate: new Date().toISOString().split("T")[0],
      productName: product["product name"],
      quantity,
      totalPrice,
      dosageFrequency,
      prescriptionRequired,
    });
    // await orderConfirmation(
    //   patientId,
    //   new Date().toISOString().split("T")[0],
    //   product["product name"],
    //   quantity,
    //   totalPrice,
    // );

    return `✅ Order placed successfully

Product: ${product["product name"]}
Quantity: ${quantity}
Total Price: €${totalPrice}
Remaining Stock: ${updateResult.remainingQuantity}`;
  },
});
