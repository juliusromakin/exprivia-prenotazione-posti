package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.entity.Reservation;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReservationMapper {

    @Mapping(source = "workspace.id_workspace", target = "workspaceId")
    @Mapping(source = "user.id_user", target = "userId")
    @Mapping(source = "reservationDuration.name", target = "durationName")
    ReservationDTO toDto(Reservation reservation);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "workspace", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "reservationDuration", ignore = true)
    Reservation toEntity(ReservationDTO reservationDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "workspace", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "reservationDuration", ignore = true)
    void updateReservationFromDto(ReservationDTO reservationDTO, @MappingTarget Reservation reservation);

    @Mapping(source = "workspace.id_workspace", target = "workspaceId")
    @Mapping(source = "user.id_user", target = "userId")
    @Mapping(source = "reservationDuration.name", target = "durationName")
    List<ReservationDTO> toDtoList(List<Reservation> reservationList);
}
