
const express = require('express');
const prisma = require('@prisma/client');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());

const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

app.post('/auth/register', async (req, res) => {
    let { name, email, password, role } = req.body;

    console.log("Received Request Body:", req.body); // Debugging log

    // Check if password is missing or empty
    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    password = String(password); // Ensure password is a string

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prismaClient.user.create({
            data: { name, email, password: hashedPassword, role }
        });
        res.json(user);
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// User Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user });
});

// Get All Menu Items
app.get('/menu', async (req, res) => {
    const menuItems = await prismaClient.menuItem.findMany();
    res.json(menuItems);
});

// Add Menu Item (Admin only)
app.post('/menu', async (req, res) => {
    const { name, price, category } = req.body;
    const menuItem = await prismaClient.menuItem.create({ data: { name, price, category } });
    res.json(menuItem);
});

// Place Order
app.post('/order', async (req, res) => {
    const { cashierId, items } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await prismaClient.order.create({ data: { cashierId, totalAmount, items: { create: items } } });
    res.json(order);
});

// Get Order Details
// Get Order Details
app.get('/order/:id', async (req, res) => {
    try {
        const order = await prismaClient.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        menuItem: true, // This ensures that the menuItem details (name, price) are included
                    }
                }
            }
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ message: "Error fetching order details" });
    }
});

// Process Payment
app.post('/payment', async (req, res) => {
    const { orderId, amountPaid, paymentMethod } = req.body;
    const payment = await prismaClient.payment.create({ data: { orderId, amountPaid, paymentMethod } });
    res.json(payment);
});

// Generate Receipt
app.get('/receipt/:id', async (req, res) => {
    const order = await prismaClient.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ orderId: order.id, totalAmount: order.totalAmount, items: order.items });
});



// app.get('/seed', async (req, res) => {
//     try {
//         await main();  // Call the function from your seed script
//         res.json({ message: 'Menu items seeded successfully!' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error seeding data' });
//     }
// });



// async function main() {
//     const menuItems = [
//         { id: '00cb62d8-04a3-4348-856b-ca126659477b', name: 'Grilled Salmon', price: 280.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:33.763'), imageUrl: 'https://bing.com/th?id=OSK.7b9a4974e12b2a57ca7523dd04a409d6' },
//         { id: '03b24621-ca14-43e0-b9e9-0a494d4e0c16', name: 'Chicken Crunchy Burger', price: 300.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.856'), imageUrl: 'https://i.pinimg.com/474x/e6/5a/fd/e65afd41291cd1857721b8f5ec66ba71.jpg' },
//         { id: '0de05cee-102f-4980-997f-720cc5dd886b', name: 'Chicken Thukpa', price: 180.00, category: 'Dessert', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.947'), imageUrl: 'https://i.pinimg.com/474x/bc/8f/60/bc8f60e870b821763bc9e299912e8fc5.jpg' },
//         { id: '0e38e7bc-3b3a-467e-8e63-8c784d0c4f12', name: 'Chicken Momo', price: 180.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.174'), imageUrl: 'https://i.pinimg.com/474x/53/95/f4/5395f42172e64ca3123fafcf5cdcc740.jpg' },
//         { id: '1cdce727-8f18-411d-94f9-6f78c2ea9f26', name: 'Chicken Wings', price: 150.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.767'), imageUrl: 'https://i.pinimg.com/474x/ab/29/17/ab2917479f69524bf13eda91bf0f373a.jpg' },
//         { id: '273e49ba-fef2-4538-9e71-39c76ffd551c', name: 'Chicken Biryani', price: 350.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.179'), imageUrl: 'https://i.pinimg.com/474x/6a/cc/f3/6accf3cefbe7f9779d151e3696018990.jpg' },
//         { id: '4445eb17-e72b-4611-9e90-3cd27994569c', name: 'Fruit Salad', price: 180.00, category: 'Dessert', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.261'), imageUrl: 'https://i.pinimg.com/474x/a2/58/54/a25854fc98a75b18c57855de7bffd220.jpg' },
//         { id: '4613ed48-df4b-4166-9179-3e2dc78a98d7', name: 'Gulab Jamun', price: 100.00, category: 'Dessert', isAvailable: true, createdAt: new Date('2025-03-03 06:24:33.775'), imageUrl: 'https://i.pinimg.com/474x/07/06/84/070684d7ee21575d262b138be7a0b549.jpg' },
//         { id: '4e443dbe-13b4-4d82-b64d-28f809e9b8e9', name: 'Butter Chicken', price: 400.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.171'), imageUrl: 'https://i.pinimg.com/474x/35/38/72/353872fff386a82d3d9378ed70762e9a.jpg' },
//         { id: '5524df66-27fe-45f6-b10f-bdf27a4c7896', name: 'Chicken Chilly', price: 250.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:33.653'), imageUrl: 'https://i.pinimg.com/474x/6c/44/ce/6c44ce3bbc6e6ed2e5d95ce37696e658.jpg' },
//         { id: '57f5117a-d4eb-4966-855c-9927192df1f0', name: 'Paneer Tikka', price: 300.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.127'), imageUrl: 'https://i.pinimg.com/474x/49/e5/80/49e5800ada1c3a59021e2c84bf91c457.jpg' },
//         { id: '6010726b-a905-4745-b1f6-0d4343220fce', name: 'Cheese Fries', price: 180.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.788'), imageUrl: 'https://i.pinimg.com/474x/75/c8/94/75c89424cebd61f1efab94c1ebecbd1f.jpg' },
//         { id: '62863605-408a-4968-858d-f89a787ba865', name: 'Pasta', price: 120.00, category: 'Dessert', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.922'), imageUrl: 'https://i.pinimg.com/474x/e6/f1/bb/e6f1bbef1a65c187f23cc9322342b264.jpg' },
//         { id: '6301ab34-2d02-4e84-9cdc-bec02028c948', name: 'Paneer Butter Masala', price: 380.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:33.706'), imageUrl: 'https://i.pinimg.com/474x/9a/65/90/9a65906e09943ce49c876dbe7509af86.jpg' },
//         { id: '6d1e0faa-4892-4c64-bab1-be90f5ab74a3', name: 'Choco Lava Cake', price: 220.00, category: 'Dessert', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.243'), imageUrl: 'https://i.pinimg.com/474x/40/06/4e/40064eae723748350975d14290b0b68a.jpg' },
//         { id: '7705dc3e-5556-416a-a739-d9eeed657482', name: 'Strawberry Cake', price: 300.00, category: 'Main Course', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.197'), imageUrl: 'https://i.pinimg.com/474x/1e/92/70/1e92708d4c30a0c225cd6e2a8d6aac8b.jpg' },
//         { id: '80037559-da3f-41ec-accb-db01215128fd', name: 'Blueberry Cake', price: 250.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:38.116'), imageUrl: 'https://i.pinimg.com/474x/ca/69/66/ca69666a03921c7ee8d050713c8a2802.jpg' },
//         { id: '95c989d4-2c0e-4e03-aa93-9d45f3156efa', name: 'Chocolate Cake', price: 120.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:28.774'), imageUrl: 'https://i.pinimg.com/474x/3d/d0/92/3dd0925c9d2c906f2a50b5528314542f.jpg' },
//         { id: '972cb429-5406-43d4-ae4b-ee829e38950d', name: 'Vanilla Cake', price: 100.00, category: 'Starter', isAvailable: true, createdAt: new Date('2025-03-03 06:24:33.675'), imageUrl: 'https://i.pinimg.com/474x/c5/e6/4a/c5e64a79e9600eb0e02ef21943a5a5b4.jpg' },
//     ]}


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
