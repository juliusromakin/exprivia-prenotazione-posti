package com.prenotazioni.exprivia.exprv.config;

import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;
import com.prenotazioni.exprivia.exprv.enumerati.RoomType;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.repository.ReservationDurationRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;
import com.prenotazioni.exprivia.exprv.security.AuthoritiesConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BadgeRepository badgeRepository;
    private final RoomRepository roomRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ReservationDurationRepository reservationDurationRepository;

    @Value("${app.init-data:false}")
    private boolean initData;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!initData) {
            return;
        }

        System.out.println("--- INITIALIZING DATA (BADGE MODEL) ---");

        // Inizializziamo i badge di base
        Badge reserveAction = initBadge("ACTION_RESERVE_WORKSPACE", BadgeType.ACTION);
        Badge manageReservationsAction = initBadge("ACTION_MANAGE_RESERVATIONS", BadgeType.ACTION);
        Badge adminPanelAction = initBadge("ACTION_ADMIN_PANEL", BadgeType.ACTION);

        Badge userRole = initBadge(AuthoritiesConstants.USER, BadgeType.ROLE);
        Badge adminRole = initBadge(AuthoritiesConstants.ADMIN, BadgeType.ROLE);
        Badge buildmanRole = initBadge(AuthoritiesConstants.BUILDMAN, BadgeType.ROLE);

        // Gerarchia: ROLE_USER eredita l'azione di prenotazione
        if (userRole.getParentIds() == null || userRole.getParentIds().isEmpty()) {
            if(userRole.getParentIds() == null) userRole.setParentIds(new java.util.ArrayList<>());
            userRole.getParentIds().add(reserveAction.getId());
            badgeRepository.save(userRole);
        }

        // Gerarchia: ROLE_ADMIN eredita ROLE_USER + azioni amministrative
        if (adminRole.getParentIds() == null || adminRole.getParentIds().isEmpty()) {
            if(adminRole.getParentIds() == null) adminRole.setParentIds(new java.util.ArrayList<>());
            adminRole.getParentIds().add(userRole.getId());
            adminRole.getParentIds().add(manageReservationsAction.getId());
            adminRole.getParentIds().add(adminPanelAction.getId());
            badgeRepository.save(adminRole);
            System.out.println("DEBUG - Hierarchy created: ROLE_ADMIN inherits ROLE_USER and Admin Actions");
        }

        // Gerarchia: ROLE_BUILDMAN eredita ROLE_USER
        if (buildmanRole.getParentIds() == null || buildmanRole.getParentIds().isEmpty()) {
            if(buildmanRole.getParentIds() == null) buildmanRole.setParentIds(new java.util.ArrayList<>());
            buildmanRole.getParentIds().add(userRole.getId());
            badgeRepository.save(buildmanRole);
        }

        initDuration("Full Day", 540);
        initDuration("4 Hours", 240);
        initDuration("2 Hours", 120);
        initDuration("1 Hour", 60);
        initDuration("30 Minutes", 30);

        if (roomRepository.count() == 0) {
            createRoom("Meeting Room R1", RoomType.MEETING_ROOM, 10, 1);
            createRoom("Meeting Room R2", RoomType.MEETING_ROOM, 8, 1);

            for (int i = 1; i <= 32; i++) {
                createRoom("Area A" + i, RoomType.OPEN_SPACE, 10, 4);
            }
        }
    }

    private Badge initBadge(String name, BadgeType type) {
        return badgeRepository.findByName(name).orElseGet(() -> {
            Badge b = new Badge(name, type, true);
            return badgeRepository.save(b);
        });
    }

    private void initDuration(String name, Integer minutes) {
        if (!reservationDurationRepository.existsByName(name)) {
            reservationDurationRepository.save(new ReservationDuration(name, minutes, true));
        }
    }

    private void createRoom(String name, RoomType type, int capacity, int workspacesCount) {
        Room room = new Room();
        room.setName(name);
        room.setRoomType(type);
        room.setCapacity(capacity);
        room.setEnabled(true);
        room = roomRepository.save(room);

        for (int j = 1; j <= workspacesCount; j++) {
            Workspace w = new Workspace();
            w.setName("Workspace " + j + " (" + name + ")");
            w.setRoom(room);
            w.setEnabled(true);
            workspaceRepository.save(w);
        }
    }
}
