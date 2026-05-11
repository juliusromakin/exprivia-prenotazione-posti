package com.prenotazioni.exprivia.exprv.mapper;

import com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO;
import com.prenotazioni.exprivia.exprv.entity.WorkspacePosition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WorkspacePositionMapper {
    @Mapping(source = "workspace.id", target = "workspaceId")
    WorkspacePositionDTO toDto(WorkspacePosition entity);

    @Mapping(source = "workspaceId", target = "workspace.id")
    WorkspacePosition toEntity(WorkspacePositionDTO dto);

    List<WorkspacePositionDTO> toDtoList(List<WorkspacePosition> entityList);
    List<WorkspacePosition> toEntityList(List<WorkspacePositionDTO> dtoList);
}
