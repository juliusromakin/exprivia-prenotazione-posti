package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.RoomMapper;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;

    public RoomService(RoomRepository roomRepository, RoomMapper roomMapper) {
        this.roomRepository = roomRepository;
        this.roomMapper = roomMapper;
    }

    public List<RoomDTO> findAllRooms() {
        return roomMapper.toDtoList(roomRepository.findAll());
    }

    public RoomDTO findRoomById(Integer id) {
        return roomMapper.toDTO(roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Stanza con ID " + id + " non trovata", HttpStatus.NOT_FOUND)));
    }

    public RoomDTO createRoom(RoomDTO roomDTO) {
        return roomMapper.toDTO(roomRepository.save(roomMapper.toEntity(roomDTO)));
    }

    public RoomDTO updateRoom(Integer id, RoomDTO roomDTO) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Stanza con ID " + id + " non trovata", HttpStatus.NOT_FOUND));
        roomMapper.updateRoomFromDto(roomDTO, existingRoom);
        roomRepository.save(existingRoom);
        return roomMapper.toDTO(existingRoom);
    }
}
