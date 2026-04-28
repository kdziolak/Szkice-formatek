package pl.gddkia.roadgis.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "roadgis.security")
public record RoadgisSecurityProperties(
    boolean enabled,
    String rolesClaim,
    String principalClaim
) {

  public RoadgisSecurityProperties {
    rolesClaim = defaultValue(rolesClaim, "roles");
    principalClaim = defaultValue(principalClaim, "preferred_username");
  }

  private static String defaultValue(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }
}
