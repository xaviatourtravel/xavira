export type BuildProductContextInput = {
  productId?: string | null;
  productName?: string | null;
};

export type ProductContext = {
  available: boolean;
  productId: string | null;
  productName: string | null;
};

export function buildProductContext(
  input?: BuildProductContextInput,
): ProductContext {
  const productId = input?.productId?.trim() || null;
  const productName = input?.productName?.trim() || null;

  return {
    available: Boolean(productId || productName),
    productId,
    productName,
  };
}
