package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDate;
import java.util.List;

public class FloorPlanDTO {
    private Integer id;
    private Integer floorId;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String imagePath;
    private Double canvasWidth;
    private Double canvasHeight;

    private List<RoomPositionDTO> rooms;
    private List<WorkspacePositionDTO> workspaces;

    public FloorPlanDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getFloorId() { return floorId; }
    public void setFloorId(Integer floorId) { this.floorId = floorId; }

    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }

    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public Double getCanvasWidth() { return canvasWidth; }
    public void setCanvasWidth(Double canvasWidth) { this.canvasWidth = canvasWidth; }

    public Double getCanvasHeight() { return canvasHeight; }
    public void setCanvasHeight(Double canvasHeight) { this.canvasHeight = canvasHeight; }

    public List<RoomPositionDTO> getRooms() { return rooms; }
    public void setRooms(List<RoomPositionDTO> rooms) { this.rooms = rooms; }

    public List<WorkspacePositionDTO> getWorkspaces() { return workspaces; }
    public void setWorkspaces(List<WorkspacePositionDTO> workspaces) { this.workspaces = workspaces; }
}
