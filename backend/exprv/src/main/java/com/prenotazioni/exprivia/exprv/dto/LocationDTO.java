package com.prenotazioni.exprivia.exprv.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.prenotazioni.exprivia.exprv.enumerati.Cities;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class LocationDTO {

    private Integer id;

    @NotBlank(message = "Il nome della sede è obbligatorio")
    private String name;

    @NotNull(message = "Lo stato della sede è obbligatorio")
    private Boolean enabled;

    private Cities city;

    private String phoneNumber;

    @Email(message = "Formato email non valido")
    private String email;

    @JsonProperty("edifici")
    private List<BuildingDTO> buildings;

    public LocationDTO() {
    }

    public LocationDTO(Integer id, String name, Cities city, String phoneNumber, String email, List<BuildingDTO> buildings) {
        this.id = id;
        this.name = name;
        this.city = city;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.buildings = buildings;
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

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Cities getCity() {
        return city;
    }

    public void setCity(Cities city) {
        this.city = city;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<BuildingDTO> getBuildings() {
        return buildings;
    }

    public void setBuildings(List<BuildingDTO> buildings) {
        this.buildings = buildings;
    }

}
