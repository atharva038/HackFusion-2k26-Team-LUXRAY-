import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const path2 = [
  "../../../dataset/Consumer Order History 1.xlsx",
  "../../../dataset/Medicine Inventory and Stock Tracking.xlsx",
  "../../../dataset/products-export.xlsx",
];

export async function loadProducts(i) {
  const filePath = path.join(__dirname, path2[i]);

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const products = xlsx.utils.sheet_to_json(sheet);
  // console.log(products);
  return products;
}
