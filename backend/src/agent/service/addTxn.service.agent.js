import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const path2 = "../../../dataset/Consumer Order History 1.xlsx";

export async function addTransaction({
  patientId,
  age,
  gender,
  purchaseDate,
  productName,
  quantity,
  totalPrice,
  dosageFrequency,
  prescriptionRequired,
}) {
  const filePath = path.join(__dirname, path2);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);

  const newTransaction = {
    "Patient ID": patientId,
    "Patient Age": age,
    "Patient Gender": gender,
    "Purchase Date": purchaseDate,
    "Product Name": productName,
    Quantity: quantity,
    "Total Price (EUR)": totalPrice,
    "Dosage Frequency": dosageFrequency,
    "Prescription Required": prescriptionRequired,
  };

  data.push(newTransaction);

  const newSheet = xlsx.utils.json_to_sheet(data);

  workbook.Sheets[sheetName] = newSheet;

  xlsx.writeFile(workbook, filePath);

  return { message: "Transaction added successfully", newTransaction };
}
