package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.Cities;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LocationDTO {

    private Integer id;

    @NotBlank(message = "Il nome della sede è obbligatorio")
    private String name;

    @NotNull(message = "Lo stato della sede è obbligatorio")
    private Boolean enabled;

    private Cities city;

    public LocationDTO() {
    }

    public LocationDTO(Integer id, String name, Cities city) {
        this.id = id;
        this.name = name;
        this.city = city;
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

}
