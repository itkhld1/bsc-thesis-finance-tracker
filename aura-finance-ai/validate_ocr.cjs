const categories_list = [
  { id: "food", keywords: ["migros", "bim", "yemek", "restoran", "pizza", "kahve", "burger"] },
  { id: "transport", keywords: ["shell", "petrol", "taksi", "benzin", "opet", "akbil", "yakit"] },
  { id: "shopping", keywords: ["h&m", "zara", "market", "avm", "boyner", "koton", "lcw"] },
  { id: "utilities", keywords: ["fatura", "elektrik", "su", "dogalgaz", "telekom"] }
];

/**
 * Bu fonksiyon app.ts (satır 1040) içindeki gerçek parsing mantığını simüle eder.
 */
function parseReceiptLogic(text) {
  const normalizedText = text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\*/g, '');
  
  let amount = null;
  // Strateji A: Anahtar kelimeden sonraki fiyatı bul
  const totalMatch = normalizedText.match(/(toplam|tutar|total|top)\s*[:=]*\s*(\d{1,5}([.,]\d{2})?)/);
  
  if (totalMatch) {
    amount = parseFloat(totalMatch[2].replace(',', '.'));
  } else {
    // Strateji B: Metindeki en yüksek fiyatı bul (barodları elemek için 30000 sınırı)
    const priceMatches = normalizedText.match(/\d+([.,]\d{2})/g);
    if (priceMatches) {
      const prices = priceMatches
        .map(m => parseFloat(m.replace(',', '.')))
        .filter(n => n > 0 && n < 30000);
      if (prices.length > 0) amount = Math.max(...prices);
    }
  }

  let categoryId = "other";
  for (const cat of categories_list) {
    if (cat.keywords.some(keyword => normalizedText.includes(keyword))) {
      categoryId = cat.id;
      break;
    }
  }

  return { amount, categoryId };
}

// --- TEST SENARYOLARI (Gerçek Hayattan Makbuz Örnekleri) ---
const testCases = [
  { text: "MIGROS TICARET A.S. \n FIS NO: 0045 \n TOPLAM: 756,37 TL", expectedAmt: 756.37, expectedCat: "food" },
  { text: "SHELL TAVSANLI ISTASYONU \n YAKIT TUTAR: 1450,00", expectedAmt: 1450.00, expectedCat: "transport" },
  { text: "LC WAIKIKI MAGAZACILIK \n FIS TOPLAM: 1200.00 TL", expectedAmt: 1200.00, expectedCat: "shopping" },
  { text: "BURGER KING RESTORAN \n ODENEN TUTAR: 245,50", expectedAmt: 245.50, expectedCat: "food" },
  { text: "TURK TELEKOM FATURA \n ODEME: 380,00", expectedAmt: 380.00, expectedCat: "utilities" },
  { text: "ECZANE (DIGER) \n ILAC ALIMI \n TUTAR: 120.00", expectedAmt: 120.00, expectedCat: "other" },
  { text: "ZARA GIYIM \n TOTAL: 2350,90", expectedAmt: 2350.90, expectedCat: "shopping" },
  { text: "TAKSI POS FISI \n TUTAR: 185.00", expectedAmt: 185.00, expectedCat: "transport" }
];

console.log(`\n--- OCR PARSING (TESSERACT + LOGIC) DOĞRULAMA ---`);
console.log(`Test ediliyor: ${testCases.length} farklı senaryo...`);

let successfulTests = 0;

testCases.forEach((tc, index) => {
  const result = parseReceiptLogic(tc.text);
  const isAmtCorrect = result.amount === tc.expectedAmt;
  const isCatCorrect = result.categoryId === tc.expectedCat;

  if (isAmtCorrect && isCatCorrect) {
    successfulTests++;
  } else {
    console.log(`[HATA] Senaryo ${index + 1}: Beklenen ${tc.expectedAmt} (${tc.expectedCat}), Alınan ${result.amount} (${result.categoryId})`);
  }
});

const accuracy = (successfulTests / testCases.length) * 100;

console.log(`\nToplam Test: ${testCases.length}`);
console.log(`Başarılı: ${successfulTests}`);
console.log(`Başarı Oranı: %${accuracy.toFixed(1)}`);
console.log(`----------------------------------------------\n`);
