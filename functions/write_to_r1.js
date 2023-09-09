export const onRequestPost = async ({ request, env, ctx }) => {
  const dataToSave = await request.json();

  // {
  //   results: array | null, // [] if empty, or null if it doesn't apply
  //   success: boolean, // true if the operation was successful, false otherwise
  //   meta: {
  //     duration: number, // duration of the operation in milliseconds
  //     rows_read: number, // the number of rows read (scanned) by this query
  //     rows_written: number // the number of rows written by this query
  //   }
  // }

  try {
    const stmt = await env.SKYCHECK_DB.prepare(
      `insert into images (hash, file_location, bucket, mime_type, timestamp, camera, shutter_speed_value, camera_bearing, digital_zoom_ratio, exposure_time, focal_length, 
        focal_length_35mm, gps_altitude, gps_h_positioning_error, gps_speed, gps_speed_ref, latitude, longitude, pixel_height, pixel_width) values 
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
    
      const { success } = await stmt.all();
      if (success) {
        return new Response(dataToSave.fileLocation, { status: 200 });
      } else {
        return new Response(`Failed to insert image ${dataToSave.imageHash} into database`, { status: 500 });
      }

  } catch (e) {
    // Error: "D1_ERROR: Error: UNIQUE constraint failed: images.hash"
    if (e.message.includes("UNIQUE constraint failed")) {
      const stmt = await env.SKYCHECK_DB.prepare("SELECT file_location FROM images WHERE hash = ?").bind(dataToSave.imageHash);
      const { results } = await stmt.all();
      return new Response(results[0].file_location, { status: 200 });
    } else {
      return new Response(`Failed to insert image ${dataToSave.imageHash} into database`);
    }
  }

  if (result.changes !== 1) {
    // return new Response(`Failed to insert image ${dataToSave.imageHash} into database`);
    return Response(JSON.stringify({ result }));
  } else {
    return new Response(JSON.stringify({ result }));
  }
};
