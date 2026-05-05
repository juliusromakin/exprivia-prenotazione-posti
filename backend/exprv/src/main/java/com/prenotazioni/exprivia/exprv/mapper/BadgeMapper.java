package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.BadgeDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BadgeMapper {

    BadgeDTO toDto(Badge badge);

    Badge toEntity(BadgeDTO badgeDTO);

    List<BadgeDTO> toDtoList(List<Badge> badges);
}
