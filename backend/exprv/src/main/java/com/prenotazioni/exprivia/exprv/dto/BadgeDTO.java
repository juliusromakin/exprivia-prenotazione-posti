package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDTO {

    private Integer id;

    @NotBlank(message = "Il nome del badge non può essere vuoto")
    @Size(max = 50, message = "Il nome del badge non può superare i 50 caratteri")
    private String name;

    @NotNull(message = "Il tipo del badge è obbligatorio")
    private BadgeType type;

    private String description;

    private List<Integer> parentIds;

    private Boolean isActive;
}
