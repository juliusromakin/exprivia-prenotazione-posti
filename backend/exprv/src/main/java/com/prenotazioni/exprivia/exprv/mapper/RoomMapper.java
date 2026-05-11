package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Room;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {EquipmentMapper.class})
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
    @Mapping(target = "floor", ignore = true)
    Room toEntity(RoomDTO roomDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "id", target = "id")
    @Mapping(source = "roomType", target = "roomType")
    @Mapping(source = "enabled", target = "enabled")
    @Mapping(target = "floor", ignore = true)
    void updateRoomFromDto(RoomDTO roomDTO, @MappingTarget Room room);

    List<RoomDTO> toDtoList(List<Room> roomList);

    @Mapping(source = "name", target = "label")
    SelectOptionDTO toSelectOptionDTO(Room entity);

    List<SelectOptionDTO> toSelectOptionDTOList(List<Room> entities);

    @AfterMapping
    default void linkEquipment(@MappingTarget Room room) {
        if (room.getEquipment() != null) {
            room.getEquipment().forEach(e -> e.setRoom(room));
        }
    }

}
