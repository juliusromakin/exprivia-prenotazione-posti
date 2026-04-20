import { Workspace } from './workspace.model';

export interface Room {
    id: number;
    name: string;
    roomType: string;
    capacity: number;
    isActive: boolean;
    workspaces?: Workspace[];
}

export interface RoomWithWorkspaces extends Room {
    workspaces: Workspace[];
}
