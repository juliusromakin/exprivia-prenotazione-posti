package com.prenotazioni.exprivia.exprv.dto;

import java.util.Set;

public class AdminUpdateUserDTO {
    private String name;
    private String lastName;
    private String email;
    private Set<String> badges;
    private Boolean enabled;

    public AdminUpdateUserDTO() {
    }

    public AdminUpdateUserDTO(String name, String lastName, String email, Set<String> badges, Boolean enabled) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.badges = badges;
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<String> getBadges() {
        return badges;
    }

    public void setBadges(Set<String> badges) {
        this.badges = badges;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
