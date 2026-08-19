import { EscortPosition } from "@/generated/prisma/enums";

export const ESCORT_POSITIONS: { value: EscortPosition; label: string }[] = [
  { value: "LEAD", label: "Lead" },
  { value: "CHASE", label: "Chase" },
  { value: "HIGH_POLE", label: "High Pole" },
  { value: "STEER", label: "Steer" },
  { value: "ROUTE_SURVEY", label: "Route Survey" },
  { value: "THIRD_CAR", label: "Third Car" },
  { value: "FOURTH_CAR", label: "Fourth Car" },
];
