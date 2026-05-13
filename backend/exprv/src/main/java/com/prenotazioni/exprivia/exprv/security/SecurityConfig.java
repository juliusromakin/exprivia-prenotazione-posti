package com.prenotazioni.exprivia.exprv.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.prenotazioni.exprivia.exprv.security.jwt.JwtAuthFilter;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtAuthenticationEntryPoint;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Abilita l'uso di @PreAuthorize nei controller
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationEntryPoint authenticationEntryPoint, JwtAuthFilter jwtAuthFilter) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS (OPTIONS) - deve passare senza autenticazione
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // Endpoint Pubblici (Swagger e Auth)
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/configuration/ui",
                                "/configuration/security",
                                "/error",
                                "/error/**",
                                "/webjars/**")
                        .permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // Endpoint di gestione Sedi/Planimetrie protetti internamente da @PreAuthorize su singole azioni
                        .requestMatchers("/api/admin/buildings/**", "/api/admin/locations/**", "/api/admin/floors/**", "/api/admin/floor-plans/**").authenticated()
                        // Gestione Utenti e Ruoli riservata agli amministratori
                        .requestMatchers("/api/admin/**").hasAuthority(AuthoritiesConstants.ADMIN)
                        .requestMatchers("/api/prenotazioni/admin/**", "/api/reservation/admin/**")
                        .hasAuthority(AuthoritiesConstants.ADMIN)
                        .requestMatchers("/api/prenotazioni/export/**", "/api/reservation/export/**")
                        .hasAuthority(AuthoritiesConstants.ADMIN)

                        // Endpoint per utenti Autenticati (Mappatura Italiano + Inglese)
                        .requestMatchers("/api/user", "/api/user/**", "/api/utenti", "/api/utenti/**").authenticated()
                        .requestMatchers("/api/room", "/api/room/**", "/api/rooms", "/api/rooms/**", "/api/stanze", "/api/stanze/**").authenticated()
                        .requestMatchers("/api/workspace", "/api/workspace/**", "/api/workspaces", "/api/workspaces/**", "/api/postazioni", "/api/postazioni/**")
                        .authenticated()
                        .requestMatchers("/api/reservation/**", "/api/reservations/**", "/api/prenotazioni/**")
                        .authenticated()

                        // Altri endpoint specifici
                        .requestMatchers("/api/cose-durata/**", "/api/reservation-duration/**").authenticated()
                        .requestMatchers("/api/stats/**", "/api/statistics/**").authenticated()

                        // Qualsiasi altra richiesta deve essere autenticata
                        .anyRequest().authenticated());

        // Aggiunge il filtro JWT prima del filtro di autenticazione standard
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}