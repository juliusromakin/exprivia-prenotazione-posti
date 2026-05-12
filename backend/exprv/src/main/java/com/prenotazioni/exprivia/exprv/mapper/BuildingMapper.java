package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BuildingMapper {
    
    @Mapping(source = "location.id", target = "locationId")
    @Mapping(expression = "java(entity.getFloors() != null ? (int) entity.getFloors().stream().filter(f -> f.getEnabled() != null && f.getEnabled()).count() : 0)", target = "numFloors")
    BuildingDTO toDto(Building entity);

    @Mapping(target = "location", ignore = true)
    Building toEntity(BuildingDTO dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "location", ignore = true)
    void updateBuildingFromDto(BuildingDTO dto, @MappingTarget Building entity);

    List<BuildingDTO> toDtoList(List<Building> reservationDurationList);

    @Mapping(source = "address", target = "label")
    SelectOptionDTO toSelectOptionDTO(Building entity);

    List<SelectOptionDTO> toSelectOptionDTOList(List<Building> entities);
}