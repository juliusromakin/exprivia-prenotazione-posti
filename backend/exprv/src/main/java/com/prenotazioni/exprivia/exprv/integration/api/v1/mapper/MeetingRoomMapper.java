package com.prenotazioni.exprivia.exprv.integration.api.v1.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.integration.api.v1.dto.MeetingRoomOccupancyDTO;
import com.prenotazioni.exprivia.exprv.integration.api.v1.dto.OccupancySlotDTO;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MeetingRoomMapper {

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.name", target = "roomName")
    @Mapping(target = "currentlyOccupied", expression = "java(isRoomOccupiedNow(reservations))")
    @Mapping(target = "occupancySlots", source = "reservations")
    MeetingRoomOccupancyDTO toOccupancyDTO(Room room, List<Reservation> reservations);

    @Mapping(source = "startDate", target = "start")
    @Mapping(source = "endDate", target = "end")
    @Mapping(source = "user.email", target = "userEmail")
    OccupancySlotDTO toSlotDTO(Reservation reservation);

    List<OccupancySlotDTO> toSlotDTOList(List<Reservation> reservations);

    default boolean isRoomOccupiedNow(List<Reservation> reservations) {
        if (reservations == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Reservation res : reservations) {
            if ((now.isEqual(res.getStartDate()) || now.isAfter(res.getStartDate()))
                    && now.isBefore(res.getEndDate())) {
                return true;
            }
        }
        return false;
    }
}
