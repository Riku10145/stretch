"use client";

import { useEffect, useRef } from "react";

interface ExerciseListProps {
  exercises: string[];
  currentSet: number;
}

export function ExerciseList({ exercises, currentSet }: ExerciseListProps) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentSet]);

  return (
    <section className="list-section">
      <ul className="exercise-list">
        {exercises.map((text, index) => {
          const isActive = index === currentSet;
          return (
            <li
              key={index}
              ref={isActive ? activeRef : undefined}
              className={`exercise-item${isActive ? " is-active" : ""}`}
            >
              <span>
                {index + 1}. {text}
              </span>
              {isActive && <span className="badge">Now</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
