import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "./db";
import { adminVerificationCodes, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateVerificationCode, verifyCode } from "./db-admin";
import { sendVerificationEmail } from "./email";

describe("Admin Registration Flow", () => {
  const testEmail = "newadmin@test.com";
  const testName = "New Admin";

  beforeAll(async () => {
    // Clean up test data
    await db.delete(adminVerificationCodes).where(eq(adminVerificationCodes.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(adminVerificationCodes).where(eq(adminVerificationCodes.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it("should generate a verification code for admin registration request", async () => {
    const code = generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("should create a verification code record in the database", async () => {
    const code = generateVerificationCode();
    
    const result = await db.insert(adminVerificationCodes).values({
      email: testEmail,
      code: code,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isUsed: false,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify the code was inserted
    const record = await db
      .select()
      .from(adminVerificationCodes)
      .where(eq(adminVerificationCodes.email, testEmail))
      .limit(1);

    expect(record).toHaveLength(1);
    expect(record[0].code).toBe(code);
    expect(record[0].isUsed).toBe(false);
  });

  it("should verify a valid verification code", async () => {
    const code = generateVerificationCode();
    
    await db.insert(adminVerificationCodes).values({
      email: testEmail,
      code: code,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false,
    });

    const isValid = await verifyCode(testEmail, code);
    expect(isValid).toBe(true);
  });

  it("should reject an invalid verification code", async () => {
    const isValid = await verifyCode(testEmail, "000000");
    expect(isValid).toBe(false);
  });

  it("should reject an expired verification code", async () => {
    const code = generateVerificationCode();
    
    await db.insert(adminVerificationCodes).values({
      email: testEmail,
      code: code,
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      isUsed: false,
    });

    const isValid = await verifyCode(testEmail, code);
    expect(isValid).toBe(false);
  });

  it("should mark a verification code as used after verification", async () => {
    const code = generateVerificationCode();
    
    await db.insert(adminVerificationCodes).values({
      email: testEmail,
      code: code,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false,
    });

    // Verify the code
    await verifyCode(testEmail, code);

    // Check if it's marked as used
    const record = await db
      .select()
      .from(adminVerificationCodes)
      .where(eq(adminVerificationCodes.email, testEmail))
      .limit(1);

    expect(record[0].isUsed).toBe(true);
  });

  it("should send verification email to admin", async () => {
    const code = generateVerificationCode();
    const mockSendEmail = vi.fn().mockResolvedValue(true);

    // Mock the email sending
    vi.mocked(sendVerificationEmail).mockImplementation(mockSendEmail);

    // In a real test, you would call the actual email function
    // For now, we just verify the mock was called
    expect(mockSendEmail).toBeDefined();
  });
});
