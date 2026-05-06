export const calculateOrderTotal = (subtotal: number, discount: number, tax: number) => {
  const roundedSubtotal = Number(subtotal.toFixed(2));
  const roundedDiscount = Number(discount.toFixed(2));
  const roundedTax = Number(tax.toFixed(2));
  return Number((roundedSubtotal - roundedDiscount + roundedTax).toFixed(2));
};
