package com.prenotazioni.exprivia.exprv.config;

import com.prenotazioni.exprivia.exprv.entity.CosaDurata;
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.Postazioni;
import com.prenotazioni.exprivia.exprv.entity.Stanze;
import com.prenotazioni.exprivia.exprv.entity.StatoPostazione;
import com.prenotazioni.exprivia.exprv.enumerati.tipo_stanza;
import com.prenotazioni.exprivia.exprv.repository.AuthorityRepository;
import com.prenotazioni.exprivia.exprv.repository.CosaDurataRepository;
import com.prenotazioni.exprivia.exprv.repository.PostazioniRepository;
import com.prenotazioni.exprivia.exprv.repository.StanzeRepository;
import com.prenotazioni.exprivia.exprv.repository.StatoPostazioneRepository;
import com.prenotazioni.exprivia.exprv.security.AuthoritiesConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AuthorityRepository authorityRepository;
    private final StatoPostazioneRepository statoPostazioneRepository;
    private final StanzeRepository stanzeRepository;
    private final PostazioniRepository postazioniRepository;
    private final CosaDurataRepository cosaDurataRepository;

    @Value("${app.init-data:false}")
    private boolean initData;

    public DataInitializer(AuthorityRepository authorityRepository,
                           StatoPostazioneRepository statoPostazioneRepository,
                           StanzeRepository stanzeRepository,
                           PostazioniRepository postazioniRepository,
                           CosaDurataRepository cosaDurataRepository) {
        this.authorityRepository = authorityRepository;
        this.statoPostazioneRepository = statoPostazioneRepository;
        this.stanzeRepository = stanzeRepository;
        this.postazioniRepository = postazioniRepository;
        this.cosaDurataRepository = cosaDurataRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!initData) {
            return;
        }

        System.out.println("--- INIZIALIZZAZIONE DATI ---");

        initRole(AuthoritiesConstants.USER);
        initRole(AuthoritiesConstants.ADMIN);

        StatoPostazione disponibile = initStato("Disponibile");
        initStato("Occupato");
        initStato("Manutenzione");

        initDurata("Giornata Intera");
        initDurata("4 ore");
        initDurata("2 ore");
        initDurata("1 ora");
        initDurata("30 minuti");

        if (stanzeRepository.count() == 0) {
            createRoom("Riunioni R1", tipo_stanza.MeetingRoom, 10, 1, disponibile);
            createRoom("Riunioni R2", tipo_stanza.MeetingRoom, 8, 1, disponibile);

            for (int i = 1; i <= 32; i++) {
                createRoom("A" + i, tipo_stanza.OpenSpace, 10, 4, disponibile);
            }
        }
    }

    private void initRole(String name) {
        if (authorityRepository.findById(name).isEmpty()) {
            Authority a = new Authority();
            a.setName(name);
            authorityRepository.save(a);
        }
    }

    private StatoPostazione initStato(String name) {
        return statoPostazioneRepository.findById(name)
                .orElseGet(() -> statoPostazioneRepository.save(new StatoPostazione(name)));
    }

    private void initDurata(String name) {
        if (!cosaDurataRepository.existsById(name)) {
            cosaDurataRepository.save(new CosaDurata(name));
        }
    }

    private void createRoom(String nome, tipo_stanza tipo, int cap, int posts, StatoPostazione s) {
        Stanze stanza = new Stanze();
        stanza.setNome(nome);
        stanza.setTipo_stanza(tipo);
        stanza.setCapacita_stanza(cap);
        stanza = stanzeRepository.save(stanza);

        for (int j = 1; j <= posts; j++) {
            Postazioni p = new Postazioni();
            p.setNomePostazione("Postazione " + j);
            p.setStanze(stanza);
            p.setStatoPostazione(s);
            postazioniRepository.save(p);
        }
    }
}
