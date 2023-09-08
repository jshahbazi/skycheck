export const onRequestPost = async ({ request, env, ctx }) => {
  const dataToSave = await request.json();

  let result = null;
  result = await env.SKYCHECK_DB.prepare(
    `insert into images (hash, filelocation, bucket, mimetype, timestamp, camera, shutterspeedvalue, camerabearing, digitalzoomratio, exposuretime, focallength, 
      focallength35mm, gpsaltitude, gpshpositioningerror, gpsspeed, gpsspeedref, latitude, longitude, pixelheight, pixelwidth) values 
     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      dataToSave.imageHash,
      dataToSave.fileLocation,
      dataToSave.bucket,      
      dataToSave.mimeType,
      dataToSave.exifData.Timestamp,
      dataToSave.exifData.Camera,
      dataToSave.exifData.ShutterSpeedValue,
      dataToSave.exifData.CameraBearing,
      dataToSave.exifData.DigitalZoomRatio,
      dataToSave.exifData.ExposureTime,
      dataToSave.exifData.FocalLength,
      dataToSave.exifData.FocalLength35mm,
      dataToSave.exifData.GPSAltitude,
      dataToSave.exifData.GPSHPositioningError,
      dataToSave.exifData.GPSSpeed,
      dataToSave.exifData.GPSSpeedRef,
      dataToSave.exifData.Latitude,
      dataToSave.exifData.Longitude,
      dataToSave.exifData.PixelHeight,
      dataToSave.exifData.PixelWidth
    )
    .run();
  
  
  if (result.changes !== 1) {
    // return new Response(`Failed to insert image ${dataToSave.imageHash} into database`);
    return Response(JSON.stringify({ result }));
  }
  else {
    return new Response(JSON.stringify({ result }));
  }
};
