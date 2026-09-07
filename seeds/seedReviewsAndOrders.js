const mongoose = require("mongoose");
const productModel = require("../models/product.js");
const reviewModel = require("../models/review.js");
const orderModel = require("../models/order.js");
const categoryModel = require("../models/category.js");
const { clientModel } = require("../models/users/client.js");
const { storeOwnerModel } = require("../models/users/storeOwner.js");
const connect_mongodb = require("../config/connectMongoDB.js");

const reviewComments = [
    "منتج ممتاز والجودة رائعة.",
    "جودة جيدة جدًا وسأشتريه مرة أخرى.",
    "المنتج مطابق للوصف تمامًا.",
    "تجربة ممتازة والمنتج يستحق التجربة.",
    "جودة رائعة مقابل السعر.",
    "أحببت المنتج كثيرًا.",
    "النتيجة كانت أفضل مما توقعت.",
    "منتج جيد جدًا وأنصح به.",
    "التغليف كان ممتازًا والمنتج وصل بحالة جيدة.",
    "مناسب جدًا للاستخدام اليومي.",
    "المنتج جميل والجودة واضحة.",
    "تجربة جيدة جدًا.",
    "أعجبني المنتج وسأكرر الشراء.",
    "المنتج جيد لكن توقعت نتيجة أسرع.",
    "جودة مقبولة بالنسبة للسعر.",
    "من أفضل المنتجات التي جربتها.",
    "المنتج رائع وأنصح به.",
    "مناسب جدًا للبشرة والاستخدام اليومي.",
    "المنتج كما هو موضح في الصور.",
    "تجربة مرضية جدًا."
];

