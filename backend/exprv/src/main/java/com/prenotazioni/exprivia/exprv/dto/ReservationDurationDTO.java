package com.prenotazioni.exprivia.exprv.dto;

public class ReservationDurationDTO {
    private String name;
    private Integer minutes;
    private Boolean is_active;

    public ReservationDurationDTO() {
    }

    public ReservationDurationDTO(String name, Integer minutes, Boolean is_active) {
        this.name = name;
        this.minutes = minutes;
        this.is_active = is_active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMinutes() {
        return minutes;
    }

    public void setMinutes(Integer minutes) {
        this.minutes = minutes;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }

}
