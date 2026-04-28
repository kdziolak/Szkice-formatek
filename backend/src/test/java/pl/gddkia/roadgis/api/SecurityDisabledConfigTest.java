package pl.gddkia.roadgis.api;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import pl.gddkia.roadgis.application.RoadInfraService;
import pl.gddkia.roadgis.config.SecurityConfig;

@SpringJUnitConfig
@WebAppConfiguration
@ContextConfiguration(classes = {SecurityConfig.class, SecurityDisabledConfigTest.MvcTestConfig.class})
@TestPropertySource(properties = {
    "roadgis.security.enabled=false",
    "roadgis.cors.allowed-origins=http://localhost:4200"
})
class SecurityDisabledConfigTest {

  @Autowired
  private WebApplicationContext context;

  @Autowired
  private RoadInfraService service;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    reset(service);
    mockMvc = MockMvcBuilders.webAppContextSetup(context)
        .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
        .build();
  }

  @Test
  void allowsHealthWithoutTokenWhenSecurityIsDisabled() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk());
  }

  @Test
  void allowsApiGetWithoutTokenWhenSecurityIsDisabled() throws Exception {
    when(service.listRoads()).thenReturn(List.of());

    mockMvc.perform(get("/api/roads"))
        .andExpect(status().isOk());
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
  }
}
