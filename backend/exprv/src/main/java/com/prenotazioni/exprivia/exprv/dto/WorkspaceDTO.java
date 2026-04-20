package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.WorkspaceStatus;

public class WorkspaceDTO {
    private Integer id;
    private String name;
    private Integer capacity;
    private WorkspaceStatus workspaceStatus;
    private Integer roomId;
    private Boolean enabled;

    public WorkspaceDTO() {
    }

    public WorkspaceDTO(Integer id, String name, Integer capacity, WorkspaceStatus workspaceStatus,
            Integer roomId, Boolean enabled) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.workspaceStatus = workspaceStatus;
        this.roomId = roomId;
        this.enabled = enabled;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
