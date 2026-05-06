import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import { Store } from "../models/Store.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/hash.js";

type ItemSeed = {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

type CategorySeed = {
  category: string;
  prefix: string;
  items: ItemSeed[];
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const categorySeeds: CategorySeed[] = [
  {
    category: "Apparel",
    prefix: "APP",
    items: [
      { name: "Classic Black Tee", price: 699, description: "Soft cotton crew neck tee", imageUrl: u("photo-1521572163474-6864f9cf17ab") },
      { name: "Classic White Tee", price: 699, description: "Everyday fit round neck tee", imageUrl: u("photo-1583743814966-8936f5b7be1a") },
      { name: "Blue Denim Jeans", price: 1899, description: "Slim fit stretch denim", imageUrl: u("photo-1542272604-787c3835535d") },
      { name: "Grey Pullover Hoodie", price: 2499, description: "Warm fleece-lined hoodie", imageUrl: u("photo-1618354691438-25bc04584c23") },
      { name: "Olive Cargo Pants", price: 1799, description: "Relaxed fit utility cargo", imageUrl: u("photo-1473966968600-fa801b869a1a") },
      { name: "Checked Casual Shirt", price: 1399, description: "Breathable weekend shirt", imageUrl: u("photo-1594938298603-c8148c4dae35") },
      { name: "Athletic Joggers", price: 1499, description: "Tapered joggers for active wear", imageUrl: u("photo-1617137968427-85924c800a22") },
      { name: "Navy Polo T-Shirt", price: 999, description: "Smart-casual polo tee", imageUrl: u("photo-1581655353564-df123a1eb820") },
      { name: "Sports Shorts", price: 899, description: "Quick-dry performance shorts", imageUrl: u("photo-1503342217505-b0a15ec3261c") },
      { name: "Denim Jacket", price: 2799, description: "Classic trucker-style jacket", imageUrl: u("photo-1544022613-e87ca75a784a") }
    ]
  },
  {
    category: "Footwear",
    prefix: "FTW",
    items: [
      { name: "Street Sneakers White", price: 3299, description: "Minimal low-top sneakers", imageUrl: u("photo-1549298916-b41d501d3772") },
      { name: "Running Shoes Black", price: 3999, description: "Cushioned running shoes", imageUrl: u("photo-1460353581641-37baddab0fa2") },
      { name: "Comfort Sandals Brown", price: 1499, description: "Daily comfort strapped sandals", imageUrl: u("photo-1543163521-1bf539c55dd2") },
      { name: "Canvas Slip-On", price: 1799, description: "Easy wear slip-on casual shoes", imageUrl: u("photo-1525966222134-fcfa99b8ae77") },
      { name: "Trail Hiking Shoes", price: 4599, description: "Grip outsole all-terrain shoes", imageUrl: u("photo-1529810313688-44ea1c2d81d3") },
      { name: "Office Formal Shoes", price: 2899, description: "Polished derby formal wear", imageUrl: u("photo-1614252235316-8c857d38b5f4") },
      { name: "Flip Flops", price: 499, description: "Lightweight beach flip flops", imageUrl: u("photo-1560769629-975ec94e6a86") },
      { name: "High-Top Sneakers", price: 3699, description: "Street-style ankle support shoes", imageUrl: u("photo-1491553895911-0055eca6402d") },
      { name: "Kids Velcro Shoes", price: 1399, description: "Easy strap shoes for kids", imageUrl: u("photo-1515955656352-a1fa3ffcd111") },
      { name: "Training Shoes", price: 3499, description: "Stable cross-training shoes", imageUrl: u("photo-1588361861040-ac9b1018f6d5") }
    ]
  },
  {
    category: "Accessories",
    prefix: "ACC",
    items: [
      { name: "Navy Snapback Cap", price: 899, description: "Adjustable streetwear cap", imageUrl: u("photo-1521369909029-2afed882baee") },
      { name: "Leather Belt", price: 1199, description: "Genuine leather belt", imageUrl: u("photo-1624222247344-550fb60583dc") },
      { name: "Urban Sling Bag", price: 1599, description: "Compact crossbody sling", imageUrl: u("photo-1548036328-c9fa89d128fa") },
      { name: "Steel Water Bottle", price: 499, description: "Insulated reusable bottle", imageUrl: u("photo-1602143407151-7111542de6e8") },
      { name: "Aviator Sunglasses", price: 999, description: "UV-protected metal frame", imageUrl: u("photo-1511499767150-a48a237f0083") },
      { name: "Leather Wallet", price: 1299, description: "Bi-fold card + cash wallet", imageUrl: u("photo-1627123424574-724758594e93") },
      { name: "Smart Watch Strap", price: 699, description: "Silicone replacement strap", imageUrl: u("photo-1523275335684-37898b6baf30") },
      { name: "Laptop Backpack", price: 2499, description: "Water-resistant 15-inch backpack", imageUrl: u("photo-1553062407-98eeb64c6a62") },
      { name: "Travel Duffel Bag", price: 2199, description: "Weekend carry duffel", imageUrl: u("photo-1553062407-98eeb64c6a63") },
      { name: "Cotton Crew Socks", price: 399, description: "Breathable crew-length socks", imageUrl: u("photo-1615484477201-9c3f7c687da1") }
    ]
  },
  {
    category: "Grocery",
    prefix: "GRC",
    items: [
      { name: "Premium Rice 5kg", price: 499, description: "Long grain premium rice", imageUrl: u("photo-1586201375761-83865001e31c") },
      { name: "Wheat Flour 10kg", price: 620, description: "Stone-ground whole wheat flour", imageUrl: u("photo-1603048719539-9ecb03f2fb86") },
      { name: "Sugar 1kg", price: 49, description: "Refined crystal sugar", imageUrl: u("photo-1615486363973-f79f58d0f754") },
      { name: "Sunflower Oil 1L", price: 159, description: "Heart-friendly refined oil", imageUrl: u("photo-1474979266404-7eaacbcd87c5") },
      { name: "Toor Dal 1kg", price: 169, description: "Protein-rich split pigeon pea", imageUrl: u("photo-1512621776951-a57141f2eefd") },
      { name: "Besan Flour 1kg", price: 99, description: "Fine gram flour", imageUrl: u("photo-1585238341986-6d2f1f8cfd32") },
      { name: "Sea Salt 1kg", price: 28, description: "Iodized crystal salt", imageUrl: u("photo-1518110925495-5fe2d044e4f0") },
      { name: "Red Chilli Powder 200g", price: 95, description: "Spicy ground red chilli", imageUrl: u("photo-1596040033229-a9821ebd058d") },
      { name: "Turmeric Powder 200g", price: 85, description: "Fresh yellow turmeric blend", imageUrl: u("photo-1614963326799-7d388d2a37aa") },
      { name: "Basmati Rice 1kg", price: 180, description: "Aromatic long-grain basmati", imageUrl: u("photo-1596797038530-2c107aa6f247") }
    ]
  },
  {
    category: "Beverages",
    prefix: "BEV",
    items: [
      { name: "Cola 500ml", price: 40, description: "Sparkling cola drink", imageUrl: u("photo-1624517452488-04869289c4ca") },
      { name: "Mango Juice 1L", price: 110, description: "Fruit pulp mango juice", imageUrl: u("photo-1623065422902-30a2d299bbe4") },
      { name: "Mineral Water 1L", price: 20, description: "Purified drinking water", imageUrl: u("photo-1616118132534-381148898bb4") },
      { name: "Cold Coffee 200ml", price: 60, description: "Ready-to-drink cold coffee", imageUrl: u("photo-1509042239860-f550ce710b93") },
      { name: "Orange Juice 1L", price: 105, description: "Vitamin C citrus blend", imageUrl: u("photo-1600271886742-f049cd451bba") },
      { name: "Green Tea Pack", price: 180, description: "Antioxidant tea bags", imageUrl: u("photo-1597318181409-cf64d0b5d8a2") },
      { name: "Energy Drink 250ml", price: 125, description: "Carbonated energy beverage", imageUrl: u("photo-1613478223719-2ab802602423") },
      { name: "Tonic Water 300ml", price: 55, description: "Lightly bitter mixer", imageUrl: u("photo-1513558161293-cdaf765ed2fd") },
      { name: "Iced Tea Lemon 500ml", price: 70, description: "Refreshing tea-based drink", imageUrl: u("photo-1499636136210-6f4ee915583e") },
      { name: "Coconut Water 1L", price: 95, description: "Natural electrolyte drink", imageUrl: u("photo-1622484212850-eb596d769edc") }
    ]
  },
  {
    category: "Electronics",
    prefix: "ELC",
    items: [
      { name: "Bluetooth Earbuds", price: 2299, description: "Wireless touch-control earbuds", imageUrl: u("photo-1606220588913-b3aacb4d2f46") },
      { name: "Power Bank 10000mAh", price: 1799, description: "Fast-charging power bank", imageUrl: u("photo-1587033411391-5d9e51cce126") },
      { name: "Fast Charger 20W", price: 899, description: "USB-C PD wall charger", imageUrl: u("photo-1583863788434-e58a36330cf0") },
      { name: "Type-C Cable 1m", price: 299, description: "Durable braided charging cable", imageUrl: u("photo-1583394838336-acd977736f90") },
      { name: "Wireless Mouse", price: 999, description: "Ergonomic office mouse", imageUrl: u("photo-1527864550417-7fd91fc51a46") },
      { name: "Mechanical Keyboard", price: 3499, description: "RGB tactile gaming keyboard", imageUrl: u("photo-1618384887929-16ec33fab9ef") },
      { name: "Portable Speaker", price: 2699, description: "Loud compact speaker", imageUrl: u("photo-1589003077984-894e133dabab") },
      { name: "Smart LED Bulb", price: 799, description: "App-controlled color bulb", imageUrl: u("photo-1550985543-49d6c7ef39a3") },
      { name: "Webcam 1080p", price: 2299, description: "Full HD streaming webcam", imageUrl: u("photo-1587825140708-dfaf72ae4b04") },
      { name: "Laptop Cooling Pad", price: 1499, description: "Dual fan laptop cooler", imageUrl: u("photo-1517336714739-489689fd1ca8") }
    ]
  },
  {
    category: "Personal Care",
    prefix: "PRC",
    items: [
      { name: "Herbal Shampoo 400ml", price: 299, description: "Sulfate-free herbal shampoo", imageUrl: u("photo-1607613009820-a29f7bb81c04") },
      { name: "Vitamin Face Wash", price: 189, description: "Daily skin-cleansing face wash", imageUrl: u("photo-1556228578-8c89e6adf883") },
      { name: "Body Lotion 200ml", price: 249, description: "Moisturizing body lotion", imageUrl: u("photo-1571781926291-c477ebfd024b") },
      { name: "Aloe Vera Gel", price: 199, description: "Cooling skin hydration gel", imageUrl: u("photo-1596755389378-c31d21fd1273") },
      { name: "Toothpaste 150g", price: 95, description: "Cavity-protection toothpaste", imageUrl: u("photo-1559591935-c6c3c5ef5d8b") },
      { name: "Mouthwash 250ml", price: 155, description: "Mint oral care rinse", imageUrl: u("photo-1607613009551-8f1f50d64d9c") },
      { name: "Beard Oil 50ml", price: 349, description: "Nourishing beard grooming oil", imageUrl: u("photo-1517837016564-bfc0b7f9b5c3") },
      { name: "Deodorant Spray", price: 225, description: "Long-lasting body spray", imageUrl: u("photo-1612817288484-6f916006741a") },
      { name: "Hand Sanitizer 500ml", price: 180, description: "Alcohol-based sanitizer", imageUrl: u("photo-1584483766114-2cea6facdf57") },
      { name: "Sunscreen SPF 50", price: 399, description: "Broad-spectrum UV protection", imageUrl: u("photo-1556228720-195a672e8a03") }
    ]
  },
  {
    category: "Home Essentials",
    prefix: "HME",
    items: [
      { name: "Floor Cleaner 1L", price: 199, description: "Fresh fragrance surface cleaner", imageUrl: u("photo-1581578731548-c64695cc6952") },
      { name: "Tissue Box", price: 129, description: "Soft 2-ply tissues", imageUrl: u("photo-1583947581924-860bda6a26df") },
      { name: "Dish Wash Bar", price: 35, description: "Grease-cutting dish bar", imageUrl: u("photo-1626806787461-102c1bfaaea1") },
      { name: "Laundry Detergent 1kg", price: 249, description: "Low-foam machine wash detergent", imageUrl: u("photo-1610557892470-55d9e80c0bce") },
      { name: "Glass Cleaner 500ml", price: 149, description: "Streak-free glass cleaner", imageUrl: u("photo-1563453392212-326f5e854473") },
      { name: "Garbage Bags 30pcs", price: 110, description: "Leak-resistant waste bags", imageUrl: u("photo-1605600659873-d808a13e4d2a") },
      { name: "Toilet Cleaner 500ml", price: 135, description: "Germ-kill toilet cleaner", imageUrl: u("photo-1583947215259-38e31be8751f") },
      { name: "Scrub Sponge Pack", price: 89, description: "Multi-surface cleaning sponges", imageUrl: u("photo-1590794056226-79ef3a8147e1") },
      { name: "Room Freshener", price: 175, description: "Long-lasting aroma spray", imageUrl: u("photo-1627428051228-3e44b8e5f1b4") },
      { name: "Microfiber Cloth Set", price: 160, description: "Reusable lint-free cloth set", imageUrl: u("photo-1585421514738-01798e348b17") }
    ]
  }
];

const seed = async () => {
  await connectDb();

  await Promise.all([
    Inventory.deleteMany({}),
    Product.deleteMany({}),
    Store.deleteMany({}),
    User.deleteMany({})
  ]);

  const [mainStore, secondStore] = await Store.create([
    { name: "CoreCart Central", code: "CC-HQ", address: "Downtown" },
    { name: "CoreCart North", code: "CC-NORTH", address: "North City" }
  ]);

  const [admin, manager, cashier] = await User.create([
    {
      name: "Admin User",
      email: "admin@corecart.dev",
      password: await hashPassword("Admin@123"),
      role: "admin"
    },
    {
      name: "Store Manager",
      email: "manager@corecart.dev",
      password: await hashPassword("Manager@123"),
      role: "manager",
      storeId: mainStore._id
    },
    {
      name: "Cashier One",
      email: "cashier@corecart.dev",
      password: await hashPassword("Cashier@123"),
      role: "cashier",
      storeId: mainStore._id
    }
  ]);

  const catalog = categorySeeds.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({
      sku: `${group.prefix}-${String(itemIndex + 1).padStart(2, "0")}`,
      name: item.name,
      description: item.description,
      category: group.category,
      price: item.price,
      barcode: `${groupIndex + 11}${String(itemIndex + 1).padStart(4, "0")}`,
      imageUrl: item.imageUrl
    }))
  );

  const products = await Product.create(catalog);

  const inventoryDocs = products.flatMap((product, idx) => {
    const baseQty = 72 - (idx % 12) * 4;
    const centralQty = Math.max(10, baseQty);
    const northQty = Math.max(7, baseQty - 14);

    return [
      {
        productId: product._id,
        storeId: mainStore._id,
        quantity: centralQty,
        reorderLevel: 12,
        updatedBy: manager._id
      },
      {
        productId: product._id,
        storeId: secondStore._id,
        quantity: northQty,
        reorderLevel: 9,
        updatedBy: admin._id
      }
    ];
  });

  await Inventory.create(inventoryDocs);

  // eslint-disable-next-line no-console
  console.log(`Seed complete with ${categorySeeds.length} categories and ${catalog.length} products`);
  // eslint-disable-next-line no-console
  console.log("Admin:", "admin@corecart.dev / Admin@123");
  // eslint-disable-next-line no-console
  console.log("Manager:", "manager@corecart.dev / Manager@123");
  // eslint-disable-next-line no-console
  console.log("Cashier:", "cashier@corecart.dev / Cashier@123");

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
