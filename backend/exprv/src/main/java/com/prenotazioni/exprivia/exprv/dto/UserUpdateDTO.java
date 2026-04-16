package com.prenotazioni.exprivia.exprv.dto;

public class UserUpdateDTO {

    private String name;
    private String lastName;
    private String email;
    private String currentPassword;
    private String newPassword;

    public UserUpdateDTO() {
    }

    public UserUpdateDTO(String name, String lastName, String email, String currentPassword, String newPassword) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
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

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
