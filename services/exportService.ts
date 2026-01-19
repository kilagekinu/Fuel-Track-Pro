
import { Reconciliation } from '../types';

export const exportToCSV = (recon: Reconciliation) => {
  const headers = ['Fuel Type', 'Date', 'Opening Stock', 'Receipts', 'Sales (Metered)', 'Actual Dip', 'Variance', 'Revenue', 'Status', 'Operator'];
  const data = [
    recon.fuelType,
    recon.date,
    recon.openingStock,
    recon.receipts,
    recon.calculatedSales,
    recon.actualDips,
    recon.variance,
    recon.revenue,
    recon.status,
    recon.operatorId
  ];

  const csvContent = [headers.join(','), data.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Recon_${recon.fuelType}_${recon.date.replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateTelegramPayload = (recon: Reconciliation) => {
  return `🚨 *Fuel Reconciliation Alert*
Grade: ${recon.fuelType}
Date: ${recon.date}
-----------------------
Metered Sales: ${recon.calculatedSales} L
Actual Variance: ${recon.variance.toFixed(2)} L
Revenue: $${recon.revenue.toLocaleString()}
Status: ${recon.status}
Operator: ${recon.operatorId}`;
};
