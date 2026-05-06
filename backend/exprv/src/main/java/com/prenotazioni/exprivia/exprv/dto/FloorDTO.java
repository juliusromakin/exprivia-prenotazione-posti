package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class FloorDTO {
    private Integer id;
    @NotBlank(message = "Il nome del piano è obbligatorio")
    private String name;
    @NotNull(message = "L'edificio di appartenenza è obbligatorio")
    private Integer buildingId;
    private Boolean enabled;
    private String imagePath;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Double canvasWidth;
    private Double canvasHeight;
    private List<RoomDTO> rooms;
    private List<WorkspaceDTO> workspaces;

    public FloorDTO() {
    }

    public FloorDTO(Integer id, String name, Integer buildingId) {
        this.id = id;
        this.name = name;
        this.buildingId = buildingId;
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

    public Integer getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Integer buildingId) {
        this.buildingId = buildingId;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Double getCanvasWidth() {
        return canvasWidth;
    }

    public void setCanvasWidth(Double canvasWidth) {
        this.canvasWidth = canvasWidth;
    }

    public Double getCanvasHeight() {
        return canvasHeight;
    }

    public void setCanvasHeight(Double canvasHeight) {
        this.canvasHeight = canvasHeight;
    }

    public List<RoomDTO> getRooms() {
        return rooms;
    }

    public void setRooms(List<RoomDTO> rooms) {
        this.rooms = rooms;
    }

    public List<WorkspaceDTO> getWorkspaces() {
        return workspaces;
    }

    public void setWorkspaces(List<WorkspaceDTO> workspaces) {
        this.workspaces = workspaces;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }
}
