import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GetStarted } from "./GetStarted";

describe("GetStarted", () => {
  it("names only the settings missing on this deployment and its environment", () => {
    const saved = { ...process.env };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    delete process.env.DATABASE_URL;
    process.env.VERCEL_ENV = "preview";
    try {
      const html = renderToStaticMarkup(<GetStarted state="unconfigured" />);
      expect(html).toContain("Setup needed");
      expect(html).toContain("<b>Preview</b>");
      expect(html).toContain("<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>");
      expect(html).toContain("<code>DATABASE_URL</code>");
      expect(html).not.toContain("<code>NEXT_PUBLIC_SUPABASE_URL</code>");
      expect(html).not.toContain("x.supabase.co");
      expect(html).toContain('href="/onboarding"');
    } finally {
      process.env = saved;
    }
  });
  it("sends signed-out users to sign in", () => {
    expect(renderToStaticMarkup(<GetStarted state="signed-out" />)).toContain('href="/login"');
  });
  it("sends users without a profile to the birth details form", () => {
    const html = renderToStaticMarkup(<GetStarted state="no-profile" />);
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain("Enter birth details");
  });
});
