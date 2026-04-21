package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BuildingMapper {
    
    @Mapping(source = "location.id", target = "locationId")
    BuildingDTO toDto(Building entity);

    @Mapping(source = "locationId", target = "location.id")
    Building toEntity(BuildingDTO dto);
}