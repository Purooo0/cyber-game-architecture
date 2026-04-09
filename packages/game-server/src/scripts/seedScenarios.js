import { db } from "../config/firebase.js";
import { scenario1 } from "../data/scenarios/scenario1.js";
import { scenario2 } from "../data/scenarios/scenario2.js";
import { scenario3 } from "../data/scenarios/scenario3.js";

async function seedScenarios() {
  try {
    console.log("🌱 Seeding scenarios to Firebase...");

    // Seed scenario1
    await db.ref("scenarios/emergency-school").set(scenario1);
    console.log("✅ Scenario 1 seeded: emergency-school");

    // Seed scenario2
    await db.ref("scenarios/security-wifi").set(scenario2);
    console.log("✅ Scenario 2 seeded: security-wifi");

    // Seed scenario3
    await db.ref("scenarios/social-challenge").set(scenario3);
    console.log("✅ Scenario 3 seeded: social-challenge");

    // Verify
    const snapshot = await db.ref("scenarios").once("value");
    const scenarios = snapshot.val();
    console.log("\n📊 Scenarios in database:", Object.keys(scenarios || {}));
    
    console.log("\n✨ All scenarios seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding scenarios:", error.message);
    process.exit(1);
  }
}

seedScenarios();
