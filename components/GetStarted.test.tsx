import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GetStarted } from "./GetStarted";

describe("GetStarted", () => {
  it("explains missing setup and links to the form preview", () => {
    const html = renderToStaticMarkup(<GetStarted state="unconfigured" />);
    expect(html).toContain("Setup needed");
    expect(html).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(html).toContain('href="/onboarding"');
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
