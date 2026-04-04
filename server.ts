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
const PROFILE_SERVICE_KEYS = [
  "domesticViolence",
  "harassment",
  "legalAid",
  "counseling",
  "medicalEmergency",
] as const;

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    role?: string | null;
  };
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatIsoDay(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatIsoMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getRangeDays(range: string | undefined) {
  switch (range) {
    case "90d":
      return 90;
    case "365d":
      return 365;
    default:
      return 30;
  }
}

function parseServiceTags(serviceTags?: string | null) {
  const activeTags = new Set(
    (serviceTags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );

  return {
    domesticViolence: activeTags.has("domesticViolence"),
    harassment: activeTags.has("harassment"),
    legalAid: activeTags.has("legalAid"),
    counseling: activeTags.has("counseling"),
    medicalEmergency: activeTags.has("medicalEmergency"),
  };
}

function serializeServiceTags(servicesOffered: Record<string, boolean> | undefined) {
  return PROFILE_SERVICE_KEYS.filter((key) => Boolean(servicesOffered?.[key])).join(",");
}

function percentageChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function getAverageResolutionHours(
  requests: Array<{ created_at: Date; resolved_at: Date | null }>
) {
  const resolvedRequests = requests.filter((request) => request.resolved_at);

  if (resolvedRequests.length === 0) {
    return null;
  }

  const totalHours = resolvedRequests.reduce((sum, request) => {
    return sum + ((request.resolved_at!.getTime() - request.created_at.getTime()) / 36e5);
  }, 0);

  return Number((totalHours / resolvedRequests.length).toFixed(1));
}

function getPeakRequestDay(requests: Array<{ created_at: Date }>) {
  if (requests.length === 0) {
    return "No data";
  }

  const counts = new Map<string, number>();

  for (const request of requests) {
    const weekday = request.created_at.toLocaleDateString(undefined, { weekday: "long" });
    counts.set(weekday, (counts.get(weekday) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildRequestsOverTime(requests: Array<{ created_at: Date }>, rangeDays: number) {
  if (rangeDays >= 365) {
    const counts = new Map<string, number>();
    const end = new Date();
    const firstMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    const startMonth = addMonths(firstMonth, -11);

    for (const request of requests) {
      const key = formatIsoMonth(request.created_at);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const points = [];
    for (let i = 0; i < 12; i++) {
      const month = addMonths(startMonth, i);
      const key = formatIsoMonth(month);
      points.push({
        name: month.toLocaleDateString(undefined, { month: "short" }),
        requests: counts.get(key) || 0,
      });
    }
    return points;
  }

  const counts = new Map<string, number>();
  const end = startOfDay(new Date());
  const start = addDays(end, -(rangeDays - 1));

  for (const request of requests) {
    const key = formatIsoDay(request.created_at);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const points = [];
  for (let i = 0; i < rangeDays; i++) {
    const day = addDays(start, i);
    const key = formatIsoDay(day);
    points.push({
      name: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      requests: counts.get(key) || 0,
    });
  }

  return points;
}

function buildIssueBreakdown(requests: Array<{ issue_type: string | null }>) {
  const counts = new Map<string, number>();

  for (const request of requests) {
    const key = request.issue_type || "Other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

function buildComparison(
  currentRequests: Array<{ created_at: Date }>,
  previousRequests: Array<{ created_at: Date }>,
  rangeDays: number
) {
  const segmentCount = 4;
  const segmentSize = Math.ceil(rangeDays / segmentCount);
  const currentStart = addDays(startOfDay(new Date()), -(rangeDays - 1));
  const previousStart = addDays(currentStart, -rangeDays);
  const segments = Array.from({ length: segmentCount }, (_, index) => ({
    name: `Period ${index + 1}`,
    previous: 0,
    current: 0,
  }));

  for (const request of currentRequests) {
    const diffDays = Math.floor(
      (startOfDay(request.created_at).getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffDays >= 0) {
      const bucket = Math.min(Math.floor(diffDays / segmentSize), segmentCount - 1);
      segments[bucket].current += 1;
    }
  }

  for (const request of previousRequests) {
    const diffDays = Math.floor(
      (startOfDay(request.created_at).getTime() - previousStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffDays >= 0) {
      const bucket = Math.min(Math.floor(diffDays / segmentSize), segmentCount - 1);
      segments[bucket].previous += 1;
    }
  }

  return segments;
}

async function getProviderPrimaryService(providerId: number) {
  return prisma.service.findFirst({
    where: { provider_id: providerId },
    orderBy: { id: "asc" },
  });
}

async function ensureDatabaseStructure() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "service_tags" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "requests"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "requests"
      ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "request_notes" (
        "id" SERIAL PRIMARY KEY,
        "request_id" TEXT NOT NULL,
        "provider_id" INTEGER,
        "text" TEXT NOT NULL,
        "kind" TEXT DEFAULT 'provider',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "request_notes_request_id_fkey"
          FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE,
        CONSTRAINT "request_notes_provider_id_fkey"
          FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  } catch (err) {
    console.log("Database schema auto-sync was skipped because the database connection was unavailable.");
  }
}

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

    if (provider_id) {
      const provider = await prisma.user.findUnique({ where: { id: Number(provider_id) } });
      if (!provider) {
        const service = await prisma.service.findUnique({ where: { id: Number(provider_id) } });
        provider_id = service?.provider_id || null;
      } else {
        provider_id = provider.id;
      }
    }

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
        provider_id,
        notes: {
          create: {
            text: "Request submitted.",
            kind: "system",
          },
        },
      }
    });
    res.json({ id });
  });

  app.get("/api/requests/:id", async (req, res) => {
    const request = await prisma.request.findUnique({ where: { id: req.params.id } });
    res.json(request);
  });

  // Provider Routes (Protected)
  const authenticate = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest["user"];
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.get("/api/provider/dashboard", authenticate, async (req: AuthenticatedRequest, res) => {
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

  app.get("/api/provider/requests", authenticate, async (req: AuthenticatedRequest, res) => {
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

  app.get("/api/provider/stats", authenticate, async (req: AuthenticatedRequest, res) => {
    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const rangeDays = getRangeDays(range);
    const currentStart = addDays(startOfDay(new Date()), -(rangeDays - 1));
    const previousStart = addDays(currentStart, -rangeDays);

    const [currentRequests, previousRequests] = await Promise.all([
      prisma.request.findMany({
        where: {
          provider_id: req.user.id,
          created_at: { gte: currentStart },
        },
        orderBy: { created_at: "asc" },
      }),
      prisma.request.findMany({
        where: {
          provider_id: req.user.id,
          created_at: {
            gte: previousStart,
            lt: currentStart,
          },
        },
      }),
    ]);

    const currentResolved = currentRequests.filter((request) => request.status === "Resolved").length;
    const previousResolved = previousRequests.filter((request) => request.status === "Resolved").length;
    const resolutionRate = currentRequests.length > 0 ? Number(((currentResolved / currentRequests.length) * 100).toFixed(1)) : 0;
    const previousResolutionRate = previousRequests.length > 0 ? Number(((previousResolved / previousRequests.length) * 100).toFixed(1)) : 0;
    const avgResolutionHours = getAverageResolutionHours(currentRequests);
    const previousAvgResolutionHours = getAverageResolutionHours(previousRequests);

    res.json({
      summary: {
        avgResolutionHours,
        avgResolutionChange: percentageChange(avgResolutionHours, previousAvgResolutionHours),
        resolutionRate,
        resolutionRateChange: percentageChange(resolutionRate, previousResolutionRate),
        peakRequestDay: getPeakRequestDay(currentRequests),
        totalCasesHandled: currentRequests.length,
        totalCasesChange: percentageChange(currentRequests.length, previousRequests.length),
      },
      requestsOverTime: buildRequestsOverTime(currentRequests, rangeDays),
      issueBreakdown: buildIssueBreakdown(currentRequests),
      comparison: buildComparison(currentRequests, previousRequests, rangeDays),
    });
  });

  app.get("/api/provider/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    const [user, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      getProviderPrimaryService(req.user.id),
    ]);

    if (!user) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({
      name: user.name || "",
      email: user.email || "",
      phone: service?.phone || "",
      address: service?.address || "",
      lat: service?.lat || 28.6139,
      lng: service?.lng || 77.2090,
      operatingHours: service?.hours || "",
      languages: service?.languages || "",
      servicesOffered: parseServiceTags(service?.service_tags),
    });
  });

  app.patch("/api/provider/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    const {
      name,
      email,
      phone,
      address,
      lat,
      lng,
      operatingHours,
      languages,
      servicesOffered,
    } = req.body;

    const existingService = await getProviderPrimaryService(req.user.id);

    const [updatedUser, updatedService] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          name,
          email,
        },
      }),
      existingService
        ? prisma.service.update({
            where: { id: existingService.id },
            data: {
              name,
              email,
              phone,
              address,
              lat,
              lng,
              hours: operatingHours,
              languages,
              service_tags: serializeServiceTags(servicesOffered),
            },
          })
        : prisma.service.create({
            data: {
              name,
              type: "NGO",
              description: `Support services offered by ${name || "this organization"}.`,
              address,
              lat,
              lng,
              phone,
              email,
              hours: operatingHours,
              languages,
              service_tags: serializeServiceTags(servicesOffered),
              verified: 0,
              provider_id: req.user.id,
            },
          }),
    ]);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      profile: {
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedService.phone || "",
        address: updatedService.address || "",
        lat: updatedService.lat || 28.6139,
        lng: updatedService.lng || 77.2090,
        operatingHours: updatedService.hours || "",
        languages: updatedService.languages || "",
        servicesOffered: parseServiceTags(updatedService.service_tags),
      },
    });
  });

  app.get("/api/provider/requests/:id/notes", authenticate, async (req: AuthenticatedRequest, res) => {
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      select: { id: true, provider_id: true },
    });

    if (!request || (request.provider_id !== null && request.provider_id !== req.user.id)) {
      return res.status(404).json({ error: "Request not found" });
    }

    const notes = await prisma.requestNote.findMany({
      where: { request_id: req.params.id },
      orderBy: { created_at: "desc" },
    });

    res.json(notes);
  });

  app.post("/api/provider/requests/:id/notes", authenticate, async (req: AuthenticatedRequest, res) => {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      select: { id: true, provider_id: true },
    });

    if (!request || (request.provider_id !== null && request.provider_id !== req.user.id)) {
      return res.status(404).json({ error: "Request not found" });
    }

    const note = await prisma.requestNote.create({
      data: {
        request_id: req.params.id,
        provider_id: req.user.id,
        text,
        kind: "provider",
      },
    });

    res.status(201).json(note);
  });

  app.patch("/api/requests/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    const { status, provider_id } = req.body;
    const existingRequest = await prisma.request.findUnique({
      where: { id: req.params.id },
    });

    if (!existingRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    const nextProviderId = provider_id || existingRequest.provider_id || req.user.id;
    const resolvedAt = status === "Resolved" ? new Date() : null;

    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: req.params.id },
        data: {
          status,
          provider_id: nextProviderId,
          resolved_at: resolvedAt,
        },
      });

      if (status && status !== existingRequest.status) {
        await tx.requestNote.create({
          data: {
            request_id: req.params.id,
            provider_id: req.user.id,
            text: `Status updated to ${status}.`,
            kind: "system",
          },
        });
      }
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
  
  await ensureDatabaseStructure();
  await initializeDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
