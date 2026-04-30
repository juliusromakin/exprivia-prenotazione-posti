package com.prenotazioni.exprivia.exprv.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.enumerati.RoomType;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    List<Room> findByFloorId(Integer floorId);

    List<Room> findByFloorIdAndEnabledTrue(Integer floorId);

    List<Room> findAllByEnabledTrue();

    List<Room> findByRoomTypeAndEnabledTrue(RoomType roomType);

    Optional<Room> findByName(String name);
}
