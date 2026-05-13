package com.workplanner.service;

import com.workplanner.dto.response.ReportSummaryResponse;
import com.workplanner.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TaskRepository taskRepository;

    public List<ReportSummaryResponse> tasksByStatus(Long projectId) {
        List<Object[]> rows = taskRepository.countByStatus(projectId);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            counts.put(row[0].toString(), ((Number) row[1]).longValue());
        }
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return List.of(ReportSummaryResponse.builder()
                .label("Tasks by Status")
                .counts(counts)
                .total(total)
                .build());
    }

    public List<ReportSummaryResponse> tasksByProject() {
        List<Object[]> rows = taskRepository.countByProject();
        List<ReportSummaryResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            String projectName = row[1].toString();
            long count = ((Number) row[2]).longValue();
            result.add(ReportSummaryResponse.builder()
                    .label(projectName)
                    .counts(Map.of("total", count))
                    .total(count)
                    .build());
        }
        return result;
    }

    public List<ReportSummaryResponse> tasksByMember() {
        List<Object[]> rows = taskRepository.countByMemberAndStatus();
        Map<String, Map<String, Long>> memberMap = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String memberName = row[1].toString();
            String status = row[2].toString();
            long count = ((Number) row[3]).longValue();
            memberMap.computeIfAbsent(memberName, k -> new LinkedHashMap<>())
                    .put(status, count);
        }

        List<ReportSummaryResponse> result = new ArrayList<>();
        memberMap.forEach((member, counts) -> {
            long total = counts.values().stream().mapToLong(Long::longValue).sum();
            result.add(ReportSummaryResponse.builder()
                    .label(member)
                    .counts(counts)
                    .total(total)
                    .build());
        });
        return result;
    }
}
