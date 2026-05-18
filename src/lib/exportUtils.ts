import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header] === null || row[header] === undefined ? '' : row[header];
        // Escape quotes and wrap in quotes if value contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateFinancialPDF = async ({
  month,
  year,
  expenses,
  categories,
  budgetLimits,
  user
}: {
  month: string;
  year: number;
  expenses: any[];
  categories: any[];
  budgetLimits: any[];
  user: any;
}) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthIdx = months.indexOf(month);
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === monthIdx && d.getFullYear() === year;
  });

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const income = Number(user?.income) || 0;

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(13, 148, 136); // Teal primary color
  doc.text("Aura Finance - Monthly Report", 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`${month} ${year}`, 20, 30);
  doc.text(`Generated for: ${user?.name || user?.email}`, 20, 37);

  // Summary Section
  doc.setDrawColor(241, 245, 249);
  doc.line(20, 45, 190, 45);
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Summary", 20, 55);
  
  doc.setFontSize(11);
  doc.text(`Monthly Income:`, 20, 65);
  doc.text(`₺${income.toLocaleString()}`, 70, 65);
  
  doc.text(`Total Expenses:`, 20, 72);
  doc.text(`₺${totalSpent.toLocaleString()}`, 70, 72);
  
  doc.text(`Net Cash Flow:`, 20, 79);
  const net = income - totalSpent;
  if (net >= 0) {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${net >= 0 ? '+' : ''}₺${net.toLocaleString()}`, 70, 79);
  
  doc.setTextColor(15, 23, 42);
  doc.text(`Savings Rate:`, 20, 86);
  const rate = income > 0 ? Math.round((net / income) * 100) : 0;
  doc.text(`${rate}%`, 70, 86);

  // Category Breakdown Table
  doc.setFontSize(14);
  doc.text("Spending by Category", 20, 100);
  
  const categoryData = categories.map(cat => {
    const spent = filteredExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const budget = Number(budgetLimits?.find((b: any) => b.categoryId === cat.id)?.limitAmount) || 0;
    return [
      cat.name,
      `₺${spent.toLocaleString()}`,
      budget > 0 ? `₺${budget.toLocaleString()}` : 'N/A',
      budget > 0 ? `${Math.round((spent / budget) * 100)}%` : 'N/A'
    ];
  }).filter(row => parseFloat(row[1].toString().replace('₺', '').replace(',', '')) > 0);

  autoTable(doc, {
    startY: 105,
    head: [['Category', 'Spent', 'Budget', 'Usage']],
    body: categoryData,
    headStyles: { fillStyle: 'f', fillColor: [13, 148, 136] },
    theme: 'striped'
  });

  // Top Transactions
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(14);
  doc.text("Top Transactions", 20, finalY + 15);
  
  const topTrans = [...filteredExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(e => [
      format(new Date(e.date), "MMM d, yyyy"),
      e.description,
      categories.find(c => c.id === e.categoryId)?.name || e.categoryId,
      `₺${e.amount.toLocaleString()}`
    ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Date', 'Description', 'Category', 'Amount']],
    body: topTrans,
    headStyles: { fillStyle: 'f', fillColor: [13, 148, 136] },
    theme: 'striped'
  });

  doc.save(`Aura-Report-${month}-${year}.pdf`);
};
