drop table if exists images;
create table images (
  id integer primary key autoincrement,
  bucket text not null,
  path text not null,
  mimetype text not null,
  timestamp integer not null,
  camera text,
  shutterspeedvalue real,
  camerabearing real,
  digitalzoomratio real,
  exposuretime real,
  focallength real,
  focallength35mm real,
  gpsaltitude real,
  gpshpositioningerror real,
  gpsspeed real,
  gpsspeedref text,
  latitude real,
  longitude real,
  pixelheight integer,
  pixelwidth integer
);
create index idx_images_path on images (path);


