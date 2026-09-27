-- Esquema de QuimicaLearn para Oracle Autonomous Database (Always Free).
-- Ejecútalo conectado como el usuario QUIMICALEARN en Database Actions > SQL.

CREATE TABLE ql_teachers (
  id          VARCHAR2(36)  PRIMARY KEY,
  name        VARCHAR2(100) NOT NULL,
  email       VARCHAR2(254) NOT NULL UNIQUE,
  pass_hash   VARCHAR2(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE TABLE ql_classes (
  id          VARCHAR2(36)  PRIMARY KEY,
  teacher_id  VARCHAR2(36)  NOT NULL REFERENCES ql_teachers(id) ON DELETE CASCADE,
  name        VARCHAR2(100) NOT NULL,
  grade       NUMBER(2)     NOT NULL CHECK (grade BETWEEN 6 AND 11),
  code        VARCHAR2(8)   NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX ql_classes_teacher_ix ON ql_classes(teacher_id);

CREATE TABLE ql_students (
  id          VARCHAR2(36)  PRIMARY KEY,
  class_id    VARCHAR2(36)  NOT NULL REFERENCES ql_classes(id) ON DELETE CASCADE,
  name        VARCHAR2(60)  NOT NULL,
  name_key    VARCHAR2(60)  NOT NULL,
  pin_hash    VARCHAR2(100) NOT NULL,
  xp          NUMBER(10)    DEFAULT 0 NOT NULL,
  days        VARCHAR2(4000) DEFAULT '[]' NOT NULL,
  last_active TIMESTAMP DEFAULT SYSTIMESTAMP,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ql_students_name_uk UNIQUE (class_id, name_key)
);

CREATE TABLE ql_progress (
  student_id  VARCHAR2(36) NOT NULL REFERENCES ql_students(id) ON DELETE CASCADE,
  lesson_id   VARCHAR2(20) NOT NULL,
  stars       NUMBER(1)    CHECK (stars BETWEEN 0 AND 3),
  act_done    NUMBER(1)    DEFAULT 0 NOT NULL,
  attempts    NUMBER(6)    DEFAULT 0 NOT NULL,
  updated_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ql_progress_pk PRIMARY KEY (student_id, lesson_id)
);
