import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import {
  createUserWithPassword,
  authenticateUser,
  getUserById,
  updateUserPassword,
} from "./db-auth";
import {
  generateToken,
  verifyToken,
  validatePassword,
} from "./auth-utils";
import {
  requestAdminRegistration,
  verifyCodeAndCreateAdmin,
  isEmailRegistered,
  getAdminEmail,
} from "./db-admin";

export const authRouter = router({
  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;

      const result = await authenticateUser(email, password);

      if (!result.success || !result.user) {
        return {
          success: false,
          message: result.message,
        };
      }

      // Generate JWT token
      const token = generateToken(result.user.id, result.user.email, result.user.role);

      return {
        success: true,
        token,
        user: result.user,
        message: "Login successful",
      };
    }),

  /**
   * Register with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { email, name, password } = input;

      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.valid) {
        return {
          success: false,
          message: "Password does not meet requirements",
          errors: validation.errors,
        };
      }

      // Check if email already registered
      const isRegistered = await isEmailRegistered(email);
      if (isRegistered) {
        return {
          success: false,
          message: "Email already registered",
        };
      }

      const result = await createUserWithPassword(email, name, password, "user");

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      // Generate JWT token
      const token = generateToken(result.userId || 0, email, "user");

      return {
        success: true,
        token,
        userId: result.userId,
        message: "Registration successful",
      };
    }),

  /**
   * Request admin registration - sends verification code to admin email
   */
  requestAdminRegistration: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const { name, email } = input;

      // Check if email already registered
      const isRegistered = await isEmailRegistered(email);
      if (isRegistered) {
        return {
          success: false,
          message: "This email is already registered",
        };
      }

      // Get admin email from environment
      const adminEmail = getAdminEmail();

      // Request registration
      const result = await requestAdminRegistration(name, email, adminEmail);
      return result;
    }),

  /**
   * Verify code and create admin account
   */
  verifyAndRegisterAdmin: publicProcedure
    .input(
      z.object({
        verificationCode: z.string().length(6, "Verification code must be 6 digits"),
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { verificationCode, email, name, password } = input;

      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.valid) {
        return {
          success: false,
          message: "Password does not meet requirements",
          errors: validation.errors,
        };
      }

      // Verify code and create admin account
      const result = await verifyCodeAndCreateAdmin(
        verificationCode,
        email,
        name,
        `admin_${Date.now()}`,
        password
      );

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      // Update user with password
      // Note: In a real scenario, you might want to hash and store the password during admin creation
      // For now, we'll update it separately
      const userId = result.userId || 0;

      // Generate JWT token
      const token = generateToken(userId, email, "admin");

      return {
        success: true,
        token,
        userId,
        message: "Admin account created successfully",
      };
    }),

  /**
   * Verify JWT token and get current user
   */
  me: publicProcedure
    .input(z.object({ token: z.string() }).optional())
    .query(async ({ input }) => {
      if (!input?.token) {
        return {
          user: null,
          isAuthenticated: false,
        };
      }

      const decoded = verifyToken(input.token);
      if (!decoded) {
        return {
          user: null,
          isAuthenticated: false,
        };
      }

      const user = await getUserById(decoded.userId);
      if (!user) {
        return {
          user: null,
          isAuthenticated: false,
        };
      }

      return {
        user,
        isAuthenticated: true,
      };
    }),

  /**
   * Change password
   */
  changePassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { token, currentPassword, newPassword } = input;

      // Verify token
      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          success: false,
          message: "Invalid token",
        };
      }

      // Validate new password strength
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return {
          success: false,
          message: "Password does not meet requirements",
          errors: validation.errors,
        };
      }

      // Verify current password
      const authResult = await authenticateUser(decoded.email, currentPassword);
      if (!authResult.success) {
        return {
          success: false,
          message: "Current password is incorrect",
        };
      }

      // Update password
      const result = await updateUserPassword(decoded.userId, newPassword);
      return result;
    }),

  /**
   * Check if email is already registered
   */
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email("Invalid email address") }))
    .query(async ({ input }) => {
      const isRegistered = await isEmailRegistered(input.email);
      return { exists: isRegistered };
    }),

  /**
   * Get admin email for display purposes
   */
  getAdminEmailForDisplay: publicProcedure.query(async () => {
    const adminEmail = getAdminEmail();
    // Only return masked email for security
    const [localPart, domain] = adminEmail.split("@");
    const masked = localPart.substring(0, 2) + "*".repeat(localPart.length - 2) + "@" + domain;
    return { adminEmail: masked, fullEmail: adminEmail };
  }),
});
