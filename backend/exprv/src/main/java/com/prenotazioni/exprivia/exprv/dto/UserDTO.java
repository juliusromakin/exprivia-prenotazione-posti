package com.prenotazioni.exprivia.exprv.dto;

import java.util.Set;
import java.util.stream.Collectors;

import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.User;

public class UserDTO {
    private Integer id;
    private String name;
    private String lastName;
    private String email;
    private Set<String> badges;

    public UserDTO() {

    }

    public UserDTO(Integer id, String name, String lastName, String email, Set<String> badges) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.badges = badges;
    }

    public UserDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.badges = user.getBadges().stream()
                .map(Badge::getName)
                .collect(Collectors.toSet());
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

}
