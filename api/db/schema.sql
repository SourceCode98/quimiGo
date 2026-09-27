-- Esquema de QuimicaLearn para PostgreSQL. La API lo ejecuta sola al arrancar (es idempotente).
CREATE TABLE IF NOT EXISTS ql_teachers (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(254) NOT NULL UNIQUE,
  pass_hash   VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ql_classes (
  id          VARCHAR(36)  PRIMARY KEY,
  teacher_id  VARCHAR(36)  NOT NULL REFERENCES ql_teachers(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  grade       SMALLINT     NOT NULL CHECK (grade BETWEEN 6 AND 11),
  code        VARCHAR(8)   NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ql_classes_teacher_ix ON ql_classes(teacher_id);

CREATE TABLE IF NOT EXISTS ql_students (
  id          VARCHAR(36)  PRIMARY KEY,
  class_id    VARCHAR(36)  NOT NULL REFERENCES ql_classes(id) ON DELETE CASCADE,
  name        VARCHAR(60)  NOT NULL,
  name_key    VARCHAR(60)  NOT NULL,
  pin_hash    VARCHAR(100) NOT NULL,
  xp          INTEGER      NOT NULL DEFAULT 0,
  days        JSONB        NOT NULL DEFAULT '[]',
  last_active TIMESTAMPTZ  DEFAULT now(),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ql_students_name_uk UNIQUE (class_id, name_key)
);

CREATE TABLE IF NOT EXISTS ql_progress (
  student_id  VARCHAR(36) NOT NULL REFERENCES ql_students(id) ON DELETE CASCADE,
  lesson_id   VARCHAR(20) NOT NULL,
  stars       SMALLINT    CHECK (stars BETWEEN 0 AND 3),
  act_done    BOOLEAN     NOT NULL DEFAULT false,
  attempts    INTEGER     NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, lesson_id)
);
