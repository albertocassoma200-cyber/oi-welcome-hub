import { describe, expect, it } from "vitest";

import { catalogDetails, formatCatalogPrice } from "@/lib/store-catalog";

describe("store catalog", () => {
  it("preserves all twelve products and prices supplied by the owner", () => {
    expect(catalogDetails.map(({ name, price, image }) => [name, price, image.length > 0])).toEqual(
      [
        ["Body spray", 3500, true],
        ["Espelho para bolsa", 1500, true],
        ["Sabonete de cenoura", 2500, true],
        ["Copo térmico", 6500, true],
        ["Conjunto 2 em 1: primer e removedor de maquilhagem", 2000, true],
        ["Máquina de skin care", 3500, true],
        ["Adesivos para espinhas", 1500, true],
        ["Sabão de açafrão", 2800, true],
        ["Nécessaire", 2500, true],
        ["Loção corporal", 2500, true],
        ["Hidratante labial", 1500, true],
        ["Conjunto Dear Body", 5500, true],
      ],
    );
  });

  it("formats prices consistently in kwanzas", () => {
    expect(formatCatalogPrice(3500)).toBe("3 500 Kz");
    expect(formatCatalogPrice(1500)).toBe("1 500 Kz");
  });
});
