package pl.gddkia.roadgis.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import pl.gddkia.roadgis.config.RoadgisSecurityProperties;

class OperatorContextTest {

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void returnsFallbackWhenSecurityIsDisabled() {
    OperatorContext context = new OperatorContext(new RoadgisSecurityProperties(false, "roles", "preferred_username"));

    assertThat(context.currentOperatorOr("client.operator")).isEqualTo("client.operator");
  }

  @Test
  void readsPreferredUsernameFromJwtWhenSecurityIsEnabled() {
    OperatorContext context = new OperatorContext(new RoadgisSecurityProperties(true, "roles", "preferred_username"));
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt("jwt.operator", "sub-1")));

    assertThat(context.currentOperatorOr("client.operator")).isEqualTo("jwt.operator");
  }

  @Test
  void fallsBackToSubjectWhenPreferredUsernameIsMissing() {
    OperatorContext context = new OperatorContext(new RoadgisSecurityProperties(true, "roles", "preferred_username"));
    Jwt jwt = Jwt.withTokenValue("token")
        .header("alg", "none")
        .subject("subject.operator")
        .claim("roles", List.of("ROADGIS_EDITOR"))
        .build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

    assertThat(context.currentOperatorOr("client.operator")).isEqualTo("subject.operator");
  }

  private Jwt jwt(String preferredUsername, String subject) {
    return Jwt.withTokenValue("token")
        .header("alg", "none")
        .subject(subject)
        .claim("preferred_username", preferredUsername)
        .claim("roles", List.of("ROADGIS_EDITOR"))
        .build();
  }
}
