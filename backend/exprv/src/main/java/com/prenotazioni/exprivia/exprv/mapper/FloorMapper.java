package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Floor;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FloorMapper {

    @Mapping(source = "building.id", target = "buildingId")
    FloorDTO toDto(Floor entity);

    @Mapping(target = "building", ignore = true)
    Floor toEntity(FloorDTO dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "building", ignore = true)
    void updateFloorFromDto(FloorDTO dto, @MappingTarget Floor entity);

    List<FloorDTO> toDtoList(List<Floor> reservationDurationList);

    @Mapping(source = "name", target = "label")
    SelectOptionDTO toSelectOptionDTO(Floor entity);

    List<SelectOptionDTO> toSelectOptionDTOList(List<Floor> entities);
}