package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Room;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoomMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "roomType", target = "roomType")
    @Mapping(source = "enabled", target = "enabled")
    @Mapping(source = "floor.id", target = "floorId")
    RoomDTO toDto(Room room);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "id", target = "id")
    @Mapping(source = "roomType", target = "roomType")
    @Mapping(source = "enabled", target = "enabled")
    @Mapping(source = "floorId", target = "floor.id")
    Room toEntity(RoomDTO roomDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "id", target = "id")
    @Mapping(source = "roomType", target = "roomType")
    @Mapping(source = "enabled", target = "enabled")
    @Mapping(source = "floorId", target = "floor.id")
    void updateRoomFromDto(RoomDTO roomDTO, @MappingTarget Room room);

    List<RoomDTO> toDtoList(List<Room> roomList);

    @Mapping(source = "name", target = "label")
    SelectOptionDTO toSelectOptionDTO(Room entity);

    List<SelectOptionDTO> toSelectOptionDTOList(List<Room> entities);

}
