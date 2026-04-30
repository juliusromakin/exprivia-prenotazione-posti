package com.prenotazioni.exprivia.exprv.integration.api.v1.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.enumerati.RoomType;
import com.prenotazioni.exprivia.exprv.integration.api.v1.dto.MeetingRoomOccupancyDTO;
import com.prenotazioni.exprivia.exprv.repository.ReservationRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;

@Service
public class MeetingRoomIntegrationService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final com.prenotazioni.exprivia.exprv.integration.api.v1.mapper.MeetingRoomMapper meetingRoomMapper;

    public MeetingRoomIntegrationService(RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            com.prenotazioni.exprivia.exprv.integration.api.v1.mapper.MeetingRoomMapper meetingRoomMapper) {
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.meetingRoomMapper = meetingRoomMapper;
    }

    public List<MeetingRoomOccupancyDTO> getMeetingRoomsOccupancy(LocalDateTime start, LocalDateTime end) {
        List<Room> meetingRooms = roomRepository.findByRoomTypeAndEnabledTrue(RoomType.MEETING_ROOM);

        List<MeetingRoomOccupancyDTO> results = new java.util.ArrayList<>();

        for (Room room : meetingRooms) {
            List<Reservation> reservations = reservationRepository.findByRoomIdAndDateRange(room.getId(), start, end);
            MeetingRoomOccupancyDTO dto = meetingRoomMapper.toOccupancyDTO(room, reservations);
            results.add(dto);
        }

        return results;
    }
}
