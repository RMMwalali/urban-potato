"use client";
import { useActionState, useEffect, useState } from "react";
import { keepValues } from "./useKeepForm";
import type { FormState } from "@/app/actions/auth";

type Props = {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  countries: { code: string; name: string }[];
  counties: string[];
  defaultCountry: string;
  defaultRegion?: string;
  defaultCity?: string;
  refCode?: string;
};

export function SignupForm({ action, countries, counties, defaultCountry, defaultRegion, defaultCity, refCode }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [country, setCountry] = useState(defaultCountry);
  const [tz, setTz] = useState("");

  // Count the visit once (with the network location) and pick up the browser's time zone.
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
    fetch("/api/signup-visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: navigator.language, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} required className="input" {...props} />
    </div>
  );

  return (
    <form onSubmit={keepValues(formAction)} className="space-y-8">
      <input type="hidden" name="tz" value={tz} />
      {refCode && <input type="hidden" name="ref" value={refCode} />}
      {field("businessName", "Salon / spa name")}
      {field("name", "Your name", { autoComplete: "name" })}
      {field("email", "Email", { type: "email", autoComplete: "email" })}
      {field("password", "Password (8+ characters)", { type: "password", autoComplete: "new-password" })}

      <fieldset className="space-y-8 pt-2">
        <legend className="label-caps float-left mb-6 w-full">Where is your salon?</legend>
        <div className="clear-both grid gap-8 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="country">Country</label>
            <select id="country" name="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country">
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          {country === "KE" ? (
            <div>
              <label className="label" htmlFor="region">County</label>
              <select id="region" name="region" required className="input" defaultValue={counties.includes(defaultRegion ?? "") ? defaultRegion : ""}>
                <option value="" disabled>Choose county</option>
                {counties.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <div key="region-text">{field("region", "County / state / region", { autoComplete: "address-level1" })}</div>
          )}
        </div>
        {field("city", "Town or area", { autoComplete: "address-level2", placeholder: "e.g. Westlands, Kilimani, Nyali", defaultValue: defaultCity })}
        <div>
          <label className="label" htmlFor="address">Street or building <span className="normal-case text-muted">(optional)</span></label>
          <input id="address" name="address" className="input" autoComplete="street-address" placeholder="e.g. Sarit Centre, 2nd floor" />
        </div>
      </fieldset>

      {state?.error && <p className="border-l-2 border-pink bg-panel px-3 py-2 text-[14px] text-pink">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : "Create my salon account"}</button>
      <p className="text-[12px] leading-relaxed text-muted">
        We use your salon&apos;s location and your approximate location from your internet connection to run and improve the service. We don&apos;t store your IP address.
      </p>
    </form>
  );
}
