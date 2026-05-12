package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BuildingDTO {
    private Integer id;
    
    @NotBlank(message = "Il nome dell'edificio è obbligatorio")
    private String name;

    @NotBlank(message = "L'indirizzo dell'edificio è obbligatorio")
    private String address;
    
    @NotNull(message = "La sede di appartenenza è obbligatoria")
    private Integer locationId;
    
    private Double coordX;
    private Double coordY;
    private Integer numFloors;

    private Boolean enabled;

    public BuildingDTO() {
    }

    public BuildingDTO(Integer id, String name, String address, Integer locationId, Double coordX, Double coordY, Integer numFloors) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.locationId = locationId;
        this.coordX = coordX;
        this.coordY = coordY;
        this.numFloors = numFloors;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public Double getCoordX() {
        return coordX;
    }

    public void setCoordX(Double coordX) {
        this.coordX = coordX;
    }

    public Double getCoordY() {
        return coordY;
    }

    public void setCoordY(Double coordY) {
        this.coordY = coordY;
    }

    public Integer getNumFloors() {
        return numFloors;
    }

    public void setNumFloors(Integer numFloors) {
        this.numFloors = numFloors;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
