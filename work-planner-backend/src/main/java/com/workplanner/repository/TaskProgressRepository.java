package com.workplanner.repository;

import com.workplanner.entity.TaskProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskProgressRepository extends JpaRepository<TaskProgress, Long> {

    @Query("""
            SELECT tp FROM TaskProgress tp
            JOIN FETCH tp.task
            JOIN FETCH tp.changedBy
            WHERE tp.task.id = :taskId
            ORDER BY tp.changedAt ASC
            """)
    List<TaskProgress> findByTaskIdOrderByChangedAtAsc(@Param("taskId") Long taskId);
}
