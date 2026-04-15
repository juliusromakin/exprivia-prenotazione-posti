package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.WorkspaceStatus;

public class WorkspaceDTO {
    private Integer id_workspace;
    private String name;
    private Integer capacity;
    private WorkspaceStatus workspaceStatus;
    private Integer roomId;
    private Boolean is_active;

    public WorkspaceDTO() {
    }

    public WorkspaceDTO(Integer id_workspace, String name, Integer capacity, WorkspaceStatus workspaceStatus,
            Integer roomId, Boolean is_active) {
        this.id_workspace = id_workspace;
        this.name = name;
        this.capacity = capacity;
        this.workspaceStatus = workspaceStatus;
        this.roomId = roomId;
        this.is_active = is_active;
    }

    public Integer getId_workspace() {
        return id_workspace;
    }

    public void setId_workspace(Integer id_workspace) {
        this.id_workspace = id_workspace;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public WorkspaceStatus getWorkspaceStatus() {
        return workspaceStatus;
    }

    public void setWorkspaceStatus(WorkspaceStatus workspaceStatus) {
        this.workspaceStatus = workspaceStatus;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }

}
