export const onRequestPost = async ({ request, context }) => {
  const dataToSave = await request.json();
  // return new Response(JSON.stringify({ dataToSave }));

  try {
 

    const success = await context.env.SKYCHECK_DB.prepare(
      `insert into images (bucket, path, mimetype, timestamp, camera, shutterspeedvalue, camerabearing, digitalzoomratio, exposuretime, focallength, 
      focallength35mm, gpsaltitude, gpshpositioningerror, gpsspeed, gpsspeedref, latitude, longitude, pixelheight, pixelwidth) values 
     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        dataToSave.bucket,
        dataToSave.fileName,
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

    // console.log("success: ", success);

    return new Response(JSON.stringify({ success }));
  } catch (error) {
    let message = error.message + "\n" + error.stack + "\n" + success;
    return new Response(error.message, { status: 500 });
  }
};
