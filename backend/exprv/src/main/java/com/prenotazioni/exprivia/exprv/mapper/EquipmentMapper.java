package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import com.prenotazioni.exprivia.exprv.dto.EquipmentDTO;
import com.prenotazioni.exprivia.exprv.entity.Equipment;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EquipmentMapper {

    EquipmentDTO toDto(Equipment entity);

    Equipment toEntity(EquipmentDTO dto);

    List<EquipmentDTO> toDtoList(List<Equipment> entities);

    List<Equipment> toEntityList(List<EquipmentDTO> dtos);
}
