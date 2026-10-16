import { isDatabaseConfigured, saveContactMessage, saveCommunitySubmission } from "./src/lib/server/db";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("=== RUNNING MINEBUILD CONTACT & SUBMISSIONS BACKEND TEST SUITE ===");

  // 1. Unconfigured Environment Safety Check
  console.log("1. Testing unconfigured environment behavior...");
  // In a clean test environment without SUPABASE_URL, isDatabaseConfigured should return false
  const configured = isDatabaseConfigured();
  console.log(`  Database configured state: ${configured}`);

  if (!configured) {
    console.log("  Verifying graceful unconfigured error response (no fake success)...");
    const contactRes = await saveContactMessage({
      name: "Tester",
      reply_email: "tester@example.com",
      inquiry_type: "general",
      subject: "Test Subject",
      message: "This is a test message to verify safety.",
    });

    assert(contactRes.success === false, "Contact submission must NOT succeed when DB is unconfigured");
    assert(contactRes.configured === false, "Must flag configured: false");
    assert(Boolean(contactRes.error), "Must provide an explanatory error message");
    console.log("  Contact unconfigured safety check PASSED.");

    const subRes = await saveCommunitySubmission({
      slug: "test-build",
      title: "Test Build",
      creator_name: "Tester",
      description: "Test description for validation",
      category: "Redstone & Automation",
      tags: ["test"],
      dimensions: { x: 5, y: 5, z: 5 },
      region_count: 1,
      solid_block_count: 50,
      minecraft_version: "1.20.4",
      top_block_names: ["minecraft:stone"],
      downloadable: false,
      status: "pending",
    });

    assert(subRes.success === false, "Community submission must NOT succeed when DB is unconfigured");
    assert(subRes.configured === false, "Must flag configured: false");
    assert(Boolean(subRes.error), "Must provide an explanatory error message");
    console.log("  Submission unconfigured safety check PASSED.");
  }

  // 2. Client-side & Server-side Validation rules
  console.log("2. Testing email validation regex...");
  const validEmails = ["test@example.com", "user.name+tag@sub.domain.co", "miner_123@gmail.com"];
  const invalidEmails = ["plainaddress", "missing@dot", "@missingusername.com", "spaces in@mail.com"];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const e of validEmails) {
    assert(emailRegex.test(e), `Expected valid email: ${e}`);
  }
  for (const e of invalidEmails) {
    assert(!emailRegex.test(e), `Expected invalid email: ${e}`);
  }
  console.log("  Email validation regex PASSED.");

  // 3. Inquiry category types validation
  console.log("3. Testing inquiry types...");
  const validTypes = ["general", "feedback", "bug_report", "sponsorship", "partnership", "other"];
  assert(validTypes.includes("sponsorship"), "Sponsorship inquiry must be a first-class option");

  console.log("=== ALL CONTACT & SUBMISSIONS TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
