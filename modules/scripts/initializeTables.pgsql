CREATE TABLE IF NOT EXISTS cccif (
  unid bigint NOT NULL,
  date_of_birth date,
  sex text,
  first_name_en text,
  second_name_en text,
  first_name_th text,
  second_name_th text,
  nationality text,
  origin_country text,
  passport text,
  pink_card text,
  thai text,
  home json,
  work json,
  employer json,
  session_id bigint NOT NULL,
  reason_for_no_portrait text,
  reason_for_no_finger text,
  is_admin boolean NOT NULL DEFAULT false,
  is_operator boolean NOT NULL DEFAULT false,
  CONSTRAINT cccif_pkey PRIMARY KEY (unid)
);

CREATE TABLE IF NOT EXISTS client (
  id integer NOT NULL DEFAULT ((((900000)::double precision * random()) + (100000)::double precision))::integer,
  name text NOT NULL,
  orgid integer NOT NULL,
  version text ,
  cache_size bigint NOT NULL DEFAULT 0,
  secure_key text,
  active_count bigint NOT NULL DEFAULT 0,
  active_date timestamp without time zone NOT NULL DEFAULT now(),
  active_unid bigint,
  active_location point,
  install_unid bigint,
  install_date timestamp without time zone,
  install_location point,
  expire_date timestamp without time zone,
  is_active boolean NOT NULL DEFAULT true,
  is_cache boolean NOT NULL DEFAULT false,
  is_debug boolean NOT NULL DEFAULT false,
  is_face boolean NOT NULL DEFAULT false,
  is_finger boolean NOT NULL DEFAULT false,
  is_iris boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_lotto boolean NOT NULL DEFAULT false,
  is_print boolean NOT NULL DEFAULT false,
  is_secure boolean NOT NULL DEFAULT false,
  is_update boolean NOT NULL DEFAULT false,
  is_online boolean NOT NULL DEFAULT false,
  CONSTRAINT client_pkey1 PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS subject (
  unid bigint NOT NULL,
  session_id bigint NOT NULL,
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT subject_pkey PRIMARY KEY (unid)
);

CREATE TABLE IF NOT EXISTS face (
  unid bigint NOT NULL,
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  template bytea,
  CONSTRAINT face_pkey PRIMARY KEY (unid)
);

CREATE TABLE IF NOT EXISTS iris (
  unid bigint NOT NULL,
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  template bytea,
  CONSTRAINT iris_pkey PRIMARY KEY (unid)
);


CREATE TABLE IF NOT EXISTS finger (
  unid bigint NOT NULL,
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  left_template bytea,
  right_template bytea,
  CONSTRAINT finger_pkey PRIMARY KEY (unid)
);

CREATE TABLE IF NOT EXISTS photo (
  photo_id bigserial PRIMARY KEY,
  unid bigint NOT NULL references subject(unid),
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  image_type text,
  image bytea
);

CREATE TABLE IF NOT EXISTS session (
  id bigint NOT NULL DEFAULT ((((900000)::double precision * random()) + (100000)::double precision))::integer,
  unid bigint NOT NULL references subject(unid),
  geolocation text NOT NULL,
  device_info json NOT NULL,
  ip text NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS clientpin (
  id bigint NOT NULL DEFAULT ((((900000)::double precision * random()) + (100000)::double precision))::integer,
  pin bigint NOT NULL DEFAULT ((((900000)::double precision * random()) + (100000)::double precision))::integer,
  create_date timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT clientpin_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS licenses (
  license_id bigserial PRIMARY KEY,
  client_id bigint NOT NULL references client(id),
  type varchar(50) NOT NULL,
  content text NOT NULL 
);

CREATE TABLE IF NOT EXISTS session_activity(
  activity_id bigserial PRIMARY KEY,
  session_id bigint references session(id),
  type varchar(50) NOT NULL,
  create_date timestamp NOT NULL,
  info json
);