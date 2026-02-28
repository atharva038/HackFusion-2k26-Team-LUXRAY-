import mongoose from 'mongoose';
import Order from './src/models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const dailyOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
    ]);
    console.log("Seven Days Ago:", sevenDaysAgo);
    console.log("Daily Orders DB:", dailyOrders);

    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const orderTrends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyOrders.find(doItem => doItem._id === dateStr);
      orderTrends.push({
        dateStr,
        name: daysMap[d.getDay()],
        orders: match ? match.orders : 0
      });
    }
    console.log("Order Trends Output:", orderTrends);
    process.exit(0);
});
