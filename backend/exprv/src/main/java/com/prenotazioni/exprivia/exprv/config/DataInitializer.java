package com.prenotazioni.exprivia.exprv.config;

import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.enumerati.AppAuthority;
import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;
import com.prenotazioni.exprivia.exprv.enumerati.RoomType;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.repository.ReservationDurationRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
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

        log.info("--- STARTING HRBAC DATA INITIALIZATION ---");

        // 1. Inizializza tutti i Badge definiti nell'Enum
        Map<String, Badge> badgeMap = new HashMap<>();
        for (AppAuthority auth : AppAuthority.values()) {
            String name = auth.name();
            BadgeType type = name.startsWith("ROLE_") ? BadgeType.ROLE : BadgeType.ACTION;
            badgeMap.put(name, initBadge(name, type));
        }

        // 2. Costruzione Gerarchia Azioni: ANY eredita OWN
        log.info("Configuring Action Hierarchy (ANY -> OWN)...");
        for (AppAuthority auth : AppAuthority.values()) {
            String name = auth.name();
            if (name.endsWith("_ANY")) {
                String ownVersion = name.replace("_ANY", "_OWN");
                if (badgeMap.containsKey(ownVersion)) {
                    addParentLink(badgeMap.get(name), badgeMap.get(ownVersion));
                }
            }
        }

        // 3. Configurazione Ruoli Base
        log.info("Configuring Role Hierarchy...");
        Badge roleGuest = badgeMap.get(AppAuthority.ROLE_GUEST.name());
        Badge roleUser = badgeMap.get(AppAuthority.ROLE_USER.name());
        Badge roleHr = badgeMap.get(AppAuthority.ROLE_HR.name());
        Badge roleAdmin = badgeMap.get(AppAuthority.ROLE_ADMIN.name());

        // ROLE_GUEST: Solo visualizzazione
        addParentLink(roleGuest, badgeMap.get(AppAuthority.ACTION_DASHBOARD_VIEW.name()));

        // ROLE_USER: Eredita GUEST + Azioni OWN
        addParentLink(roleUser, roleGuest);
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_RESERVATION_CREATE_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_RESERVATION_READ_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_RESERVATION_UPDATE_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_RESERVATION_DELETE_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_USER_UPDATE_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_USER_DELETE_OWN.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_MEETINGROOM_BOOK.name()));
        addParentLink(roleUser, badgeMap.get(AppAuthority.ACTION_FLOORPLAN_READ.name()));

        // ROLE_HR: Eredita USER + Azioni ANY + EXPORT
        addParentLink(roleHr, roleUser);
        addParentLink(roleHr, badgeMap.get(AppAuthority.ACTION_RESERVATION_CREATE_ANY.name()));
        addParentLink(roleHr, badgeMap.get(AppAuthority.ACTION_RESERVATION_READ_ANY.name()));
        addParentLink(roleHr, badgeMap.get(AppAuthority.ACTION_RESERVATION_DELETE_ANY.name()));
        addParentLink(roleHr, badgeMap.get(AppAuthority.ACTION_RESERVATION_EXPORT.name()));

        // ROLE_ADMIN: Eredita HR + TUTTE le altre azioni (Superuser)
        addParentLink(roleAdmin, roleHr);

        log.info("Elevating ROLE_ADMIN to Superuser (all actions)...");
        for (Badge b : badgeMap.values()) {
            if (b.getType() == BadgeType.ACTION) {
                addParentLink(roleAdmin, b);
            }
        }

        // Salva le modifiche alla gerarchia
        badgeRepository.saveAll(badgeMap.values());

        // 4. Inizializzazione Durate e Stanze (Legacy)
        initDuration("Full Day", 540);
        initDuration("4 Hours", 240);
        initDuration("2 Hours", 120);
        initDuration("1 Hour", 60);
        initDuration("30 Minutes", 30);

        if (roomRepository.count() == 0) {
            createRoom("Meeting Room R1", RoomType.MEETING_ROOM, 10, 1);
            createRoom("Meeting Room R2", RoomType.MEETING_ROOM, 8, 1);

            for (int i = 1; i <= 5; i++) {
                createRoom("Area A" + i, RoomType.OPEN_SPACE, 10, 4);
            }
        }

        log.info("--- HRBAC DATA INITIALIZATION COMPLETED ---");
    }

    private Badge initBadge(String name, BadgeType type) {
        return badgeRepository.findByName(name).orElseGet(() -> {
            Badge b = new Badge(name, type, true);
            b.setParentIds(new ArrayList<>());
            return badgeRepository.save(b);
        });
    }

    private void addParentLink(Badge child, Badge parent) {
        if (child == null || parent == null)
            return;
        if (child.getParentIds() == null) {
            child.setParentIds(new ArrayList<>());
        }
        if (!child.getParentIds().contains(parent.getId())) {
            child.getParentIds().add(parent.getId());
            log.debug("Link created: {} -> inherits -> {}", child.getName(), parent.getName());
        }
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
