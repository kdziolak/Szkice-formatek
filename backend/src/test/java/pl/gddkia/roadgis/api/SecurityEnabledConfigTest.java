package pl.gddkia.roadgis.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceDto;
import pl.gddkia.roadgis.api.RoadInfraDtos.WorkspaceRequest;
import pl.gddkia.roadgis.application.RoadInfraService;
import pl.gddkia.roadgis.config.SecurityConfig;

@SpringJUnitConfig
@WebAppConfiguration
@ContextConfiguration(classes = {SecurityConfig.class, SecurityEnabledConfigTest.MvcTestConfig.class})
@TestPropertySource(properties = {
    "roadgis.security.enabled=true",
    "roadgis.security.roles-claim=roles",
    "roadgis.security.principal-claim=preferred_username",
    "roadgis.cors.allowed-origins=http://localhost:4200"
})
class SecurityEnabledConfigTest {

  @Autowired
  private WebApplicationContext context;

  @Autowired
  private RoadInfraService service;

  @Autowired
  private JwtDecoder jwtDecoder;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    reset(service, jwtDecoder);
    mockMvc = MockMvcBuilders.webAppContextSetup(context)
        .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
        .build();
  }

  @Test
  void allowsHealthWithoutTokenWhenSecurityIsEnabled() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk());
  }

  @Test
  void rejectsApiGetWithoutTokenWhenSecurityIsEnabled() throws Exception {
    mockMvc.perform(get("/api/roads"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void allowsApiGetWithViewerRole() throws Exception {
    when(jwtDecoder.decode("viewer-token")).thenReturn(jwt("viewer-token", "viewer.user", "ROADGIS_VIEWER"));
    when(service.listRoads()).thenReturn(List.of());

    mockMvc.perform(get("/api/roads")
            .header(HttpHeaders.AUTHORIZATION, "Bearer viewer-token"))
        .andExpect(status().isOk());
  }

  @Test
  void rejectsWorkspaceWriteWithViewerRole() throws Exception {
    when(jwtDecoder.decode("viewer-token")).thenReturn(jwt("viewer-token", "viewer.user", "ROADGIS_VIEWER"));

    mockMvc.perform(post("/api/workspaces")
            .header(HttpHeaders.AUTHORIZATION, "Bearer viewer-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Roboczy\",\"createdBy\":\"client\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void allowsWorkspaceWriteWithEditorRole() throws Exception {
    when(jwtDecoder.decode("editor-token")).thenReturn(jwt("editor-token", "editor.user", "ROLE_ROADGIS_EDITOR"));
    WorkspaceDto workspace = new WorkspaceDto(
        UUID.randomUUID(),
        "Roboczy",
        "editor.user",
        "AKTYWNY",
        Instant.parse("2026-01-01T00:00:00Z"),
        null,
        null,
        0,
        0);
    when(service.createWorkspace(any(WorkspaceRequest.class))).thenReturn(workspace);

    mockMvc.perform(post("/api/workspaces")
            .header(HttpHeaders.AUTHORIZATION, "Bearer editor-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Roboczy\",\"createdBy\":\"client\"}"))
        .andExpect(status().isOk());
  }

  private Jwt jwt(String token, String preferredUsername, String role) {
    return Jwt.withTokenValue(token)
        .header("alg", "none")
        .subject(preferredUsername + "-sub")
        .claim("preferred_username", preferredUsername)
        .claim("roles", List.of(role))
        .build();
  }

  @Configuration
  @EnableWebMvc
  static class MvcTestConfig {

    @Bean
    RoadInfraService roadInfraService() {
      return mock(RoadInfraService.class);
    }

    @Bean
    JwtDecoder jwtDecoder() {
      return mock(JwtDecoder.class);
    }

    @Bean
    SystemController systemController() {
      return new SystemController();
    }

    @Bean
    RoadReferenceController roadReferenceController(RoadInfraService service) {
      return new RoadReferenceController(service);
    }

    @Bean
    WorkspaceController workspaceController(RoadInfraService service) {
      return new WorkspaceController(service);
    }
  }
}
