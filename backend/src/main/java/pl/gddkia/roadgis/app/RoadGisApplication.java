package pl.gddkia.roadgis.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "pl.gddkia.roadgis")
public class RoadGisApplication {

  public static void main(String[] args) {
    SpringApplication.run(RoadGisApplication.class, args);
  }
}
