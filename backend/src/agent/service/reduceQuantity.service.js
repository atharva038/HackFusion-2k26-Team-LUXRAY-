import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../../../dataset/products-export.xlsx");

export async function reduceQuantity({ productId, productName, quantity }) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);

  const product = data.find((item) => {
    if (productId) return String(item["product id"]) === String(productId);
    if (productName)
      return item["product name"]
        .toLowerCase()
        .includes(productName.toLowerCase());
    return false;
  });

  if (!product) {
    return { error: "Product not found" };
  }

  const currentQty = Number(product["Current_Quantity"]);

  if (currentQty < quantity) {
    return {
      error: `Insufficient stock. Available: ${currentQty}`,
    };
  }

  product["Current_Quantity"] = currentQty - quantity;

  const newSheet = xlsx.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = newSheet;

  xlsx.writeFile(workbook, filePath);

  return {
    message: "Quantity updated successfully",
    productId: product["product id"],
    productName: product["product name"],
    remainingQuantity: product["Current_Quantity"],
  };
}
