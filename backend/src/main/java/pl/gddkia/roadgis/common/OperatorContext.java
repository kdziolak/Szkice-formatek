package pl.gddkia.roadgis.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import pl.gddkia.roadgis.config.RoadgisSecurityProperties;

@Component
public class OperatorContext {

  private final RoadgisSecurityProperties properties;

  public OperatorContext(RoadgisSecurityProperties properties) {
    this.properties = properties;
  }

  public String currentOperatorOr(String fallback) {
    if (!properties.enabled()) {
      return nonBlank(fallback, "system");
    }
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
      return principalFrom(jwtAuthentication.getToken(), fallback);
    }
    if (authentication != null && authentication.isAuthenticated()) {
      return nonBlank(authentication.getName(), fallback);
    }
    return nonBlank(fallback, "system");
  }

  private String principalFrom(Jwt jwt, String fallback) {
    String configuredClaim = jwt.getClaimAsString(properties.principalClaim());
    if (configuredClaim != null && !configuredClaim.isBlank()) {
      return configuredClaim;
    }
    String preferredUsername = jwt.getClaimAsString("preferred_username");
    if (preferredUsername != null && !preferredUsername.isBlank()) {
      return preferredUsername;
    }
    return nonBlank(jwt.getSubject(), fallback);
  }

  private String nonBlank(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }
}
