import express from "express";
import cors from "cors";
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
const DEFAULT_PROVIDER_PASSWORD = "password123";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const PROFILE_SERVICE_KEYS = [
  "domesticViolence",
  "harassment",
  "legalAid",
  "counseling",
  "medicalEmergency",
] as const;

const DEFAULT_SETTINGS = {
  twilio: {
    accountSid: "",
    authToken: "",
    fromNumber: "",
    enabled: false,
  },
  smtp: {
    host: "",
    port: 587,
    username: "",
    password: "",
    fromEmail: "",
    enabled: false,
  },
  map: {
    centerLat: 20.5937,
    centerLng: 78.9629,
    zoom: 5,
  },
  autoAssignment: {
    enabled: true,
    maxRadiusKm: 25,
    assignOnlyVerified: true,
    allowFallbackUnassigned: true,
  },
} as const;

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    is_active?: boolean;
  };
};

type AuditLogPayload = {
  actorUserId?: number | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: unknown;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
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

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  return fallback;
}

function parseNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableFloat(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateInput(value: unknown, fallback?: Date) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function getDateRangeFromQuery(query: express.Request["query"]) {
  const dateFrom = parseDateInput(query.dateFrom, addDays(startOfDay(new Date()), -29))!;
  const dateTo = parseDateInput(query.dateTo, endOfDay(new Date()))!;
  return {
    dateFrom: startOfDay(dateFrom),
    dateTo: endOfDay(dateTo),
  };
}

function buildRequestWhereClause(query: express.Request["query"]) {
  const where: Record<string, unknown> = {};
  const { dateFrom, dateTo } = getDateRangeFromQuery(query);
  where.created_at = { gte: dateFrom, lte: dateTo };

  if (typeof query.status === "string" && query.status !== "All") {
    where.status = query.status;
  }

  if (typeof query.issueType === "string" && query.issueType !== "All") {
    where.issue_type = query.issueType;
  }

  if (typeof query.providerId === "string" && query.providerId !== "All") {
    where.provider_id = parseNullableInt(query.providerId);
  }

  if (typeof query.location === "string" && query.location.trim()) {
    where.location = { contains: query.location.trim(), mode: "insensitive" };
  }

  return where;
}

function getClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return req.socket.remoteAddress || null;
}

async function logAction(payload: AuditLogPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_user_id: payload.actorUserId ?? null,
        actor_name: payload.actorName ?? null,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId ?? null,
        description: payload.description ?? null,
        metadata: payload.metadata === undefined ? undefined : (payload.metadata as any),
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}

async function recordLoginAttempt(req: express.Request, args: { userId?: number | null; email?: string | null; success: boolean }) {
  try {
    await prisma.loginHistory.create({
      data: {
        user_id: args.userId ?? null,
        email: args.email ?? null,
        success: args.success,
        ip_address: getClientIp(req),
        user_agent: req.headers["user-agent"] || null,
      },
    });
  } catch (error) {
    console.error("Failed to record login attempt", error);
  }
}

async function getProviderPrimaryService(providerId: number) {
  return prisma.service.findFirst({
    where: { provider_id: providerId },
    orderBy: { id: "asc" },
  });
}

async function getSystemSettings() {
  const entries = await prisma.systemSetting.findMany();
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  for (const entry of entries) {
    const key = entry.key as keyof typeof DEFAULT_SETTINGS;
    if (key in merged) {
      merged[key] = {
        ...merged[key],
        ...(typeof entry.value === "object" && entry.value ? entry.value : {}),
      };
    }
  }

  return merged;
}

async function upsertSystemSettings(settings: Partial<typeof DEFAULT_SETTINGS>, userId?: number | null) {
  const keys = Object.keys(settings) as Array<keyof typeof DEFAULT_SETTINGS>;
  await Promise.all(
    keys.map((key) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: settings[key] as object,
          updated_at: new Date(),
          updated_by: userId ?? null,
        },
        create: {
          key,
          value: settings[key] as object,
          updated_by: userId ?? null,
        },
      })
    )
  );
}

async function getReferenceData() {
  const [providers, issueTypes, locations] = await Promise.all([
    prisma.service.findMany({
      select: { id: true, name: true, type: true, provider_id: true, verified: true },
      orderBy: { name: "asc" },
    }),
    prisma.request.findMany({
      where: { issue_type: { not: null } },
      select: { issue_type: true },
      distinct: ["issue_type"],
      orderBy: { issue_type: "asc" },
    }),
    prisma.request.findMany({
      where: { location: { not: null } },
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
      take: 100,
    }),
  ]);

  return {
    serviceTypes: ["NGO", "Police", "Helpline", "SafeZone"],
    statusOptions: ["New", "In Progress", "Resolved"],
    providerOptions: providers.map((provider) => ({
      id: provider.provider_id ?? provider.id,
      serviceId: provider.id,
      name: provider.name,
      type: provider.type,
      verified: provider.verified,
    })),
    issueTypes: issueTypes.map((item) => item.issue_type).filter(Boolean),
    locations: locations.map((item) => item.location).filter(Boolean),
  };
}

