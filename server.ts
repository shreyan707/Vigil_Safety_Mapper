import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "vigil-secret-key";

async function initializeDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = bcrypt.hashSync("password123", 10);
      const provider = await prisma.user.create({
        data: {
          email: "provider@vigil.org",
          password: hashedPassword,
          role: "provider",
          name: "National Women's NGO"
        }
      });
      
      await prisma.service.create({
        data: {
          name: "National Women's NGO",
          type: "NGO",
          description: "Providing legal aid and counseling for women in distress.",
          address: "Mumbai, Maharashtra",
          lat: 19.0760,
          lng: 72.8777,
          phone: "1800-123-4567",
          email: "help@nationalngo.org",
          hours: "9 AM - 6 PM",
          languages: "Hindi, English, Marathi",
          verified: 1,
          provider_id: provider.id
        }
      });

      await prisma.service.create({
        data: {
          name: "National Women's Helpline Center",
          type: "Police",
          description: "24/7 Police assistance and emergency response.",
          address: "New Delhi, India",
          lat: 28.6139,
          lng: 77.2090,
          phone: "100",
          email: "helpdesk@police.gov.in",
          hours: "24/7",
          languages: "Hindi, English",
          verified: 1
        }
      });
    }
  } catch (err) {
    console.log("Database may not be set up or migrated properly yet. Skipping data seed.");
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/services", async (req, res) => {
    const services = await prisma.service.findMany();
    res.json(services);
  });

  app.get("/api/services/:id", async (req, res) => {
    const service = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
    res.json(service);
  });

  app.post("/api/requests", async (req, res) => {
    const { issue_type, description, location, lat, lng, urgency, contact_preference, contact_info } = req.body;
    let provider_id = req.body.provider_id || null;

    if (!provider_id && lat && lng) {
      // Find nearest NGO that has a valid provider account
      const services = await prisma.service.findMany({
        where: {
          lat: { not: null },
          lng: { not: null },
          provider_id: { not: null }
        }
      });

      let nearestService = null;
      let minDistance = Infinity;

      for (const service of services) {
        if (service.lat && service.lng) {
          const R = 6371; // Earth's radius in km
          const dLat = (service.lat - lat) * Math.PI / 180;
          const dLng = (service.lng - lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(service.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          if (distance < minDistance) {
            minDistance = distance;
            nearestService = service;
          }
        }
      }

      if (nearestService && nearestService.provider_id) {
        provider_id = nearestService.provider_id;
      }
    }

    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    await prisma.request.create({
      data: {
        id,
        issue_type,
        description,
        location,
        lat,
        lng,
        urgency,
        contact_preference,
        contact_info,
        provider_id
      }
    });
    res.json({ id });
  });

  app.get("/api/requests/:id", async (req, res) => {
    const request = await prisma.request.findUnique({ where: { id: req.params.id } });
    res.json(request);
  });

  // Provider Routes (Protected)
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.get("/api/provider/dashboard", authenticate, async (req: any, res) => {
    const [total, pending, resolved] = await Promise.all([
      prisma.request.count({ where: { provider_id: req.user.id } }),
      prisma.request.count({ where: { provider_id: req.user.id, status: 'New' } }),
      prisma.request.count({ where: { provider_id: req.user.id, status: 'Resolved' } })
    ]);
    res.json({ 
      total: { count: total }, 
      pending: { count: pending }, 
      resolved: { count: resolved } 
    });
  });

  app.get("/api/provider/requests", authenticate, async (req: any, res) => {
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { provider_id: req.user.id },
          { provider_id: null }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  });

  app.patch("/api/requests/:id", authenticate, async (req: any, res) => {
    const { status, provider_id } = req.body;
    await prisma.request.update({
      where: { id: req.params.id },
      data: { status, provider_id: provider_id || req.user.id }
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  
  await initializeDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
