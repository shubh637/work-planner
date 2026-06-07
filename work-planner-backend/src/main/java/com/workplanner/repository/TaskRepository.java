package com.workplanner.repository;

import com.workplanner.entity.Task;
import com.workplanner.entity.Task.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            SELECT DISTINCT t FROM Task t
            JOIN FETCH t.project
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.suggestedBy
            WHERE (:projectId  IS NULL OR t.project.id    = :projectId)
              AND (:assignedTo IS NULL OR t.assignedTo.id = :assignedTo)
              AND (:status     IS NULL OR t.status        = :status)
              AND (:dueDate    IS NULL OR t.dueDate       = :dueDate)
            ORDER BY t.createdAt DESC
            """)
    List<Task> findFiltered(
            @Param("projectId")  Long projectId,
            @Param("assignedTo") Long assignedTo,
            @Param("status")     TaskStatus status,
            @Param("dueDate")    LocalDate dueDate
    );

    @Query("""
            SELECT DISTINCT t FROM Task t
            JOIN FETCH t.project
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.suggestedBy
            WHERE t.assignedTo.id = :userId AND t.status IN :statuses
            ORDER BY t.createdAt DESC
            """)
    List<Task> findByAssignedToIdAndStatusIn(
            @Param("userId") Long userId,
            @Param("statuses") List<TaskStatus> statuses
    );

    @Query("""
            SELECT DISTINCT t FROM Task t
            JOIN FETCH t.project
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.suggestedBy
            WHERE t.status = :status
            ORDER BY t.createdAt DESC
            """)
    List<Task> findByStatus(@Param("status") TaskStatus status);

    @Query("""
            SELECT DISTINCT t FROM Task t
            JOIN FETCH t.project
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.suggestedBy
            WHERE t.assignedTo.id = :userId
            ORDER BY t.createdAt DESC
            """)
    List<Task> findByAssignedToId(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT t FROM Task t
            JOIN FETCH t.project
            JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.assignedTo
            LEFT JOIN FETCH t.suggestedBy
            WHERE t.suggestedBy.id = :userId
            ORDER BY t.createdAt DESC
            """)
    List<Task> findBySuggestedById(@Param("userId") Long userId);

    @Query("""
            SELECT t.status AS status, COUNT(t) AS count
            FROM Task t
            WHERE (:projectId IS NULL OR t.project.id = :projectId)
            GROUP BY t.status
            """)
    List<Object[]> countByStatus(@Param("projectId") Long projectId);

    @Query("""
            SELECT t.project.id AS projectId, t.project.name AS projectName, COUNT(t) AS count
            FROM Task t
            GROUP BY t.project.id, t.project.name
            """)
    List<Object[]> countByProject();

    @Query("""
            SELECT t.assignedTo.id AS userId, t.assignedTo.name AS userName,
                   t.status AS status, COUNT(t) AS count
            FROM Task t
            WHERE t.assignedTo IS NOT NULL
            GROUP BY t.assignedTo.id, t.assignedTo.name, t.status
            """)
    List<Object[]> countByMemberAndStatus();
}
