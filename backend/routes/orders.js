// backend/routes/orders.js
import PDFDocument from "pdfkit";

router.get("/invoice/:orderId", protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("items.product");
  if (!order || order.user.toString() !== req.user.id) {
    return res.status(404).json({ message: "Order not found" });
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).text("INVOICE", 50, 50);
  doc.fontSize(12).text(`Order #: ${order.orderNumber}`, 50, 80);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 100);

  // Items
  let y = 150;
  order.items.forEach(item => {
    doc.text(`${item.product.name} × ${item.quantity}`, 70, y);
    doc.text(`GHS ${item.price.toFixed(2)}`, 400, y);
    y += 25;
  });

  // Total
  doc.fontSize(16).text(`Total: GHS ${order.total.toFixed(2)}`, 400, y + 50);

  doc.end();
});