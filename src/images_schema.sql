drop table if exists images;
create table images (
  hash text primary key,
  filelocation text not null,
  bucket text not null,
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