function buildGeoDistribution(
  requests: Array<{ location: string | null; lat: number | null; lng: number | null; urgency: string | null }>
) {
  const grouped = new Map<
    string,
    { location: string; lat: number | null; lng: number | null; total: number; urgent: number }
  >();

  for (const request of requests) {
    const key = request.location || `${request.lat ?? "na"}:${request.lng ?? "na"}`;
    const current = grouped.get(key) || {
      location: request.location || "Unknown",
      lat: request.lat ?? null,
      lng: request.lng ?? null,
      total: 0,
      urgent: 0,
    };

    current.total += 1;
    if (request.urgency === "Urgent" || request.urgency === "High") {
      current.urgent += 1;
    }

    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.total - a.total).slice(0, 20);
}

function buildStatusFunnel(requests: Array<{ status: string | null }>) {
  return ["New", "In Progress", "Resolved"].map((status) => ({
    name: status,
    value: requests.filter((request) => (request.status || "New") === status).length,
  }));
}

function buildProviderPerformance(
  requests: Array<{ provider_id: number | null; status: string | null; created_at: Date; resolved_at: Date | null }>,
  services: Array<{ provider_id: number | null; name: string | null }>
) {
  const serviceNameByProvider = new Map<number, string>();
  for (const service of services) {
    if (service.provider_id) {
      serviceNameByProvider.set(service.provider_id, service.name || `Provider ${service.provider_id}`);
    }
  }

  const requestsByProvider = new Map<string, typeof requests>();

  for (const request of requests) {
    const key = String(request.provider_id ?? "unassigned");
    const collection = requestsByProvider.get(key) || [];
    collection.push(request);
    requestsByProvider.set(key, collection);
  }

  return [...requestsByProvider.entries()]
    .map(([key, providerRequests]) => {
      const numericKey = Number(key);
      return {
        name: key === "unassigned"
          ? "Unassigned"
          : serviceNameByProvider.get(numericKey) || `Provider ${key}`,
        total: providerRequests.length,
        resolved: providerRequests.filter((request) => request.status === "Resolved").length,
        avgResolutionHours: getAverageResolutionHours(providerRequests),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

async function ensureDatabaseStructure() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "service_tags" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
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

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" SERIAL PRIMARY KEY,
        "actor_user_id" INTEGER,
        "actor_name" TEXT,
        "action" TEXT NOT NULL,
        "entity_type" TEXT NOT NULL,
        "entity_id" TEXT,
        "description" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_actor_user_id_fkey"
          FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "login_history" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER,
        "email" TEXT,
        "success" BOOLEAN NOT NULL DEFAULT FALSE,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "login_history_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" TEXT PRIMARY KEY,
        "value" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_by" INTEGER,
        CONSTRAINT "system_settings_updated_by_fkey"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  } catch (_error) {
    console.log("Database schema auto-sync was skipped because the database connection was unavailable.");
  }
}

async function initializeDatabase() {
  try {
    const providerPassword = bcrypt.hashSync(DEFAULT_PROVIDER_PASSWORD, 10);
    const adminPassword = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin@vigil.org" },
      update: {
        role: "admin",
        name: "VIGIL Admin",
        is_active: true,
      },
      create: {
        email: "admin@vigil.org",
        password: adminPassword,
        role: "admin",
        name: "VIGIL Admin",
        is_active: true,
      },
    });

    const provider = await prisma.user.upsert({
      where: { email: "provider@vigil.org" },
      update: {
        role: "provider",
        name: "National Women's NGO",
        is_active: true,
      },
      create: {
        email: "provider@vigil.org",
        password: providerPassword,
        role: "provider",
        name: "National Women's NGO",
        is_active: true,
      },
    });

    const providerTwo = await prisma.user.upsert({
      where: { email: "shelter@vigil.org" },
      update: {
        role: "provider",
        name: "Safe Shelter Network",
        is_active: true,
      },
      create: {
        email: "shelter@vigil.org",
        password: providerPassword,
        role: "provider",
        name: "Safe Shelter Network",
        is_active: true,
      },
    });

    const existingServices = await prisma.service.count();
    if (existingServices === 0) {
      await prisma.service.createMany({
        data: [
          {
            name: "National Women's NGO",
            type: "NGO",
            description: "Providing legal aid and counseling for women in distress.",
            address: "Mumbai, Maharashtra",
            lat: 19.076,
            lng: 72.8777,
            phone: "1800-123-4567",
            email: "help@nationalngo.org",
            hours: "9 AM - 6 PM",
            languages: "Hindi, English, Marathi",
            verified: 1,
            provider_id: provider.id,
            service_tags: "domesticViolence,harassment,counseling",
          },
          {
            name: "National Women's Helpline Center",
            type: "Police",
            description: "24/7 police assistance and emergency response.",
            address: "New Delhi, India",
            lat: 28.6139,
            lng: 77.209,
            phone: "100",
            email: "helpdesk@police.gov.in",
            hours: "24/7",
            languages: "Hindi, English",
            verified: 1,
          },
          {
            name: "Safe Shelter Network",
            type: "NGO",
            description: "Temporary shelter and emergency relocation support.",
            address: "Bengaluru, Karnataka",
            lat: 12.9716,
            lng: 77.5946,
            phone: "1800-555-8899",
            email: "intake@safeshelter.org",
            hours: "24/7",
            languages: "Hindi, English, Kannada",
            verified: 0,
            provider_id: providerTwo.id,
            service_tags: "domesticViolence,medicalEmergency",
          },
        ],
      });
    }

    const existingRequests = await prisma.request.count();
    if (existingRequests === 0) {
      await prisma.request.createMany({
        data: [
          {
            id: "REQMUM01",
            issue_type: "Domestic Violence",
            description: "Requested immediate legal and counseling support.",
            location: "Mumbai, Maharashtra",
            lat: 19.082,
            lng: 72.88,
            urgency: "High",
            contact_preference: "Call",
            contact_info: "+91 9999999999",
            status: "In Progress",
            provider_id: provider.id,
            created_at: addDays(new Date(), -1),
          },
          {
            id: "REQDEL02",
            issue_type: "Harassment",
            description: "Reported workplace harassment and asked for documentation help.",
            location: "New Delhi, India",
            lat: 28.61,
            lng: 77.21,
            urgency: "Medium",
            contact_preference: "SMS",
            contact_info: "+91 8888888888",
            status: "New",
            created_at: addDays(new Date(), -3),
          },
          {
            id: "REQBLR03",
            issue_type: "Shelter",
            description: "Looking for an emergency safe shelter for tonight.",
            location: "Bengaluru, Karnataka",
            lat: 12.975,
            lng: 77.6,
            urgency: "Urgent",
            contact_preference: "Call",
            contact_info: "+91 7777777777",
            status: "Resolved",
            provider_id: providerTwo.id,
            created_at: addDays(new Date(), -7),
            resolved_at: addDays(new Date(), -6),
          },
        ],
      });

      await prisma.requestNote.createMany({
        data: [
          {
            request_id: "REQMUM01",
            provider_id: provider.id,
            text: "Request submitted.",
            kind: "system",
          },
          {
            request_id: "REQMUM01",
            provider_id: provider.id,
            text: "Initial intake call completed.",
            kind: "provider",
          },
          {
            request_id: "REQDEL02",
            text: "Request submitted.",
            kind: "system",
          },
          {
            request_id: "REQBLR03",
            provider_id: providerTwo.id,
            text: "Request resolved and shelter confirmed.",
            kind: "system",
          },
        ],
      });
    }

    await upsertSystemSettings(DEFAULT_SETTINGS, admin.id);
  } catch (_error) {
    console.log("Database may not be set up or migrated properly yet. Skipping data seed.");
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  const authenticate = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, is_active: true },
      });

      if (!user || !user.is_active) {
        return res.status(401).json({ error: "Account is inactive or unavailable" });
      }

      req.user = user;
      next();
    } catch (_error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const requireRole = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
      if (!req.user || !roles.includes(req.user.role || "")) {
        return res.status(403).json({ error: "Forbidden" });
      }

      next();
    };
  };

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordMatches = Boolean(user?.password && bcrypt.compareSync(password, user.password));

    await recordLoginAttempt(req, {
      userId: user?.id ?? null,
      email: normalizedEmail,
      success: Boolean(user && user.is_active && passwordMatches),
    });

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Your account has been deactivated" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

    await logAction({
      actorUserId: user.id,
      actorName: user.name,
      action: "auth.login",
      entityType: "user",
      entityId: String(user.id),
      description: `${user.role || "user"} logged in.`,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  });

  app.get("/api/services", async (_req, res) => {
    const services = await prisma.service.findMany({
      where: {
        OR: [
          { provider_id: null },
          { provider: { is_active: true } },
        ],
      },
      orderBy: [{ verified: "desc" }, { name: "asc" }],
    });

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
      const settings = await getSystemSettings();
      const assignOnlyVerified = settings.autoAssignment.assignOnlyVerified;
      const maxRadiusKm = settings.autoAssignment.maxRadiusKm;

      const services = await prisma.service.findMany({
        where: {
          lat: { not: null },
          lng: { not: null },
          provider_id: { not: null },
          ...(assignOnlyVerified ? { verified: 1 } : {}),
        },
      });

      let nearestService: typeof services[number] | null = null;
      let minDistance = Infinity;

      for (const service of services) {
        if (service.lat && service.lng) {
          const radius = 6371;
          const dLat = (service.lat - lat) * Math.PI / 180;
          const dLng = (service.lng - lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(service.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = radius * c;

          if (distance < minDistance && distance <= maxRadiusKm) {
            minDistance = distance;
            nearestService = service;
          }
        }
      }

      if (nearestService?.provider_id) {
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
      },
    });

    await logAction({
      action: "request.created",
      entityType: "request",
      entityId: id,
      description: `New ${issue_type || "support"} request submitted.`,
      metadata: { location, urgency, provider_id },
    });

    res.json({ id });
  });

  app.get("/api/requests/:id", async (req, res) => {
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: {
        provider: {
          select: { name: true },
        },
      },
    });
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Attach provider name for the frontend
    const responseData = {
      ...request,
      providerName: request.provider?.name || null,
    };
    
    res.json(responseData);
  });

  app.get("/api/provider/dashboard", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const [total, pending, resolved] = await Promise.all([
      prisma.request.count({ where: { provider_id: req.user!.id } }),
      prisma.request.count({ where: { provider_id: req.user!.id, status: "New" } }),
      prisma.request.count({ where: { provider_id: req.user!.id, status: "Resolved" } }),
    ]);

    res.json({
      total: { count: total },
      pending: { count: pending },
      resolved: { count: resolved },
    });
  });

  app.get("/api/provider/requests", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { provider_id: req.user!.id },
          { provider_id: null },
        ],
      },
      orderBy: { created_at: "desc" },
    });

    res.json(requests);
  });

  app.get("/api/provider/stats", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const rangeDays = getRangeDays(range);
    const currentStart = addDays(startOfDay(new Date()), -(rangeDays - 1));
    const previousStart = addDays(currentStart, -rangeDays);

    const [currentRequests, previousRequests] = await Promise.all([
      prisma.request.findMany({
        where: {
          provider_id: req.user!.id,
          created_at: { gte: currentStart },
        },
        orderBy: { created_at: "asc" },
      }),
      prisma.request.findMany({
        where: {
          provider_id: req.user!.id,
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

  app.get("/api/provider/profile", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const [user, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.id } }),
      getProviderPrimaryService(req.user!.id),
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
      lng: service?.lng || 77.209,
      operatingHours: service?.hours || "",
      languages: service?.languages || "",
      servicesOffered: parseServiceTags(service?.service_tags),
    });
  });

  app.patch("/api/provider/profile", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
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

    const existingService = await getProviderPrimaryService(req.user!.id);

    const [updatedUser, updatedService] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { name, email },
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
              provider_id: req.user!.id,
            },
          }),
    ]);

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "provider.profile.updated",
      entityType: "provider",
      entityId: String(req.user!.id),
      description: "Provider profile updated.",
    });

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
        lng: updatedService.lng || 77.209,
        operatingHours: updatedService.hours || "",
        languages: updatedService.languages || "",
        servicesOffered: parseServiceTags(updatedService.service_tags),
      },
    });
  });

  app.get("/api/provider/requests/:id/notes", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      select: { id: true, provider_id: true },
    });

    if (!request || (request.provider_id !== null && request.provider_id !== req.user!.id)) {
      return res.status(404).json({ error: "Request not found" });
    }

    const notes = await prisma.requestNote.findMany({
      where: { request_id: req.params.id },
      orderBy: { created_at: "desc" },
    });

    res.json(notes);
  });

  app.post("/api/provider/requests/:id/notes", authenticate, requireRole("provider"), async (req: AuthenticatedRequest, res) => {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      select: { id: true, provider_id: true },
    });

    if (!request || (request.provider_id !== null && request.provider_id !== req.user!.id)) {
      return res.status(404).json({ error: "Request not found" });
    }

    const note = await prisma.requestNote.create({
      data: {
        request_id: req.params.id,
        provider_id: req.user!.id,
        text,
        kind: "provider",
      },
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "provider.note.created",
      entityType: "request",
      entityId: req.params.id,
      description: "Provider added an internal note.",
    });

    res.status(201).json(note);
  });

  app.patch("/api/requests/:id", authenticate, requireRole("provider", "admin"), async (req: AuthenticatedRequest, res) => {
    const { status, provider_id } = req.body;
    const existingRequest = await prisma.request.findUnique({
      where: { id: req.params.id },
    });

    if (!existingRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (req.user!.role === "provider" && existingRequest.provider_id !== null && existingRequest.provider_id !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const nextProviderId = provider_id ?? existingRequest.provider_id ?? req.user!.id;
    const resolvedAt = status === "Resolved"
      ? existingRequest.resolved_at || new Date()
      : status ? null : existingRequest.resolved_at;

    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: req.params.id },
        data: {
          status,
          provider_id: nextProviderId,
          resolved_at: resolvedAt,
        },
      });

      const noteParts: string[] = [];
      if (status && status !== existingRequest.status) {
        noteParts.push(`Status updated to ${status}.`);
      }
      if (provider_id !== undefined && provider_id !== existingRequest.provider_id) {
        noteParts.push(`Provider reassigned to ${provider_id || "Unassigned"}.`);
      }

      if (noteParts.length > 0) {
        await tx.requestNote.create({
          data: {
            request_id: req.params.id,
            provider_id: req.user!.id,
            text: noteParts.join(" "),
            kind: "system",
          },
        });
      }
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: req.user!.role === "admin" ? "admin.request.updated" : "provider.request.updated",
      entityType: "request",
      entityId: req.params.id,
      description: "Request assignment or status updated.",
      metadata: { status, provider_id: nextProviderId },
    });

    res.json({ success: true });
  });

  app.get("/api/admin/reference-data", authenticate, requireRole("admin"), async (_req, res) => {
    res.json(await getReferenceData());
  });

  app.get("/api/admin/dashboard", authenticate, requireRole("admin"), async (_req, res) => {
    const todayStart = startOfDay(new Date());
    const weekStart = addDays(todayStart, -6);
    const monthStart = addDays(todayStart, -29);

    const [todayCount, weekCount, monthCount, activeProviders, pendingVerifications, heatmapPoints, recentLogs] =
      await Promise.all([
        prisma.request.count({ where: { created_at: { gte: todayStart } } }),
        prisma.request.count({ where: { created_at: { gte: weekStart } } }),
        prisma.request.count({ where: { created_at: { gte: monthStart } } }),
        prisma.user.count({ where: { role: "provider", is_active: true } }),
        prisma.service.count({ where: { verified: { not: 1 } } }),
        prisma.request.findMany({
          where: { lat: { not: null }, lng: { not: null } },
          select: { id: true, lat: true, lng: true, urgency: true, issue_type: true, created_at: true },
          orderBy: { created_at: "desc" },
          take: 150,
        }),
        prisma.auditLog.findMany({
          include: { actor: { select: { name: true, email: true } } },
          orderBy: { created_at: "desc" },
          take: 12,
        }),
      ]);

    res.json({
      totals: {
        today: todayCount,
        week: weekCount,
        month: monthCount,
      },
      activeProviders,
      pendingVerifications,
      heatmap: heatmapPoints.map((point) => ({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        issueType: point.issue_type,
        intensity: point.urgency === "Urgent" ? 1 : point.urgency === "High" ? 0.8 : 0.5,
      })),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        description: log.description,
        actorName: log.actor_name || log.actor?.name || log.actor?.email || "System",
        created_at: log.created_at,
      })),
      quickLinks: [
        { label: "Manage Providers", path: "/admin/providers" },
        { label: "Analytics & Reports", path: "/admin/analytics" },
        { label: "All Requests", path: "/admin/requests" },
      ],
    });
  });

  app.get("/api/admin/providers", authenticate, requireRole("admin"), async (req, res) => {
    const where: Record<string, unknown> = {};

    if (typeof req.query.type === "string" && req.query.type !== "All") {
      where.type = req.query.type;
    }

    if (typeof req.query.verified === "string" && req.query.verified !== "All") {
      where.verified = req.query.verified === "Verified" ? 1 : 0;
    }

    if (typeof req.query.location === "string" && req.query.location.trim()) {
      where.address = { contains: req.query.location.trim(), mode: "insensitive" };
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
      },
      orderBy: [{ verified: "asc" }, { updated_at: "desc" }],
    });

    res.json(
      services.map((service) => ({
        ...service,
        providerName: service.provider?.name || null,
        providerEmail: service.provider?.email || null,
        providerActive: service.provider?.is_active ?? null,
      }))
    );
  });

  app.get("/api/admin/providers/:id", authenticate, requireRole("admin"), async (req, res) => {
    const service = await prisma.service.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
            role: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json(service);
  });

  app.post("/api/admin/providers", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const data = req.body;
    const providerId = parseNullableInt(data.provider_id);

    const service = await prisma.service.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        address: data.address,
        lat: parseNullableFloat(data.lat),
        lng: parseNullableFloat(data.lng),
        phone: data.phone,
        email: data.email,
        hours: data.hours,
        languages: data.languages,
        verified: parseBoolean(data.verified) ? 1 : 0,
        provider_id: providerId,
        service_tags: typeof data.service_tags === "string"
          ? data.service_tags
          : serializeServiceTags(data.servicesOffered),
      },
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.provider.created",
      entityType: "provider",
      entityId: String(service.id),
      description: `Provider ${service.name || service.id} created.`,
    });

    res.status(201).json(service);
  });

  app.patch("/api/admin/providers/:id", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const existing = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      return res.status(404).json({ error: "Provider not found" });
    }

    const data = req.body;
    const service = await prisma.service.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        address: data.address,
        lat: parseNullableFloat(data.lat),
        lng: parseNullableFloat(data.lng),
        phone: data.phone,
        email: data.email,
        hours: data.hours,
        languages: data.languages,
        verified: parseBoolean(data.verified, existing.verified === 1) ? 1 : 0,
        provider_id: parseNullableInt(data.provider_id),
        service_tags: typeof data.service_tags === "string"
          ? data.service_tags
          : serializeServiceTags(data.servicesOffered),
      },
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.provider.updated",
      entityType: "provider",
      entityId: String(service.id),
      description: `Provider ${service.name || service.id} updated.`,
    });

    res.json(service);
  });

  app.patch("/api/admin/providers/:id/verification", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const verified = parseBoolean(req.body.verified);
    const service = await prisma.service.update({
      where: { id: Number(req.params.id) },
      data: { verified: verified ? 1 : 0 },
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: verified ? "admin.provider.verified" : "admin.provider.unverified",
      entityType: "provider",
      entityId: String(service.id),
      description: `Provider ${service.name || service.id} ${verified ? "verified" : "unverified"}.`,
    });

    res.json(service);
  });

  app.delete("/api/admin/providers/:id", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const existing = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      return res.status(404).json({ error: "Provider not found" });
    }

    await prisma.service.delete({ where: { id: existing.id } });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.provider.deleted",
      entityType: "provider",
      entityId: String(existing.id),
      description: `Provider ${existing.name || existing.id} deleted.`,
    });

    res.json({ success: true });
  });

  app.post("/api/admin/providers/import", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ error: "No rows supplied for import" });
    }

    let count = 0;
    for (const row of rows) {
      await prisma.service.create({
        data: {
          name: row.name,
          type: row.type || "NGO",
          description: row.description || "",
          address: row.address || "",
          lat: parseNullableFloat(row.lat),
          lng: parseNullableFloat(row.lng),
          phone: row.phone || "",
          email: row.email || "",
          hours: row.hours || "",
          languages: row.languages || "",
          verified: parseBoolean(row.verified) ? 1 : 0,
          provider_id: parseNullableInt(row.provider_id),
          service_tags: typeof row.service_tags === "string" ? row.service_tags : "",
        },
      });
      count += 1;
    }

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.provider.imported",
      entityType: "provider",
      description: `${count} providers imported from CSV.`,
      metadata: { count },
    });

    res.status(201).json({ success: true, count });
  });

  app.get("/api/admin/requests", authenticate, requireRole("admin"), async (req, res) => {
    const requests = await prisma.request.findMany({
      where: buildRequestWhereClause(req.query),
      include: {
        provider: {
          select: { id: true, name: true, email: true, is_active: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(
      requests.map((request) => ({
        ...request,
        providerName: request.provider?.name || null,
        providerEmail: request.provider?.email || null,
        providerActive: request.provider?.is_active ?? null,
      }))
    );
  });

  app.patch("/api/admin/requests/:id", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const existingRequest = await prisma.request.findUnique({ where: { id: req.params.id } });
    if (!existingRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    const providerId = req.body.provider_id === "" ? null : parseNullableInt(req.body.provider_id);
    const nextStatus = typeof req.body.status === "string" ? req.body.status : existingRequest.status;
    const nextResolvedAt = nextStatus === "Resolved"
      ? existingRequest.resolved_at || new Date()
      : null;

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.request.update({
        where: { id: req.params.id },
        data: {
          provider_id: providerId,
          status: nextStatus,
          resolved_at: nextResolvedAt,
        },
      });

      const notes: string[] = [];
      if (providerId !== existingRequest.provider_id) {
        notes.push(`Admin reassigned provider to ${providerId || "Unassigned"}.`);
      }
      if (nextStatus !== existingRequest.status) {
        notes.push(`Admin forced status change to ${nextStatus}.`);
      }
      if (notes.length > 0) {
        await tx.requestNote.create({
          data: {
            request_id: req.params.id,
            provider_id: req.user!.id,
            text: notes.join(" "),
            kind: "system",
          },
        });
      }

      return updated;
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.request.updated",
      entityType: "request",
      entityId: req.params.id,
      description: "Admin updated request assignment or status.",
      metadata: { provider_id: providerId, status: nextStatus },
    });

    res.json(updatedRequest);
  });

  app.delete("/api/admin/requests/:id", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const existing = await prisma.request.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Request not found" });
    }

    await prisma.request.delete({ where: { id: req.params.id } });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.request.deleted",
      entityType: "request",
      entityId: req.params.id,
      description: "Admin deleted a request.",
    });

    res.json({ success: true });
  });

  app.get("/api/admin/analytics", authenticate, requireRole("admin"), async (req, res) => {
    const where = buildRequestWhereClause(req.query);
    const requests = await prisma.request.findMany({
      where,
      orderBy: { created_at: "asc" },
    });
    const services = await prisma.service.findMany({
      select: { provider_id: true, name: true },
    });

    const { dateFrom, dateTo } = getDateRangeFromQuery(req.query);
    const rangeDays = Math.max(
      1,
      Math.ceil((endOfDay(dateTo).getTime() - startOfDay(dateFrom).getTime()) / (24 * 60 * 60 * 1000)) + 1
    );

    res.json({
      summary: {
        totalRequests: requests.length,
        resolvedRequests: requests.filter((request) => request.status === "Resolved").length,
        avgResolutionHours: getAverageResolutionHours(requests),
        peakRequestDay: getPeakRequestDay(requests),
      },
      issueTypes: buildIssueBreakdown(requests),
      geographicDistribution: buildGeoDistribution(requests),
      statusFunnel: buildStatusFunnel(requests),
      providerPerformance: buildProviderPerformance(requests, services),
      trendAnalysis: buildRequestsOverTime(requests, rangeDays > 180 ? 365 : Math.min(rangeDays, 90)),
    });
  });

  app.get("/api/admin/users", authenticate, requireRole("admin"), async (req, res) => {
    const where: Record<string, unknown> = {};
    if (typeof req.query.role === "string" && req.query.role !== "All") {
      where.role = req.query.role;
    }
    if (typeof req.query.status === "string" && req.query.status !== "All") {
      where.is_active = req.query.status === "Active";
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const query = req.query.search.trim();
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        services: {
          select: { id: true, name: true },
        },
        login_history: {
          orderBy: { created_at: "desc" },
          take: 5,
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        linkedServices: user.services,
        lastLogin: user.login_history[0] || null,
        loginCount: user.login_history.length,
      }))
    );
  });

  app.get("/api/admin/users/:id/login-history", authenticate, requireRole("admin"), async (req, res) => {
    const history = await prisma.loginHistory.findMany({
      where: { user_id: Number(req.params.id) },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    res.json(history);
  });

  app.post("/api/admin/users", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const password = typeof req.body.password === "string" && req.body.password.trim()
      ? req.body.password.trim()
      : DEFAULT_PROVIDER_PASSWORD;

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email?.toLowerCase?.() || req.body.email,
        role: req.body.role || "provider",
        password: bcrypt.hashSync(password, 10),
        is_active: req.body.is_active === undefined ? true : parseBoolean(req.body.is_active, true),
      },
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.user.created",
      entityType: "user",
      entityId: String(user.id),
      description: `Created ${user.role} account for ${user.email}.`,
    });

    res.status(201).json({
      ...user,
      password: undefined,
    });
  });

  app.patch("/api/admin/users/:id", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const existing = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email?.toLowerCase?.() || req.body.email;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.is_active !== undefined) updateData.is_active = parseBoolean(req.body.is_active, existing.is_active);
    if (req.body.password) updateData.password = bcrypt.hashSync(req.body.password, 10);

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: req.body.password ? "admin.user.password_reset" : "admin.user.updated",
      entityType: "user",
      entityId: String(user.id),
      description: req.body.password
        ? `Password reset for ${user.email}.`
        : `User ${user.email} updated.`,
      metadata: { is_active: user.is_active, role: user.role },
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  });

  app.get("/api/admin/settings", authenticate, requireRole("admin"), async (_req, res) => {
    res.json(await getSystemSettings());
  });

  app.put("/api/admin/settings", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...req.body,
    };

    await upsertSystemSettings(nextSettings, req.user!.id);

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.settings.updated",
      entityType: "settings",
      entityId: "global",
      description: "System settings updated.",
    });

    res.json(await getSystemSettings());
  });

  app.get("/api/admin/settings/backup", authenticate, requireRole("admin"), async (_req, res) => {
    const [users, services, requests, notes, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.service.findMany(),
      prisma.request.findMany(),
      prisma.requestNote.findMany(),
      prisma.systemSetting.findMany(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      users,
      services,
      requests,
      requestNotes: notes,
      settings,
    });
  });

  app.post("/api/admin/settings/restore", authenticate, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    const payload = req.body || {};
    const counts = {
      users: 0,
      services: 0,
      requests: 0,
      requestNotes: 0,
      settings: 0,
    };

    await prisma.$transaction(async (tx) => {
      for (const user of Array.isArray(payload.users) ? payload.users : []) {
        await tx.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            password: user.password,
            role: user.role,
            name: user.name,
            is_active: user.is_active ?? true,
          },
          create: {
            id: user.id,
            email: user.email,
            password: user.password,
            role: user.role,
            name: user.name,
            is_active: user.is_active ?? true,
          },
        });
        counts.users += 1;
      }

      for (const service of Array.isArray(payload.services) ? payload.services : []) {
        await tx.service.upsert({
          where: { id: service.id },
          update: {
            name: service.name,
            type: service.type,
            description: service.description,
            address: service.address,
            lat: service.lat,
            lng: service.lng,
            phone: service.phone,
            email: service.email,
            hours: service.hours,
            languages: service.languages,
            service_tags: service.service_tags,
            verified: service.verified,
            provider_id: service.provider_id,
          },
          create: {
            id: service.id,
            name: service.name,
            type: service.type,
            description: service.description,
            address: service.address,
            lat: service.lat,
            lng: service.lng,
            phone: service.phone,
            email: service.email,
            hours: service.hours,
            languages: service.languages,
            service_tags: service.service_tags,
            verified: service.verified,
            provider_id: service.provider_id,
          },
        });
        counts.services += 1;
      }

      for (const request of Array.isArray(payload.requests) ? payload.requests : []) {
        await tx.request.upsert({
          where: { id: request.id },
          update: {
            issue_type: request.issue_type,
            description: request.description,
            location: request.location,
            lat: request.lat,
            lng: request.lng,
            urgency: request.urgency,
            contact_preference: request.contact_preference,
            contact_info: request.contact_info,
            status: request.status,
            provider_id: request.provider_id,
            created_at: request.created_at ? new Date(request.created_at) : undefined,
            resolved_at: request.resolved_at ? new Date(request.resolved_at) : null,
          },
          create: {
            id: request.id,
            issue_type: request.issue_type,
            description: request.description,
            location: request.location,
            lat: request.lat,
            lng: request.lng,
            urgency: request.urgency,
            contact_preference: request.contact_preference,
            contact_info: request.contact_info,
            status: request.status,
            provider_id: request.provider_id,
            created_at: request.created_at ? new Date(request.created_at) : undefined,
            resolved_at: request.resolved_at ? new Date(request.resolved_at) : null,
          },
        });
        counts.requests += 1;
      }

      for (const note of Array.isArray(payload.requestNotes) ? payload.requestNotes : []) {
        await tx.requestNote.upsert({
          where: { id: note.id },
          update: {
            request_id: note.request_id,
            provider_id: note.provider_id,
            text: note.text,
            kind: note.kind,
            created_at: note.created_at ? new Date(note.created_at) : undefined,
          },
          create: {
            id: note.id,
            request_id: note.request_id,
            provider_id: note.provider_id,
            text: note.text,
            kind: note.kind,
            created_at: note.created_at ? new Date(note.created_at) : undefined,
          },
        });
        counts.requestNotes += 1;
      }

      for (const setting of Array.isArray(payload.settings) ? payload.settings : []) {
        await tx.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updated_at: setting.updated_at ? new Date(setting.updated_at) : new Date(),
            updated_by: setting.updated_by ?? null,
          },
          create: {
            key: setting.key,
            value: setting.value,
            updated_at: setting.updated_at ? new Date(setting.updated_at) : new Date(),
            updated_by: setting.updated_by ?? null,
          },
        });
        counts.settings += 1;
      }
    });

    await logAction({
      actorUserId: req.user!.id,
      actorName: req.user!.name,
      action: "admin.settings.restore",
      entityType: "backup",
      entityId: "restore",
      description: "Backup restore applied.",
      metadata: counts,
    });

    res.json({ success: true, counts });
  });

  app.get("/api/admin/logs", authenticate, requireRole("admin"), async (req, res) => {
    const where: Record<string, unknown> = {};

    if (typeof req.query.userId === "string" && req.query.userId !== "All") {
      where.actor_user_id = Number(req.query.userId);
    }

    if (typeof req.query.action === "string" && req.query.action !== "All") {
      where.action = { contains: req.query.action, mode: "insensitive" };
    }

    const { dateFrom, dateTo } = getDateRangeFromQuery(req.query);
    where.created_at = { gte: dateFrom, lte: dateTo };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: 500,
    });

    res.json(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        description: log.description,
        actor_user_id: log.actor_user_id,
        actor_name: log.actor_name || log.actor?.name || log.actor?.email || "System",
        metadata: log.metadata,
        created_at: log.created_at,
      }))
    );
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "../frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0';

  await ensureDatabaseStructure();
  await initializeDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Admin login: admin@vigil.org / ${DEFAULT_ADMIN_PASSWORD}`);
    console.log(`Provider login: provider@vigil.org / ${DEFAULT_PROVIDER_PASSWORD}`);
  });
}

startServer();
