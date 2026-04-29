package com.prenotazioni.exprivia.exprv.dto;

public class FloorPlanObjectDTO {
    private String type; // "room" or "workspace"
    private String identifier; // name of the room or workspace
    private Double x;
    private Double y;
    private Double width;
    private Double height;

    public FloorPlanObjectDTO() {
    }

    public FloorPlanObjectDTO(String type, String identifier, Double x, Double y, Double width, Double height) {
        this.type = type;
        this.identifier = identifier;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public Double getX() {
        return x;
    }

    public void setX(Double x) {
        this.x = x;
    }

    public Double getY() {
        return y;
    }

    public void setY(Double y) {
        this.y = y;
    }

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }
}
