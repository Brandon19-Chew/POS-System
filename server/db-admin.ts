import { eq, and, gt } from "drizzle-orm";
import { getDb } from "./db";
import { users, adminVerificationCodes } from "../drizzle/schema";
import { sendVerificationCodeEmail } from "./email";

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Request admin registration - sends verification code to admin email
 */
export async function requestAdminRegistration(
  applicantName: string,
  applicantEmail: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Check if applicant email already exists as a user
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, applicantEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      return { success: false, message: "Email already registered" };
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save verification code to database
    await db.insert(adminVerificationCodes).values({
      code,
      email: applicantEmail,
      isUsed: false,
      expiresAt,
    });

    // Send verification code to admin email
    const emailSent = await sendVerificationCodeEmail(
      adminEmail,
      code,
      applicantName
    );

    if (!emailSent) {
      // Delete the code if email fails
      await db
        .delete(adminVerificationCodes)
        .where(eq(adminVerificationCodes.code, code));
      return {
        success: false,
        message: "Failed to send verification code. Please try again.",
      };
    }

    return {
      success: true,
      message: "Verification code sent to admin email. Please share it with the applicant.",
    };
  } catch (error) {
    console.error("[Admin Registration] Error requesting registration:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

/**
 * Verify code and create admin account
 */
export async function verifyCodeAndCreateAdmin(
  verificationCode: string,
  email: string,
  name: string,
  openId: string,
  password?: string
): Promise<{ success: boolean; message: string; userId?: number }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Find and validate verification code
    const codeRecords = await db
      .select()
      .from(adminVerificationCodes)
      .where(
        and(
          eq(adminVerificationCodes.code, verificationCode),
          eq(adminVerificationCodes.email, email),
          eq(adminVerificationCodes.isUsed, false),
          gt(adminVerificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (codeRecords.length === 0) {
      return {
        success: false,
        message: "Invalid or expired verification code",
      };
    }

    const codeRecord = codeRecords[0];

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return { success: false, message: "User already exists" };
    }

    // Import hashPassword at the top of the file
    const { hashPassword } = await import("./auth-utils");
    
    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    // Create admin user
    const result = await db.insert(users).values({
      openId,
      name,
      email,
      password: hashedPassword,
      loginMethod: "admin_registration",
      role: "admin",
      isActive: true,
    });

    // Mark verification code as used
    await db
      .update(adminVerificationCodes)
      .set({ isUsed: true })
      .where(eq(adminVerificationCodes.id, codeRecord.id));

    return {
      success: true,
      message: "Admin account created successfully",
      userId: (result as any).insertId as number,
    };
  } catch (error) {
    console.error("[Admin Registration] Error verifying code:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

/**
 * Check if email is already registered
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Admin Registration] Error checking email:", error);
    return false;
  }
}

/**
 * Get admin email from environment
 */
export function getAdminEmail(): string {
  return process.env.GMAIL_USER || "chewbrandon9911@gmail.com";
}
