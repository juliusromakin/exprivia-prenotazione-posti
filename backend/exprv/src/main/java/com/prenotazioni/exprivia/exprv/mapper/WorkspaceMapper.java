package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.WorkspaceDTO;
import com.prenotazioni.exprivia.exprv.entity.Workspace;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkspaceMapper {

    @Mapping(source = "room.id_room", target = "roomId")
    WorkspaceDTO toDto(Workspace workspace);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "room", ignore = true)
    Workspace toEntity(WorkspaceDTO workspaceDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "room", ignore = true)
    void updateWorkspaceFromDto(WorkspaceDTO workspaceDTO, @MappingTarget Workspace workspace);

    @Mapping(source = "room.id_room", target = "roomId")
    List<WorkspaceDTO> toDtoList(List<Workspace> workspaceList);

}
