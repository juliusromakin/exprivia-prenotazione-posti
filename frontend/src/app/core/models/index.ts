export * from "./user.model";
export * from "./room.model";
export * from "./workspace.model";
export * from "./reservation.model";
export * from "./auth.model";
export * from "./reservation-duration.model";
export * from "./enums";

export interface WorkspaceAvailability {
  id: string;
  name: string;
  status: "available" | "reserved" | "occupied";
  selected: boolean;
}

export interface FloorPlanMarker {
  id: string;
  x: number;
  y: number;
  room: string;
  workstation: string;
  available: boolean;
}
