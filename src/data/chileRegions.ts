import { communes } from "@clregions/data/array/communes";
import { provinces } from "@clregions/data/array/provinces";
import { regions } from "@clregions/data/array/regions";
import type { CommuneId, RegionId } from "@clregions/data/types";

export type RegionOption = { id: RegionId; name: string };
export type ComunaOption = { id: CommuneId; name: string };

/** Regiones de Chile, ordenadas de norte a sur (por id). */
export const chileRegions: RegionOption[] = [...regions]
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((region) => ({ id: region.id, name: region.name }));

const provinceToRegion = new Map<string, string>(
  provinces.map((province) => [province.id, province.regionId])
);

/** Comunas que pertenecen a una región dada, ordenadas alfabéticamente. */
export function getComunasByRegion(regionId: string): ComunaOption[] {
  return communes
    .filter((commune) => provinceToRegion.get(commune.provinceId) === regionId)
    .map((commune) => ({ id: commune.id, name: commune.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
