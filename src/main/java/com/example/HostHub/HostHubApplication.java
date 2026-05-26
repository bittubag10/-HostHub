package com.example.HostHub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HostHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(HostHubApplication.class, args);
	}

}