const seedReviewsAndOrders = async () => {
    try {
        await connect_mongodb();

        // ==========================================
        // 1. RESET OLD DATA (Orders, Reviews, Stats)
        // ==========================================
        console.log("🧹 Resetting old data...");
        await orderModel.deleteMany({});
        await reviewModel.deleteMany({});

        // Reset all product review stats
        await productModel.updateMany({}, { 
            $set: { average_rating: 0, total_rates: 0, hasReviewed: false } 
        });

        // Reset all store owners review stats and order counts
        await storeOwnerModel.updateMany({}, { 
            $set: { average_rating: 0, total_rates: 0, total_orders: 0 } 
        });

        // Reset all clients order counts
        await clientModel.updateMany({}, { 
            $set: { total_orders: 0 } 
        });
        console.log("✅ Old data and stats reset complete.\n");

        // ==========================================
        // 2. FETCH DATA
        // ==========================================
        const [clients, products, storeOwners, allCategories] = await Promise.all([
            clientModel.find().select("_id gender").lean(),
            productModel.find().select("_id owner_store_id category price name").lean(),
            storeOwnerModel.find().select("_id").lean(),
            categoryModel.find().lean(), // Fetch categories
        ]);

        if (clients.length === 0 || products.length === 0 || storeOwners.length === 0) {
            console.log("Missing data. Ensure clients, products, and store owners are seeded first.");
            return;
        }

        console.log(`Found ${clients.length} clients, ${products.length} products, and ${storeOwners.length} store owners`);

        // Map category IDs to names for gender filtering
        const categoryMap = {};
        allCategories.forEach(cat => {
            categoryMap[cat._id.toString()] = cat.name || "";
        });

        // Exact check for Men's category
        const isMensCategory = (product) => {
            const catName = categoryMap[product.category?.toString()] || "";
            return catName === "العناية بالرجال" || catName.includes("العناية بالرجال");
        };

        // ==========================================
        // 3. GENERATE ORDERS
        // ==========================================
        const ordersToCreate = [];
        const clientProductPairs = new Set();

        const numberOfOrders = 100; // Adjust as needed
        let orderCount = 0;
        let attempts = 0;
        const maxAttempts = numberOfOrders * 5;

        console.log(`Generating ${numberOfOrders} orders...`);

        while (orderCount < numberOfOrders && attempts < maxAttempts) {
            attempts++;
            
            const randomClient = clients[Math.floor(Math.random() * clients.length)];
            const isMaleClient = randomClient.gender === "male" || randomClient.gender === "ذكر";
            const randomStoreOwner = storeOwners[Math.floor(Math.random() * storeOwners.length)];

            // Filter products by store
            const storeProducts = products.filter(p => p.owner_store_id?.toString() === randomStoreOwner._id.toString());
            if (storeProducts.length === 0) continue;

            // MALE CLIENTS: ONLY Men's category products
            // FEMALE CLIENTS: Any products
            let eligibleProducts = storeProducts;
            if (isMaleClient) {
                eligibleProducts = storeProducts.filter(p => isMensCategory(p));
                if (eligibleProducts.length === 0) continue;
            }

            const numProductsToBuy = Math.min(Math.floor(Math.random() * 3) + 1, eligibleProducts.length);
            const selectedProducts = [];
            const usedProductIds = new Set();

            for (let i = 0; i < numProductsToBuy; i++) {
                let product = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];
                if (!usedProductIds.has(product._id.toString())) {
                    usedProductIds.add(product._id.toString());
                    selectedProducts.push(product);
                }
            }

            if (selectedProducts.length === 0) continue;

            let subtotal_price = 0;
            const orderProducts = [];
            
            for (const product of selectedProducts) {
                const quantity = Math.floor(Math.random() * 4) + 1;
                const price = product.price || Math.floor(Math.random() * 500) + 50;
                const subtotal_product = price * quantity;
                
                subtotal_price += subtotal_product;

                orderProducts.push({
                    prod_id: product._id,
                    name: product.name || "منتج",
                    price: price,
                    quantity: quantity,
                    subtotal_price: subtotal_product
                });

                const pairKey = `${randomClient._id.toString()}-${product._id.toString()}`;
                clientProductPairs.add(pairKey);
            }

            const delivery_cost = 50;
            const total_price = subtotal_price + delivery_cost;

            const orderStatuses = ["قيد الانتظار", "جاري التجهيز", "جاهز للتوصيل", "قيد التوصيل", "تم التوصيل", "ملغي"];
            const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

            const paymentStatuses = ["قيد الانتظار", "تم الاسترداد", "فشل", "مكتمل", "قيد المعالجة"];
            const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
            const paymentMethod = Math.random() > 0.5 ? "card" : "cash";

            const storePayout = (0.85 * subtotal_price).toFixed(2);
            const platformRevenueProducts = (0.15 * subtotal_price).toFixed(2);

            ordersToCreate.push({
                user_id: randomClient._id,
                products: [{
                    owner_store_id: randomStoreOwner._id,
                    products: orderProducts,
                    store_subtotal: subtotal_price
                }],
                subtotal_price: subtotal_price,
                currency: "EGP",
                delivery_cost: delivery_cost,
                total_price: total_price,
                payment: {
                    method: paymentMethod,
                    status: paymentStatus,
                    completedAt: paymentStatus === "مكتمل" ? new Date() : undefined
                },
                status: orderStatus,
                profit_breakdown: {
                    platform_revenue: {
                        products: parseFloat(platformRevenueProducts),
                        delivery: 10
                    },
                    stores_payout: [{
                        owner_store_id: randomStoreOwner._id,
                        amount: parseFloat(storePayout)
                    }]
                }
            });

            orderCount++;
            if (orderCount % 10 === 0) console.log(`   Generated ${orderCount} orders...`);
        }

        console.log(`Generated ${ordersToCreate.length} orders`);
        await orderModel.insertMany(ordersToCreate);
        console.log(`✅ Orders inserted successfully.\n`);

        // ==========================================
        // 4. GENERATE REVIEWS (Only for products purchased)
        // ==========================================
        console.log(`Generating reviews for purchased products...`);
        const reviewsToCreate = [];

        for (const pairKey of clientProductPairs) {
            const [clientId, productId] = pairKey.split("-");

            if (Math.random() > 0.8) continue; // 80% chance to review

            const rate = Math.floor(Math.random() * 5) + 1;
            const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
            const isActive = Math.random() > 0.05;

            reviewsToCreate.push({
                client_id: new mongoose.Types.ObjectId(clientId),
                product_id: new mongoose.Types.ObjectId(productId),
                rate,
                comment,
                isActive,
            });
        }

        console.log(`Generated ${reviewsToCreate.length} reviews`);
        await reviewModel.insertMany(reviewsToCreate);
        console.log(`✅ Reviews inserted successfully.\n`);

        // ==========================================
        // 5. UPDATE PRODUCT STATS
        // ==========================================
        console.log(`Updating product statistics...`);
        const productStats = await reviewModel.aggregate([
            { $group: { _id: "$product_id", average_rating: { $avg: "$rate" }, total_rates: { $sum: 1 } } }
        ]);

        const productUpdatePromises = productStats.map(async (stat) => {
            await productModel.findByIdAndUpdate(
                stat._id,
                {
                    average_rating: Math.round(stat.average_rating * 100) / 100,
                    total_rates: stat.total_rates,
                    hasReviewed: true
                }
            );
        });

        await Promise.all(productUpdatePromises);
        console.log(`✅ Updated ${productStats.length} products with new stats.\n`);

        // ==========================================
        // 6. UPDATE STORE OWNER STATS (Reviews + Orders)
        // ==========================================
        console.log(`Updating store owner statistics...`);
        
        // Update store owner ratings
        const storeStats = await reviewModel.aggregate([
            { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { _id: "$product.owner_store_id", average_rating: { $avg: "$rate" }, total_rates: { $sum: 1 } } }
        ]);

        // Calculate store owner order counts
        const storeOrderStats = await orderModel.aggregate([
            { $unwind: "$products" },
            { $group: { _id: "$products.owner_store_id", total_orders: { $sum: 1 } } }
        ]);

        const storeUpdatePromises = storeStats.map(async (stat) => {
            if (stat._id) {
                const orderInfo = storeOrderStats.find(s => s._id.toString() === stat._id.toString());
                await storeOwnerModel.findByIdAndUpdate(
                    stat._id,
                    {
                        average_rating: Math.round(stat.average_rating * 100) / 100,
                        total_rates: stat.total_rates,
                        total_orders: orderInfo?.total_orders || 0
                    }
                );
            }
        });

        // Handle stores that have orders but no reviews
        for (const orderStat of storeOrderStats) {
            if (!storeStats.find(s => s._id.toString() === orderStat._id.toString())) {
                await storeOwnerModel.findByIdAndUpdate(orderStat._id, { total_orders: orderStat.total_orders });
            }
        }

        await Promise.all(storeUpdatePromises);
        console.log(`✅ Updated ${storeStats.length} store owners with new stats.\n`);

        // ==========================================
        // 7. UPDATE CLIENT TOTAL ORDERS
        // ==========================================
        console.log(`Updating client statistics...`);
        const clientOrderStats = await orderModel.aggregate([
            { $group: { _id: "$user_id", total_orders: { $sum: 1 } } }
        ]);

        const clientUpdatePromises = clientOrderStats.map(async (stat) => {
            await clientModel.findByIdAndUpdate(stat._id, { total_orders: stat.total_orders });
        });

        await Promise.all(clientUpdatePromises);
        console.log(`✅ Updated ${clientUpdatePromises.length} clients with new stats.\n`);

        console.log(`🎉 Seeding completed successfully!`);
        console.log(`📊 Total orders created: ${ordersToCreate.length}`);
        console.log(`📊 Total reviews created: ${reviewsToCreate.length}`);
        console.log(`📊 Products updated: ${productStats.length}`);
        console.log(`📊 Store owners updated: ${storeStats.length}`);
        console.log(`📊 Clients updated: ${clientUpdatePromises.length}`);

    } catch (error) {
        console.error("❌ Error in seedReviewsAndOrders:", error);
    }
};

seedReviewsAndOrders();