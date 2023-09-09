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
    const result = await env.SKYCHECK_DB.prepare(
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
    
      // {
      //   results: [],
      //   success: true,
      //   meta: {
      //     served_by: 'v3-prod',
      //     duration: 0.23815499991178513,
      //     changes: 1,
      //     last_row_id: 2,
      //     changed_db: true,
      //     size_after: 20480,
      //     rows_read: 0,
      //     rows_written: 2
      //   }
      // }
    
    console.log("result1: ", JSON.stringify(result));

    let response = null;
    if (result.meta.changes !== 1) {
      response = new Response(`Failed to insert image ${dataToSave.imageHash} into database`, { status: 500 });
    } else {
      response = new Response(dataToSave.fileLocation, { status: 200 });
    }
    return response;



      // if (success) {
      //   return new Response(dataToSave.fileLocation, { status: 200 });
      // } else {
      //   return new Response(`Failed to insert image ${dataToSave.imageHash} into database`, { status: 500 });
      // }

  } catch (e) {
    // Error: "D1_ERROR: Error: UNIQUE constraint failed: images.hash"
    if (e.message.includes("UNIQUE constraint failed")) {
      const result = await env.SKYCHECK_DB.prepare("SELECT file_location FROM images WHERE hash = ?").bind(dataToSave.imageHash).run();
      // const { results } = await stmt.all();
      console.log("result2: ", JSON.stringify(result));
      // {
      //   results: [
      //     {
      //       file_location: 'skycheck-images/87b89cd3-8736-417d-ad92-455b4ad6fddd.jpg'
      //     }
      //   ],
      //   success: true,
      //   meta: {
      //     served_by: 'v3-prod',
      //     duration: 0.1750039979815483,
      //     changes: 0,
      //     last_row_id: 0,
      //     changed_db: false,
      //     size_after: 20480,
      //     rows_read: 1,
      //     rows_written: 0
      //   }
      // }
      let response = null;
      if (result.meta.rows_read === 0) {
        response = new Response(`Failed to get file_location for ${dataToSave.imageHash}: ` + JSON.stringify(result), { status: 500 });
      } else {
        response = new Response(result.results.file_location, { status: 200 });
      }
      return response;      
    } else {
      return new Response(e.message, { status: 500 });
    }
  }

  if (result.changes !== 1) {
    // return new Response(`Failed to insert image ${dataToSave.imageHash} into database`);
    return Response(JSON.stringify({ result }));
  } else {
    return new Response(JSON.stringify({ result }));
  }
};
