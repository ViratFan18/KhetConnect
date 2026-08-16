package khetconnect.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class OpenAPIConfiguration {

    @Value("${spring.application.name:KhetConnect}")
    private String applicationName;

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("KhetConnect API")
                        .version("1.0.0")
                        .description("Hyperlocal mobile-first web application connecting farmers with skilled agricultural labourers within a 5 km radius.")
                        .contact(new Contact()
                                .name("KhetConnect Team")
                                .url("https://khetconnect.com")
                                .email("support@khetconnect.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(Arrays.asList(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.khetconnect.com")
                                .description("Production Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token")
                ));
    }
}
