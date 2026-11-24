import { ArrowRight, Store } from "lucide-react";
import { useState } from "react";
import { Device } from "@/components/app/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/sarismart-store";
import { DEMO_STORE } from "@/lib/types";

export function LoginScreen() {
  const store = useApp((state) => state.store);
  const login = useApp((state) => state.login);
  const register = useApp((state) => state.register);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isDemo = store.name === DEMO_STORE.name && store.mobile === DEMO_STORE.mobile;

  const submit = () => {
    const result = mode === "login" ? login({ name, mobile, pin }) : register({ name, mobile, pin });
    setError(result);
  };

  return (
    <Device>
      <div className="h-full overflow-y-auto">
        <header className="bg-primary px-5 pt-10 pb-12 text-on-primary">
          <div className="stagger-item flex size-12 items-center justify-center rounded-xl bg-on-primary/15">
            <Store className="size-6" aria-hidden="true" />
          </div>
          <h1 className="stagger-item mt-4 font-display text-4xl font-semibold tracking-tight">SariSmart</h1>
          <p className="stagger-item mt-2 max-w-xs text-sm text-on-primary/85">
            Easy Inventory & Sales Tracker for Sari-Sari Store Owners
          </p>
        </header>
        <div className="-mt-6 px-4 pb-8">
          <form
            className="stagger-item lift rounded-2xl bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <h2 className="text-lg font-semibold">
              {mode === "login" ? "Mag-login sa Store" : "Bagong store"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === "login"
                ? "Ipasok ang phone number at PIN"
                : "Mawawala ang lumang sales. Mananatili ang sample inventory."}
            </p>
            <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="store-name">
              Store name
            </label>
            <Input
              id="store-name"
              className="mt-2"
              value={name}
              placeholder="Aling Nena's Sari-Sari Store"
              autoComplete="organization"
              onChange={(event) => setName(event.target.value)}
            />
            <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="mobile">
              Mobile number
            </label>
            <Input
              id="mobile"
              className="mt-2"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="09171234567"
              value={mobile}
              onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 11))}
            />
            <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="pin">
              4-digit PIN
            </label>
            <Input
              id="pin"
              className="mt-2 tracking-widest"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {error ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="mt-5 w-full">
              {mode === "login" ? "Mag-login" : "I-save at pumasok"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            {mode === "login" && isDemo ? (
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => {
                  setName(DEMO_STORE.name);
                  setMobile(DEMO_STORE.mobile);
                  setPin(DEMO_STORE.pin);
                  setError(null);
                }}
              >
                Punan ang demo ni Aling Nena
              </Button>
            ) : null}
            <button
              type="button"
              className="mt-3 w-full text-center text-sm font-medium text-primary-ink"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
            >
              {mode === "login" ? "Iba ang store? Gumawa ng bago" : "Bumalik sa login"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted">Bukidnon State University</p>
        </div>
      </div>
    </Device>
  );
}
