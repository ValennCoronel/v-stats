const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash("test1234", 12);
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        passwordHash: hash,
        displayName: "Test User",
        role: "COACH",
      },
    });
    console.log("Created user:", user.id, user.email);
  } catch (e) {
    if (e.code === "P2002") {
      console.log("User already exists");
    } else {
      throw e;
    }
  } finally {
    await prisma.user.findFirst(); // keep connection alive briefly
    process.exit(0);
  }
}

main();
