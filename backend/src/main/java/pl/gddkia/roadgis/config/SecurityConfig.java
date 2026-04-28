package pl.gddkia.roadgis.config;

import java.util.Collection;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(RoadgisSecurityProperties.class)
public class SecurityConfig {

  private static final List<String> PUBLIC_ENDPOINTS = List.of(
      "/api/health",
      "/actuator/health",
      "/v3/api-docs/**",
      "/swagger-ui/**",
      "/swagger-ui.html"
  );

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, RoadgisSecurityProperties properties) throws Exception {
    http.cors(Customizer.withDefaults())
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

    if (!properties.enabled()) {
      http.authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll());
      return http.build();
    }

    http.authorizeHttpRequests(authorize -> authorize
            .requestMatchers(PUBLIC_ENDPOINTS.toArray(String[]::new)).permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole("ROADGIS_VIEWER", "ROADGIS_EDITOR")
            .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ROADGIS_EDITOR")
            .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ROADGIS_EDITOR")
            .requestMatchers(HttpMethod.PATCH, "/api/**").hasRole("ROADGIS_EDITOR")
            .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ROADGIS_EDITOR")
            .anyRequest().authenticated())
        .oauth2ResourceServer(resourceServer -> resourceServer.jwt(
            jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter(properties))));

    return http.build();
  }

  private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter(
      RoadgisSecurityProperties properties
  ) {
    return jwt -> new JwtAuthenticationToken(jwt, authorities(jwt, properties.rolesClaim()), principalName(jwt, properties));
  }

  private Collection<GrantedAuthority> authorities(Jwt jwt, String rolesClaim) {
    Object claim = jwt.getClaims().get(rolesClaim);
    if (claim instanceof Collection<?> roles) {
      return roles.stream()
          .filter(String.class::isInstance)
          .map(String.class::cast)
          .filter(role -> !role.isBlank())
          .map(this::authorityName)
          .map(SimpleGrantedAuthority::new)
          .map(GrantedAuthority.class::cast)
          .toList();
    }
    if (claim instanceof String role && !role.isBlank()) {
      return List.of(new SimpleGrantedAuthority(authorityName(role)));
    }
    return List.of();
  }

  private String authorityName(String role) {
    String trimmed = role.trim();
    return trimmed.startsWith("ROLE_") ? trimmed : "ROLE_" + trimmed;
  }

  private String principalName(Jwt jwt, RoadgisSecurityProperties properties) {
    String configuredClaim = jwt.getClaimAsString(properties.principalClaim());
    if (configuredClaim != null && !configuredClaim.isBlank()) {
      return configuredClaim;
    }
    String preferredUsername = jwt.getClaimAsString("preferred_username");
    if (preferredUsername != null && !preferredUsername.isBlank()) {
      return preferredUsername;
    }
    return jwt.getSubject();
  }
}
