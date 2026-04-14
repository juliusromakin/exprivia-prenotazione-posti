package com.prenotazioni.exprivia.exprv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {

}
