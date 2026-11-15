import { describe, expect, it } from "vitest";
import { planCharge } from "./plans";

const basico = { price: 59.9, annual_monthly_price: 39.9 };
const pro = { price: 99.9, annual_monthly_price: 79.9 };
const premium = { price: 149.9, annual_monthly_price: 119.9 };

describe("valor dos planos", () => {
  it("Básico mensal = 59,90", () => expect(planCharge(basico, "mensal")).toBe(59.9));
  it("mensal cobra o preço do mês", () => expect(planCharge(pro, "mensal")).toBe(99.9));
  it("Premium mensal = 149,90", () => expect(planCharge(premium, "mensal")).toBe(149.9));
  it("Básico anual = 478,80", () => expect(planCharge(basico, "anual")).toBe(478.8));
  it("Pro anual = 958,80", () => expect(planCharge(pro, "anual")).toBe(958.8));
  it("Premium anual = 1.438,80", () => expect(planCharge(premium, "anual")).toBe(1438.8));
});
