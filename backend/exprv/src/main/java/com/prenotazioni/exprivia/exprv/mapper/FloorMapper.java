package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FloorMapper {

    @Mapping(source = "building.id", target = "buildingId")
    FloorDTO toDto(Floor entity);

    @Mapping(source = "buildingId", target = "building.id")
    Floor toEntity(FloorDTO dto);
}