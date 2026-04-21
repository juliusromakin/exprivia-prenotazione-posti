package com.prenotazioni.exprivia.exprv.dto;

public class FloorDTO {

    private Integer id;
    private String name;
    private String imagePath;
    private Integer buildingId;

    public FloorDTO() {
    }

    public FloorDTO(Integer id, String name, String imagePath, Integer buildingId) {
        this.id = id;
        this.name = name;
        this.imagePath = imagePath;
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

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Integer getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Integer buildingId) {
        this.buildingId = buildingId;
    }

}
