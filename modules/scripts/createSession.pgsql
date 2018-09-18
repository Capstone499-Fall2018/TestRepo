CREATE TABLE session (
  id bigint NOT NULL,
  geolocation text NOT NULL,
  deviceInfo json NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (id)
);