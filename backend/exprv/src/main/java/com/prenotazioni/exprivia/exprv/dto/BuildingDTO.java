package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BuildingDTO {
    private Integer id;
    
    @NotBlank(message = "L'indirizzo dell'edificio è obbligatorio")
    private String address;
    
    @NotNull(message = "La sede di appartenenza è obbligatoria")
    private Integer locationId;
    private Boolean enabled;

    public BuildingDTO() {
    }

    public BuildingDTO(Integer id, String address, Integer locationId) {
        this.id = id;
        this.address = address;
        this.locationId = locationId;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
