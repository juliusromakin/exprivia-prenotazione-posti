package com.prenotazioni.exprivia.exprv.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.ReservationDurationDTO;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReservationDurationMapper {

    ReservationDurationDTO toDto(ReservationDuration reservationDuration);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    ReservationDuration toEntity(ReservationDurationDTO reservationDurationDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateReservationDurationFromDto(ReservationDurationDTO reservationDurationDTO,
            @MappingTarget ReservationDuration reservationDuration);

    List<ReservationDurationDTO> toDtoList(List<ReservationDuration> reservationDurationList);

}
