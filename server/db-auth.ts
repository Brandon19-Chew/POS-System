import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { hashPassword, comparePassword } from "./auth-utils";

/**
 * Create a new user with email and password
 */
export async function createUserWithPassword(
  email: string,
  name: string,
  password: string,
  role: "admin" | "user" = "user"
): Promise<{ success: boolean; userId?: number; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, message: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      loginMethod: "email_password",
      role,
      isActive: true,
      openId: `user_${Date.now()}`, // Generate a temporary openId
    });

    return {
      success: true,
      userId: (result as any).insertId as number,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("[Auth] Error creating user:", error);
    return { success: false, message: "An error occurred" };
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
  message: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Find user by email
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userRecords.length === 0) {
      return { success: false, message: "Invalid email or password" };
    }

    const user = userRecords[0];

    // Check if user is active
    if (!user.isActive) {
      return { success: false, message: "User account is inactive" };
    }

    // Verify password
    if (!user.password) {
      return { success: false, message: "Invalid email or password" };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Update last signed in
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || "",
        name: user.name,
        role: user.role,
      },
      message: "Login successful",
    };
  } catch (error) {
    console.error("[Auth] Error authenticating user:", error);
    return { success: false, message: "An error occurred" };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<{
  id: number;
  email: string;
  name: string | null;
  role: string;
} | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecords.length === 0) return null;

    const user = userRecords[0];
    return {
      id: user.id,
      email: user.email || "",
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("[Auth] Error getting user:", error);
    return null;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("[Auth] Error updating password:", error);
    return { success: false, message: "An error occurred" };
  }
}
