package com.workplanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class WorkPlannerApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkPlannerApplication.class, args);
    }
}
