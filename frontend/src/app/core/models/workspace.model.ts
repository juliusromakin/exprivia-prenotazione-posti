import { WorkspaceStatus, RoomType } from './enums';

export interface Workspace {
    id?: number;
    name: string;
    roomId: number;
    capacity?: number;
    status?: WorkspaceStatus;
    isActive?: boolean;
    mapX?: number;
    mapY?: number;
}

export interface WorkspaceWithRoom extends Workspace {
    id: number;
    name: string;
    roomId: number;
    roomName?: string;
    roomType?: RoomType | string;
}

export interface RoomWorkspace {
    id: number;
    name: string;
    mapX?: number;
    mapY?: number;
    mapWidth?: number;
    mapHeight?: number;
    workspaces: Workspace[];
}

export interface WorkspaceAvailability {
    id: string | number;
    name: string;
    status: WorkspaceStatus | string;
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