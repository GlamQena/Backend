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

// single rounding helper
const round2 = (n) => Math.round(n * 100) / 100;

const seedReviewsAndOrders = async () => {
    try {
        await connect_mongodb();

        // ==========================================
        // 1. RESET OLD DATA (Orders, Reviews, Stats)
        // ==========================================
        console.log("🧹 Resetting old data...");
        await orderModel.deleteMany({});
        await reviewModel.deleteMany({});

        await productModel.updateMany({}, {
            $set: { average_rating: 0, total_rates: 0, hasReviewed: false }
        });

        await storeOwnerModel.updateMany({}, {
            $set: { average_rating: 0, total_rates: 0, total_orders: 0 }
        });

        await clientModel.updateMany({}, {
            $set: { totalOrders: 0, totalSpent: 0 }
        });
        console.log("✅ Old data and stats reset complete.\n");

        // ==========================================
        // 2. FETCH DATA
        // ==========================================
        const [clients, products, storeOwners, allCategories] = await Promise.all([
            clientModel.find().select("_id gender").lean(),
            productModel.find().select("_id owner_store_id category_id price name").lean(),
            storeOwnerModel.find().select("_id").lean(),
            categoryModel.find().lean(),
        ]);

        if (clients.length === 0 || products.length === 0 || storeOwners.length === 0) {
            console.log("Missing data. Ensure clients, products, and store owners are seeded first.");
            return;
        }

        console.log(`Found ${clients.length} clients, ${products.length} products, and ${storeOwners.length} store owners`);

        const categoryMap = {};
        allCategories.forEach(cat => {
            categoryMap[cat._id.toString()] = cat.name || "";
        });

        const isMensCategory = (product) => {
            const catName = categoryMap[product.category_id?.toString()] || "";
            return catName === "العناية بالرجال" || catName.includes("رجال");
        };

        // ==========================================
        // 3. GENERATE ORDERS
        // ==========================================
        const ordersToCreate = [];

        const numberOfOrders = 100;
        let orderCount = 0;
        let attempts = 0;
        const maxAttempts = numberOfOrders * 5;

        console.log(`Generating ${numberOfOrders} orders...`);

        while (orderCount < numberOfOrders && attempts < maxAttempts) {
            attempts++;

            const randomClient = clients[Math.floor(Math.random() * clients.length)];
            const isMaleClient = randomClient.gender === "male" || randomClient.gender === "ذكر";
            const randomStoreOwner = storeOwners[Math.floor(Math.random() * storeOwners.length)];

            const storeProducts = products.filter(
                p => p.owner_store_id?.toString() === randomStoreOwner._id.toString()
            );
            if (storeProducts.length === 0) continue;

            let eligibleProducts = storeProducts;
            if (isMaleClient) {
                eligibleProducts = storeProducts.filter(p => isMensCategory(p));
                if (eligibleProducts.length === 0) continue;
            }

            const numProductsToBuy = Math.min(
                Math.floor(Math.random() * 3) + 1,
                eligibleProducts.length
            );
            const selectedProducts = [];
            const usedProductIds = new Set();

            for (let i = 0; i < numProductsToBuy; i++) {
                const product = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];
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

                // Bug 7 fix: round the line subtotal and running subtotal
                const subtotal_product = round2(price * quantity);
                subtotal_price = round2(subtotal_price + subtotal_product);

                orderProducts.push({
                    prod_id: product._id,
                    name: product.name || "منتج",
                    price: price,
                    quantity: quantity,
                    subtotal_price: subtotal_product
                });
            }

            const delivery_cost = 50;

            // Bug 7 fix: round the grand total
            const total_price = round2(subtotal_price + delivery_cost);

            // ------------------------------------------
            // Bug 6 fix: correlate order status -> payment status
            // ------------------------------------------
            const orderStatuses = [
                "قيد الانتظار",
                "جاري التجهيز",
                "جاهز للتوصيل",
                "قيد التوصيل",
                "تم التوصيل",
                "ملغي"
            ];
            const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

            let paymentStatus;
            if (orderStatus === "تم التوصيل") {
                paymentStatus = "مكتمل";
            } else if (orderStatus === "ملغي") {
                paymentStatus = Math.random() > 0.5 ? "تم الاسترداد" : "فشل";
            } else {
                // in-flight orders: paid, pending, or processing
                const inFlight = ["قيد الانتظار", "قيد المعالجة", "مكتمل"];
                paymentStatus = inFlight[Math.floor(Math.random() * inFlight.length)];
            }

            const randomNum = Math.random();
            const paymentMethod = randomNum > 0.66 ? "card"
                : randomNum > 0.33 ? "cash"
                : "wallet";

            // Bug 7 fix: round payout / platform revenue
            const storePayout = round2(0.85 * subtotal_price);
            const platformRevenueProducts = round2(0.15 * subtotal_price);

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
                        products: platformRevenueProducts,
                        delivery: 10
                    },
                    stores_payout: [{
                        owner_store_id: randomStoreOwner._id,
                        amount: storePayout
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
        // 4. BUILD REVIEWABLE PAIRS (Bug 5 fix)
        //    Only from orders whose status === "تم التوصيل"
        // ==========================================
        console.log(`Collecting reviewable (client, product) pairs from delivered orders...`);
        const clientProductPairs = new Set();

        for (const order of ordersToCreate) {
            if (order.status !== "تم التوصيل") continue;

            const clientId = order.user_id.toString();
            for (const storeGroup of order.products) {
                for (const prod of storeGroup.products) {
                    clientProductPairs.add(`${clientId}-${prod.prod_id.toString()}`);
                }
            }
        }

        console.log(`Found ${clientProductPairs.size} eligible (client, product) pairs from delivered orders.`);

        // ==========================================
        // 5. GENERATE REVIEWS
        // ==========================================
        console.log(`Generating reviews for delivered purchases...`);
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
        if (reviewsToCreate.length > 0) {
            await reviewModel.insertMany(reviewsToCreate);
        }
        console.log(`✅ Reviews inserted successfully.\n`);

        // ==========================================
        // 6. UPDATE PRODUCT STATS
        // ==========================================
        console.log(`Updating product statistics...`);
        const productStats = await reviewModel.aggregate([
            { $group: { _id: "$product_id", average_rating: { $avg: "$rate" }, total_rates: { $sum: 1 } } }
        ]);

        await Promise.all(productStats.map(stat =>
            productModel.findByIdAndUpdate(stat._id, {
                average_rating: round2(stat.average_rating),
                total_rates: stat.total_rates,
                hasReviewed: true
            })
        ));
        console.log(`✅ Updated ${productStats.length} products with new stats.\n`);

        // ==========================================
        // 7. UPDATE STORE OWNER STATS
        // ==========================================
        console.log(`Updating store owner statistics...`);

        const storeStats = await reviewModel.aggregate([
            { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { _id: "$product.owner_store_id", average_rating: { $avg: "$rate" }, total_rates: { $sum: 1 } } }
        ]);

        const storeOrderStats = await orderModel.aggregate([
            { $unwind: "$products" },
            { $group: { _id: "$products.owner_store_id", total_orders: { $sum: 1 } } }
        ]);

        await Promise.all(storeStats.map(async (stat) => {
            if (!stat._id) return;
            const orderInfo = storeOrderStats.find(s => s._id.toString() === stat._id.toString());
            await storeOwnerModel.findByIdAndUpdate(stat._id, {
                average_rating: round2(stat.average_rating),
                total_rates: stat.total_rates,
                total_orders: orderInfo?.total_orders || 0
            });
        }));

        // Stores with orders but no reviews
        for (const orderStat of storeOrderStats) {
            if (!storeStats.find(s => s._id.toString() === orderStat._id.toString())) {
                await storeOwnerModel.findByIdAndUpdate(orderStat._id, { total_orders: orderStat.total_orders });
            }
        }

        console.log(
            `✅ Updated ${storeStats.length} store owners with review stats ` +
            `and ${storeOrderStats.length} with order stats.\n`
        );

        // ==========================================
        // 8. UPDATE CLIENT STATS
        // ==========================================
        console.log(`Updating client statistics...`);
        const clientOrderStats = await orderModel.aggregate([
            {
                $group: {
                    _id: "$user_id",
                    totalSpent: { $sum: "$total_price" }, // Bug 7 fix: round on write
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        await Promise.all(clientOrderStats.map(stat =>
            clientModel.findByIdAndUpdate(stat._id, {
                totalOrders: stat.totalOrders,
                totalSpent: round2(stat.totalSpent)
            })
        ));
        console.log(`✅ Updated ${clientOrderStats.length} clients with new stats.\n`);

        console.log(`🎉 Seeding completed successfully!`);
        console.log(`📊 Total orders created: ${ordersToCreate.length}`);
        console.log(`📊 Total reviews created: ${reviewsToCreate.length}`);
        console.log(`📊 Products updated: ${productStats.length}`);
        console.log(`📊 Store owners updated: ${storeStats.length}`);
        console.log(`📊 Clients updated: ${clientOrderStats.length}`);

    } catch (error) {
        console.error("❌ Error in seedReviewsAndOrders:", error);
    } finally {
        await mongoose.disconnect();
    }
};

seedReviewsAndOrders();

// Math.round(x*100)/100 used to round to the nearest two decimal numbers like toFixed(2)
// only the difference is that toFixed(2) returns a string while Math.round returns a numeric
// value ready to store in DB without needing conversion (parseFloat).
// also toFixed() preserves padded trailing zeros unlike Math.round().