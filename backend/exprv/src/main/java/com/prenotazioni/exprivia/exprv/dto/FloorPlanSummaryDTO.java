package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

public class FloorPlanSummaryDTO {
    private Integer id;
    private String name;
    
    @JsonProperty("publishDate")
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean isActive;

    public FloorPlanSummaryDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }

    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
