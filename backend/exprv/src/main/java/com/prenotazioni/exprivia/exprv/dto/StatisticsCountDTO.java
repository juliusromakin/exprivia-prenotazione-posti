package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;

public class StatisticsCountDTO {
    private LocalDateTime startDate;
    private Long count;

    public StatisticsCountDTO(LocalDateTime startDate, Long count) {
        this.startDate = startDate;
        this.count = count;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
