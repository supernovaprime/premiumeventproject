// backend/routes/tickets.js
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

router.get("/pdf/:ticketId", protect, async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId).populate("event");
  if (!ticket || ticket.user.toString() !== req.user.id) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=ticket-${ticket._id}.pdf`);
  doc.pipe(res);

  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8fafc");

  // Header
  doc.image(ticket.event.banner || "placeholder.jpg", 50, 50, { width: 500 })
     .roundedRect(50, 50, 500, 120, 20).stroke("#4f46e5");

  // Title
  doc.fontSize(28).fillColor("#1e293b").text(ticket.event.title, 70, 190);
  doc.fontSize(16).text(`${ticket.type} Ticket`, 70, 230);

  // Details
  doc.fontSize(12).fillColor("#64748b");
  doc.text(`Date: ${new Date(ticket.event.date).toLocaleDateString()}`, 70, 280);
  doc.text(`Time: ${ticket.event.time || "TBD"}`, 70, 300);
  doc.text(`Venue: ${ticket.event.venue || "TBD"}`, 70, 320);

  // QR Code
  const qrData = await QRCode.toDataURL(ticket.qrCodeData || ticket._id);
  doc.image(qrData, 400, 260, { width: 120 });

  doc.fontSize(10).text("Scan at entrance", 400, 390, { align: "center", width: 120 });

  doc.end();
});