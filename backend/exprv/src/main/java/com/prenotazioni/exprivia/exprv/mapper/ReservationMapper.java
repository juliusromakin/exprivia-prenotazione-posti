package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.dto.UserSummaryDTO;
import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReservationMapper {

    List<ReservationDTO> toDtoList(List<Reservation> reservationList);

    @Mapping(source = "workspace.id_workspace", target = "workspaceId")
    @Mapping(source = "user.id_user", target = "userId")
    @Mapping(source = "reservationDuration.name", target = "durationName")
    @Mapping(source = "user", target = "userSummary")
    ReservationDTO toDto(Reservation reservation);

    default UserSummaryDTO toUserSummaryDto(User user) {
        if (user == null) {
            return null;
        }
        return new UserSummaryDTO(
                user.getId_user(),
                user.getName(),
                user.getLastName(),
                user.getEmail());
    }

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

}
