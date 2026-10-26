export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function savingsPercent(pricePaise: number, mrpPaise: number): number | null {
  if (mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
