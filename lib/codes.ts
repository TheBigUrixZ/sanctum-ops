export const BRAND_CODE = "CAE";

export const productCodes = {
  Hoodie: "HOOD",
  "T-Shirt": "TEE",
  Pants: "PANT",
  Hat: "HAT",
} as const;

export const colorCodes = {
  Black: "BLK",
  White: "WHT",
  Blue: "BLU",
  Red: "RED",
  Grey: "GRY",
} as const;

export type ProductName = keyof typeof productCodes;
export type ColorName = keyof typeof colorCodes;

export function generateSku(input: {
  brandCode?: string;
  productCode: string;
  colorCode: string;
  size: string;
  dropCode: string;
}) {
  return [
    cleanCode(input.brandCode || BRAND_CODE),
    cleanCode(input.productCode),
    cleanCode(input.colorCode),
    cleanCode(input.size),
    cleanCode(input.dropCode),
  ].join("-");
}

export function cleanCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function dollarsToCents(value: string | number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.round(numberValue * 100);
}

export function centsToDollars(value: number) {
  return (value / 100).toFixed(2);
}
