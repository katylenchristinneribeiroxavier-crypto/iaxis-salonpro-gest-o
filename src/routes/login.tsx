import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { role: "dono_salao", ref: undefined } });
  },
});
