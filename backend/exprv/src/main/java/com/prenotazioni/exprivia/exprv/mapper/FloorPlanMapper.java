package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanSummaryDTO;
import com.prenotazioni.exprivia.exprv.entity.FloorPlan;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {RoomPositionMapper.class, WorkspacePositionMapper.class})
public interface FloorPlanMapper {
    @Mapping(source = "floor.id", target = "floorId")
    FloorPlanDTO toDto(FloorPlan entity);

    @Mapping(source = "floorId", target = "floor.id")
    FloorPlan toEntity(FloorPlanDTO dto);

    List<FloorPlanDTO> toDtoList(List<FloorPlan> entityList);
    List<FloorPlan> toEntityList(List<FloorPlanDTO> dtoList);

    FloorPlanSummaryDTO toSummaryDto(FloorPlan entity);
    List<FloorPlanSummaryDTO> toSummaryDtoList(List<FloorPlan> entityList);
}
