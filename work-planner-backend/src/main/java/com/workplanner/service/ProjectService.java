package com.workplanner.service;

import com.workplanner.dto.request.CreateProjectRequest;
import com.workplanner.dto.response.ProjectResponse;
import com.workplanner.entity.Project;
import com.workplanner.entity.User;
import com.workplanner.exception.ResourceNotFoundException;
import com.workplanner.repository.ProjectRepository;
import com.workplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAll() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest req, Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found: " + managerId));

        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .manager(manager)
                .build();

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, CreateProjectRequest req) {
        Project project = findOrThrow(id);
        project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        projectRepository.deleteById(id);
    }

    private Project findOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    public ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .managerId(p.getManager().getId())
                .managerName(p.getManager().getName())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
