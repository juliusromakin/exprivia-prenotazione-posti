package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FloorDTO {

    private Integer id;
    @NotBlank(message = "Il nome del piano è obbligatorio")
    private String name;
    private String imagePath;
    @NotNull(message = "L'edificio di appartenenza è obbligatorio")
    private Integer buildingId;
    private Boolean enabled;

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

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
