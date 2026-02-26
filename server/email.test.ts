import { describe, it, expect } from "vitest";
import { testEmailConfiguration } from "./email";

describe("Email Configuration", () => {
  it("should verify Gmail SMTP configuration", async () => {
    const result = await testEmailConfiguration();
    expect(result).toBe(true);
  });
});
