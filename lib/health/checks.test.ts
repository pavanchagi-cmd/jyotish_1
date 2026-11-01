import { describe, expect, it } from "vitest";
import { explainDbError } from "./checks";

describe("explainDbError", () => {
  it("explains common Supabase connection mistakes without leaking secrets", () => {
    expect(explainDbError({ code: "28P01", message: "password authentication failed for user" })).toMatch(/Wrong database password/);
    expect(explainDbError({ code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND host" })).toMatch(/host not found/);
    expect(explainDbError({ message: "Tenant or user not found" })).toMatch(/postgres\.<project-ref>/);
    expect(explainDbError({ code: "ETIMEDOUT", message: "connect ETIMEDOUT" })).toMatch(/Transaction pooler/);
    const leaked = explainDbError({ message: "bad postgresql://postgres.x:SECRET@host:6543/postgres" });
    expect(leaked).not.toContain("SECRET");
  });
});
