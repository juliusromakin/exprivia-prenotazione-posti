package com.prenotazioni.exprivia.exprv.dto;

public class WorkspacePositionDTO {
    private Integer id;
    private Integer workspaceId;
    private Double mapX;
    private Double mapY;

    public WorkspacePositionDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Integer workspaceId) { this.workspaceId = workspaceId; }

    public Double getMapX() { return mapX; }
    public void setMapX(Double mapX) { this.mapX = mapX; }

    public Double getMapY() { return mapY; }
    public void setMapY(Double mapY) { this.mapY = mapY; }
}
