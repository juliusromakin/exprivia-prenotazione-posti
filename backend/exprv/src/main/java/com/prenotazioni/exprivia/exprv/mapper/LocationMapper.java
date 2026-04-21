package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.LocationDTO;
import com.prenotazioni.exprivia.exprv.entity.Location;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LocationMapper {

    // Zero configurazioni necessarie! MapStruct mappa id con id, e name con name.
    LocationDTO toDto(Location entity);

    Location toEntity(LocationDTO dto);
}