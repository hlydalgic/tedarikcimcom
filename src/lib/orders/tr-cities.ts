/** @deprecated Import from `@/data/turkey-locations` instead. */
export {
  TURKEY_CITIES,
  getTurkeyCityByName,
  getTurkeyDistricts,
  type TurkeyCity,
  type TurkeyDistrict,
} from "@/data/turkey-locations";

import { TURKEY_CITIES } from "@/data/turkey-locations";

/** Legacy shape used by older forms — city name + district name strings. */
export const TR_CITIES = TURKEY_CITIES.map((c) => ({
  city: c.name,
  districts: c.districts.map((d) => d.name),
}));
