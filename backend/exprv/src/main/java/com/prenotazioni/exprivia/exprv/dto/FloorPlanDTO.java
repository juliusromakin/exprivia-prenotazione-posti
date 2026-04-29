package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class FloorPlanDTO {
    @NotNull(message = "L'ID del piano è obbligatorio")
    private Integer floorId;
    private String floorName;
    private String buildingAddress;
    private String locationName;
    private String imagePath;
    private Double canvasWidth;
    private Double canvasHeight;
    private List<FloorPlanObjectDTO> objects;

    public FloorPlanDTO() {
    }

    public FloorPlanDTO(Integer floorId, String floorName, String buildingAddress, String locationName, String imagePath, Double canvasWidth, Double canvasHeight, List<FloorPlanObjectDTO> objects) {
        this.floorId = floorId;
        this.floorName = floorName;
        this.buildingAddress = buildingAddress;
        this.locationName = locationName;
        this.imagePath = imagePath;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.objects = objects;
    }

    public Integer getFloorId() {
        return floorId;
    }

    public void setFloorId(Integer floorId) {
        this.floorId = floorId;
    }

    public String getFloorName() {
        return floorName;
    }

    public void setFloorName(String floorName) {
        this.floorName = floorName;
    }

    public String getBuildingAddress() {
        return buildingAddress;
    }

    public void setBuildingAddress(String buildingAddress) {
        this.buildingAddress = buildingAddress;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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

    public List<FloorPlanObjectDTO> getObjects() {
        return objects;
    }

    public void setObjects(List<FloorPlanObjectDTO> objects) {
        this.objects = objects;
    }
}
