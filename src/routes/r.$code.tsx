import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$code")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/auth", search: { ref: params.code, role: "dono_salao" } });
  },
});
