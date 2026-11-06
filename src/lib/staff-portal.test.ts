import { describe, expect, it } from "vitest";
import { staffAccessMessage, staffAccessWhatsApp, staffPortalLink } from "./staff-portal";

describe("portal da funcionária", () => {
  it("gera o link pessoal /f/[token]", () => {
    expect(staffPortalLink("https://app.com/", "abc-123")).toBe("https://app.com/f/abc-123");
  });
  it("monta a mensagem com nome, salão e link", () => {
    expect(staffAccessMessage("Ana", "Salão da Katylene", "https://app.com/f/x")).toBe("Oi Ana! Seu acesso pessoal do Salão da Katylene: https://app.com/f/x");
  });
  it("abre o WhatsApp só com os dígitos do número", () => {
    expect(staffAccessWhatsApp("+55 (11) 99999-0000", "Oi")).toBe("https://wa.me/5511999990000?text=Oi");
  });
});
