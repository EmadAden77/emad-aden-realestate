function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateInvestmentReturn(values) {
  const purchasePrice = number(values.purchasePrice);
  const acquisitionCosts = number(values.acquisitionCosts);
  const monthlyRent = number(values.monthlyRent);
  const vacancyMonths = Math.min(12, Math.max(0, number(values.vacancyMonths)));
  const annualExpenses = number(values.maintenance) + number(values.management) + number(values.otherExpenses);
  const grossAnnualIncome = monthlyRent * 12;
  const vacancyLoss = monthlyRent * vacancyMonths;
  const effectiveIncome = Math.max(0, grossAnnualIncome - vacancyLoss);
  const netIncome = effectiveIncome - annualExpenses;
  const totalInvestment = purchasePrice + acquisitionCosts;
  const netYield = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;
  const paybackYears = netIncome > 0 ? totalInvestment / netIncome : null;
  return { currency: values.currency, effectiveIncome, netIncome, totalInvestment, netYield, paybackYears, annualExpenses, vacancyLoss };
}
