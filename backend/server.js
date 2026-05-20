import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import Product from "./models/Product.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

app.post("/recommend", async (req, res) => {
  try {
    const { image, occasion } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist who suggests caps based on user appearance and occasion.",
        },
        {
          role: "user",
          content: `User is going for ${occasion}.
Give a short, clean recommendation in 3-4 lines.
No markdown, no ** symbols.
Just plain readable text.`,
        },
      ],
    });

    res.json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("GET products error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json(product);
  } catch (error) {
    console.error("POST products error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(product);
  } catch (error) {
    console.error("PUT products error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("DELETE products error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/send-invoice", async (req, res) => {
  try {
    const { order, pdfBase64, invoiceNumber } = req.body;

    console.log(`📧 Email invoice request → to: ${order.email}, invoice: ${invoiceNumber}`);

    if (!order.email) {
      return res.status(400).json({ error: "No email address found for this store." });
    }

    // Strip data URI prefix if present (data:application/pdf;base64,<data>)
    const base64Data = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    const newItemsHtml = (order.newItems || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border:1px solid #ddd">${item.name}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;text-align:right">$${Number(item.price).toFixed(2)}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;text-align:right">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const returnItemsHtml = (order.returnItems || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border:1px solid #ddd">${item.name}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;color:#c0392b">-$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#1a1a2e;padding:24px 28px">
          <h1 style="margin:0;color:#fff;font-size:22px">AI Cap Stylist</h1>
          <p style="margin:4px 0 0;color:#aaa;font-size:13px">Smart Cap Distribution Invoice</p>
        </div>

        <div style="padding:28px">
          <p style="margin:0 0 4px">Dear <strong>${order.ownerName || "Store Owner"}</strong>,</p>
          <p style="color:#555;margin:0 0 24px">Please find your invoice attached as a PDF. A summary is included below.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="width:50%;vertical-align:top">
                <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Invoice</p>
                <p style="margin:2px 0 0;font-size:15px;font-weight:bold">${invoiceNumber}</p>
              </td>
              <td style="width:50%;vertical-align:top;text-align:right">
                <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Date</p>
                <p style="margin:2px 0 0;font-size:15px">${new Date().toLocaleDateString()}</p>
              </td>
            </tr>
          </table>

          <div style="background:#f9f9f9;border-radius:6px;padding:16px;margin-bottom:24px">
            <p style="margin:0 0 4px;font-weight:bold">Bill To</p>
            <p style="margin:0;color:#555">${order.storeName}</p>
            <p style="margin:0;color:#555">${order.storeAddress}</p>
            <p style="margin:0;color:#555">${order.phone}</p>
          </div>

          ${
            newItemsHtml
              ? `<h3 style="margin:0 0 10px;font-size:15px">New Order Items</h3>
                 <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                   <thead>
                     <tr style="background:#1a1a2e;color:#fff">
                       <th style="padding:8px 12px;text-align:left">Item</th>
                       <th style="padding:8px 12px;text-align:center">Qty</th>
                       <th style="padding:8px 12px;text-align:right">Price</th>
                       <th style="padding:8px 12px;text-align:right">Total</th>
                     </tr>
                   </thead>
                   <tbody>${newItemsHtml}</tbody>
                 </table>`
              : ""
          }

          ${
            returnItemsHtml
              ? `<h3 style="margin:0 0 10px;font-size:15px">Returned Items</h3>
                 <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                   <thead>
                     <tr style="background:#7f1d1d;color:#fff">
                       <th style="padding:8px 12px;text-align:left">Item</th>
                       <th style="padding:8px 12px;text-align:center">Qty</th>
                       <th style="padding:8px 12px;text-align:right">Credit</th>
                     </tr>
                   </thead>
                   <tbody>${returnItemsHtml}</tbody>
                 </table>`
              : ""
          }

          <div style="border-top:2px solid #e0e0e0;padding-top:16px;text-align:right">
            <p style="margin:4px 0;color:#555">New Order Total: <strong>$${Number(order.orderTotal || 0).toFixed(2)}</strong></p>
            <p style="margin:4px 0;color:#c0392b">Return Credit: <strong>-$${Number(order.returnTotal || 0).toFixed(2)}</strong></p>
            <p style="margin:8px 0 0;font-size:18px">Final Amount Due: <strong style="color:#1a1a2e">$${Number(order.finalAmount || 0).toFixed(2)}</strong></p>
          </div>

          <p style="margin:28px 0 0;color:#888;font-size:13px;text-align:center">
            Thank you for your business! — AI Cap Stylist
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Cap Stylist" <${process.env.BREVO_USER}>`,
      to: order.email,
      subject: `Invoice ${invoiceNumber} — AI Cap Stylist`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: base64Data,
          encoding: "base64",
        },
      ],
    });

    console.log(`✅ Email sent successfully to ${order.email}`);
    res.json({ message: "Invoice email sent successfully." });
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
