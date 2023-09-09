drop table if exists images;
create table images (
  hash text primary key,
  bucket text not null,  
  file_path text not null,
  mime_type text not null,
  timestamp integer not null,
  camera text,
  shutter_speed_value real,
  camera_bearing real,
  digital_zoom_ratio real,
  exposure_time real,
  focal_length real,
  focal_length_35mm real,
  gps_altitude real,
  gps_h_positioning_error real,
  gps_speed real,
  gps_speed_ref text,
  latitude real,
  longitude real,
  pixel_height integer,
  pixel_width integer
);