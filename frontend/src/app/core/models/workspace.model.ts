import { Room } from './room.model';
import { WorkspaceStatus } from './enums';

export interface RoomWorkspace {
    id: number;
    name: string;
    workspaces: Workspace[];
}

export interface Workspace {
    id?: number;
    name?: string;
    roomId?: number;
    capacity?: number;
    workspaceStatus?: WorkspaceStatus;
    isActive?: boolean;
}

export interface WorkspaceWithRoom extends Workspace {
    id: number;
    name: string;
    roomId: number;
    roomName?: string;
    roomType?: string;
}
