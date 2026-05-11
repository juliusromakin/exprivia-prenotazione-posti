package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO;
import com.prenotazioni.exprivia.exprv.entity.RoomPosition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomPositionMapper {
    @Mapping(source = "room.id", target = "roomId")
    RoomPositionDTO toDto(RoomPosition entity);

    @Mapping(source = "roomId", target = "room.id")
    RoomPosition toEntity(RoomPositionDTO dto);

    List<RoomPositionDTO> toDtoList(List<RoomPosition> entityList);
    List<RoomPosition> toEntityList(List<RoomPositionDTO> dtoList);
}
