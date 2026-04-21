package com.prenotazioni.exprivia.exprv.dto;

public class BuildingDTO {
    private Integer id;
    private String address;
    private Integer locationId;

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

}
