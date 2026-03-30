import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 5,
  host: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/")[3]?.split("?")[0] || "taskly",
  ssl: {},
  waitForConnections: true,
  queueLimit: 0,
});

// Test data
const testUsers = [
  {
    openId: "user_juan_123",
    name: "Juan García",
    email: "juan@example.com",
    phone: "+1234567890",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
    bio: "Electricista profesional con 10 años de experiencia",
    latitude: 40.7128,
    longitude: -74.006,
    level: 4,
    totalPoints: 850,
    streak: 12,
    servicesCompleted: 45,
    servicesRequested: 8,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_maria_456",
    name: "María López",
    email: "maria@example.com",
    phone: "+1234567891",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    bio: "Diseñadora gráfica freelance, especializada en branding",
    latitude: 40.7150,
    longitude: -74.0020,
    level: 3,
    totalPoints: 620,
    streak: 8,
    servicesCompleted: 32,
    servicesRequested: 15,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_carlos_789",
    name: "Carlos Mendez",
    email: "carlos@example.com",
    phone: "+1234567892",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    bio: "Plomero confiable, servicio rápido y profesional",
    latitude: 40.7100,
    longitude: -74.0050,
    level: 5,
    totalPoints: 1200,
    streak: 25,
    servicesCompleted: 78,
    servicesRequested: 3,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_sofia_101",
    name: "Sofía Rodríguez",
    email: "sofia@example.com",
    phone: "+1234567893",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
    bio: "Entrenadora personal certificada, especialidad en fitness",
    latitude: 40.7180,
    longitude: -74.0010,
    level: 3,
    totalPoints: 580,
    streak: 6,
    servicesCompleted: 28,
    servicesRequested: 12,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_david_202",
    name: "David Chen",
    email: "david@example.com",
    phone: "+1234567894",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    bio: "Desarrollador web full-stack, 8 años de experiencia",
    latitude: 40.7120,
    longitude: -74.0040,
    level: 4,
    totalPoints: 920,
    streak: 14,
    servicesCompleted: 52,
    servicesRequested: 20,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_laura_303",
    name: "Laura Martínez",
    email: "laura@example.com",
    phone: "+1234567895",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=laura",
    bio: "Limpieza profesional de hogares y oficinas",
    latitude: 40.7140,
    longitude: -74.0030,
    level: 2,
    totalPoints: 340,
    streak: 3,
    servicesCompleted: 15,
    servicesRequested: 5,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_pedro_404",
    name: "Pedro Sánchez",
    email: "pedro@example.com",
    phone: "+1234567896",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=pedro",
    bio: "Reparación de electrodomésticos, garantizado",
    latitude: 40.7160,
    longitude: -74.0020,
    level: 3,
    totalPoints: 650,
    streak: 9,
    servicesCompleted: 38,
    servicesRequested: 8,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
  {
    openId: "user_ana_505",
    name: "Ana García",
    email: "ana@example.com",
    phone: "+1234567897",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    bio: "Clases de inglés online, nativa de USA",
    latitude: 40.7110,
    longitude: -74.0060,
    level: 2,
    totalPoints: 420,
    streak: 5,
    servicesCompleted: 22,
    servicesRequested: 18,
    phoneVerified: true,
    emailVerified: true,
    photoVerified: true,
  },
];

const testServices = [
  {
    userId: 1,
    title: "Reparación de instalación eléctrica",
    description: "Reparación profesional de cualquier problema eléctrico en tu hogar",
    type: "offer",
    category: "electricidad",
    priceTasklys: 150,
    latitude: 40.7128,
    longitude: -74.006,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 2,
    title: "Diseño de logo profesional",
    description: "Creo logos modernos y profesionales para tu marca o negocio",
    type: "offer",
    category: "diseño",
    priceTasklys: 200,
    latitude: 40.7150,
    longitude: -74.002,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 3,
    title: "Reparación urgente de tuberías",
    description: "Soluciono problemas de plomería en menos de 2 horas",
    type: "offer",
    category: "plomería",
    priceTasklys: 120,
    latitude: 40.7100,
    longitude: -74.005,
    urgency: "now",
    status: "published",
  },
  {
    userId: 4,
    title: "Sesión de entrenamiento personal",
    description: "Entreno personalizado para alcanzar tus objetivos fitness",
    type: "offer",
    category: "fitness",
    priceTasklys: 80,
    latitude: 40.7180,
    longitude: -74.001,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 5,
    title: "Desarrollo de sitio web profesional",
    description: "Creo sitios web modernos, rápidos y responsivos",
    type: "offer",
    category: "tecnología",
    priceTasklys: 500,
    latitude: 40.7120,
    longitude: -74.004,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 6,
    title: "Limpieza profunda de hogar",
    description: "Limpieza completa y desinfección de tu casa",
    type: "offer",
    category: "limpieza",
    priceTasklys: 100,
    latitude: 40.7140,
    longitude: -74.003,
    urgency: "today",
    status: "published",
  },
  {
    userId: 7,
    title: "Reparación de refrigerador",
    description: "Diagnóstico y reparación de electrodomésticos",
    type: "offer",
    category: "reparación",
    priceTasklys: 90,
    latitude: 40.7160,
    longitude: -74.002,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 8,
    title: "Clases de inglés conversacional",
    description: "Mejora tu inglés con clases dinámicas y personalizadas",
    type: "offer",
    category: "educación",
    priceTasklys: 60,
    latitude: 40.7110,
    longitude: -74.006,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 1,
    title: "Instalación de aire acondicionado",
    description: "Instalación profesional de sistemas de aire acondicionado",
    type: "offer",
    category: "electricidad",
    priceTasklys: 300,
    latitude: 40.7135,
    longitude: -74.0035,
    urgency: "today",
    status: "published",
  },
  {
    userId: 2,
    title: "Diseño de tarjetas de presentación",
    description: "Tarjetas profesionales con diseño personalizado",
    type: "offer",
    category: "diseño",
    priceTasklys: 50,
    latitude: 40.7155,
    longitude: -74.0015,
    urgency: "flexible",
    status: "published",
  },
  {
    userId: 3,
    title: "Destapación de drenajes",
    description: "Limpieza y destapación profesional de drenajes",
    type: "offer",
    category: "plomería",
    priceTasklys: 75,
    latitude: 40.7105,
    longitude: -74.0055,
    urgency: "now",
    status: "published",
  },
  {
    userId: 4,
    title: "Plan de nutrición personalizado",
    description: "Crea tu plan de alimentación según tus objetivos",
    type: "offer",
    category: "fitness",
    priceTasklys: 100,
    latitude: 40.7185,
    longitude: -74.0005,
    urgency: "flexible",
    status: "published",
  },
];

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log("🌱 Iniciando seed de base de datos...");

    // Insert users
    console.log("📝 Insertando usuarios de prueba...");
    for (const user of testUsers) {
      await connection.execute(
        `INSERT IGNORE INTO users (
          openId, name, email, phone, photoUrl, bio, latitude, longitude,
          level, totalPoints, streak, servicesCompleted, servicesRequested,
          phoneVerified, emailVerified, photoVerified, role, createdAt, updatedAt, lastSignedIn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          user.openId,
          user.name,
          user.email,
          user.phone,
          user.photoUrl,
          user.bio,
          user.latitude,
          user.longitude,
          user.level,
          user.totalPoints,
          user.streak,
          user.servicesCompleted,
          user.servicesRequested,
          user.phoneVerified,
          user.emailVerified,
          user.photoVerified,
          "user",
        ]
      );
    }

    // Get user IDs
    const [users] = await connection.execute(
      "SELECT id, openId FROM users WHERE openId IN (" +
        testUsers.map(() => "?").join(",") +
        ")",
      testUsers.map((u) => u.openId)
    );

    const userMap = {};
    users.forEach((u) => {
      const idx = testUsers.findIndex((tu) => tu.openId === u.openId);
      userMap[idx + 1] = u.id;
    });

    // Insert services
    console.log("🛠️  Insertando servicios de prueba...");
    for (const service of testServices) {
      const userId = userMap[service.userId];
      if (userId) {
        await connection.execute(
          `INSERT INTO services (
            title, description, category, priceInTasklys,
            latitude, longitude, urgency, status, createdById, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            service.title,
            service.description,
            service.category,
            service.priceTasklys,
            service.latitude,
            service.longitude,
            service.urgency,
            service.status,
            userId,
          ]
        );
      }
    }

    // Create wallets for all users
    console.log("💰 Creando wallets...");
    for (const user of users) {
      await connection.execute(
        `INSERT IGNORE INTO wallets (userId, balance, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW())`,
        [user.id, Math.floor(Math.random() * 500) + 100]
      );
    }

    console.log("✅ Seed completado exitosamente!");
    console.log(`✓ ${testUsers.length} usuarios creados`);
    console.log(`✓ ${testServices.length} servicios creados`);
  } catch (error) {
    console.error("❌ Error durante seed:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
