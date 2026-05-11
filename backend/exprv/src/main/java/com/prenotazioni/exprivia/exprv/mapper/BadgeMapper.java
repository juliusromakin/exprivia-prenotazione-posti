package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import com.prenotazioni.exprivia.exprv.dto.BadgeDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class BadgeMapper {

    @Autowired
    protected BadgeRepository badgeRepository;

    public abstract BadgeDTO toDto(Badge badge);

    public abstract Badge toEntity(BadgeDTO badgeDTO);

    public abstract List<BadgeDTO> toDtoList(List<Badge> badges);

    // Conversione singola per Set<String> <-> Set<Badge> in altri mapper
    public String map(Badge badge) {
        return (badge != null) ? badge.getName() : null;
    }

    public Badge map(String name) {
        if (name == null || name.isEmpty()) {
            return null;
        }
        return badgeRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Badge non trovato: " + name));
    }
}
