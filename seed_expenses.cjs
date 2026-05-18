const fetch = require('node-fetch');

const TOKEN = "USER_TOKEN";
const API_URL = "http://localhost:5001/expenses";

const categories = [
  { id: "food", descriptions: ["Market alışverişi", "Akşam yemeği", "Öğle yemeği", "Kahve", "Restoran", "Yemeksepeti siparişi", "Bim alışverişi", "Migros"] },
  { id: "transport", descriptions: ["Benzin", "Otobüs bileti", "Taksi", "Uber", "Metro", "Marmaray", "Akbil dolumu"] },
  { id: "entertainment", descriptions: ["Sinema bileti", "Netflix üyeliği", "Spotify", "Konser", "Tiyatro", "Oyun alımı"] },
  { id: "shopping", descriptions: ["Kıyafet", "Ayakkabı", "Teknoloji ürünü", "Hediye", "Aksesuar", "Trendyol siparişi"] },
  { id: "utilities", descriptions: ["Elektrik faturası", "Su faturası", "İnternet", "Kira", "Doğalgaz", "Telefon faturası"] },
  { id: "health", descriptions: ["Eczane", "Muayene", "Vitamin", "Diş randevusu", "Gym üyeliği"] },
  { id: "travel", descriptions: ["Uçak bileti", "Otel rezervasyonu", "Tatil harcaması", "Gezi rehberi"] },
  { id: "other", descriptions: ["Diğer harcama", "Nakit çekim", "Borç ödemesi"] }
];

async function seed() {
  console.log("Starting to seed 300 expenses...");
  
  const now = new Date();
  
  for (let i = 0; i < 300; i++) {
    // Spread across 300 days (roughly 10 months)
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const description = category.descriptions[Math.floor(Math.random() * category.descriptions.length)];
    
    // Random amount between 20 and 1500
    const amount = parseFloat((Math.random() * (500 - 20) + 20).toFixed(2));
    
    const expense = {
      amount,
      categoryId: category.id,
      description,
      date: date.toISOString(),
      notes: "Otomatik oluşturuldu"
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(expense)
      });
      
      if (res.ok) {
        if (i % 50 === 0) console.log(`Progress: ${i}/300 added...`);
      } else {
        console.error(`Failed to add expense ${i}:`, await res.text());
      }
    } catch (err) {
      console.error(`Error at ${i}:`, err.message);
    }
    
    // Small delay to prevent overwhelming the local DB
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  console.log("Seeding complete! 300 expenses added.");
}

seed();
