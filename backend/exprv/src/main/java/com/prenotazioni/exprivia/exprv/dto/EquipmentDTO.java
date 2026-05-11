package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class EquipmentDTO {
    private Integer id;
    @Size(max = 50, message = "Il nome dell'attrezzatura non può superare i 50 caratteri")
    private String name;
    @Min(value = 1, message = "La quantità deve essere almeno 1")
    @Max(value = 99, message = "La quantità non può superare 99")
    private Integer quantity;

    public EquipmentDTO() {
    }

    public EquipmentDTO(Integer id, String name, Integer quantity) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
