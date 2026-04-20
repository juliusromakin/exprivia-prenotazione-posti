package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
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

    public List<SelectOptionDTO> getRoomOptions() {
        return roomRepository.findAll().stream()
                .map(room -> new SelectOptionDTO(room.getId(), room.getName()))
                .toList();
    }

    public RoomDTO findRoomById(Integer id) {
        return roomMapper.toDto(roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND)));
    }

    public RoomDTO createRoom(RoomDTO roomDTO) {
        return roomMapper.toDto(roomRepository.save(roomMapper.toEntity(roomDTO)));
    }

    public RoomDTO updateRoom(Integer id, RoomDTO roomDTO) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND));
        roomMapper.updateRoomFromDto(roomDTO, existingRoom);
        roomRepository.save(existingRoom);
        return roomMapper.toDto(existingRoom);
    }

    public void softDeleteRoom(Integer id) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND));
        existingRoom.setEnabled(false);
        roomRepository.save(existingRoom);
    }

    public void hardDeleteRoom(Integer id) {
        if (!roomRepository.existsById(id)) {
            throw new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        roomRepository.deleteById(id);
    }
}
