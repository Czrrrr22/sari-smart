import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/app/login-screen";
import { AppShell } from "@/components/app/shell";
import { useApp } from "@/lib/sarismart-store";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const unlocked = useApp((state) => state.unlocked);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !unlocked) return <LoginScreen />;
  return <AppShell />;
}
