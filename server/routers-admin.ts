import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import {
  requestAdminRegistration,
  verifyCodeAndCreateAdmin,
  isEmailRegistered,
  getAdminEmail,
} from "./db-admin";

export const adminRouter = router({
  /**
   * Request admin registration - sends verification code to admin email
   */
  requestRegistration: publicProcedure
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
  verifyAndRegister: publicProcedure
    .input(
      z.object({
        verificationCode: z.string().length(6, "Verification code must be 6 digits"),
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        openId: z.string().min(1, "OpenId is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { verificationCode, email, name, openId } = input;

      // Verify code and create admin account
      const result = await verifyCodeAndCreateAdmin(
        verificationCode,
        email,
        name,
        openId
      );

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
