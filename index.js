
const express = require('express');
const prisma = require('@prisma/client');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());

const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

// User Registration
app.post('/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prismaClient.user.create({ data: { name, email, password: hashedPassword, role } });
    res.json(user);
});

// User Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
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





// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
