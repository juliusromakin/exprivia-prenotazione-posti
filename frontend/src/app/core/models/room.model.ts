import { Workspace } from './workspace.model';
import { RoomType } from './enums';

export interface Room {
    id?: number;
    name: string;
    roomType: RoomType | string;
    capacity: number;
    isActive: boolean;
    mapX?: number;
    mapY?: number;
    mapWidth?: number;
    mapHeight?: number;
    workspaces?: Workspace[];
    equipment?: { name: string, quantity: number }[];
}

export interface RoomWithWorkspaces extends Room {
    workspaces: Workspace[];
}