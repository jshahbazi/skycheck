export const onRequestPost = async ({ request }) => {
    return new Response(JSON.stringify({ request }));
//   // const { slug } = c.req.param()
//   const dataToSave = await request.json();

//   // const dataToSave = {
//   //     fileName: newFileName,
//   //     mimeType: mimeType,
//   //     exifData: exifData
//   //   };

//   // if (!author) return c.text("Missing author value for new comment")
//   // if (!body) return c.text("Missing body value for new comment")

//   // bucket text not null,
//   // path text not null,
//   // mimetype text not null,
//   // timestamp integer not null,
//   // camera text,
//   // shutterspeedvalue real,
//   // camerabearing real,
//   // digitalzoomratio real,
//   // exposuretime real,
//   // focallength real,
//   // focallength35mm real,
//   // gpsaltitude real,
//   // gpshpositioningerror real,
//   // gpsspeed real,
//   // gpsspeedref text,
//   // latitude real,
//   // longitude real,
//   // pixelheight integer,
//   // pixelwidth integer

//   // const dataToSave = {
//   //     fileName: newFileName,
//   //     bucket: process.env.REACT_APP_R2_BUCKET_NAME,
//   //     mimeType: mimeType,
//   //     exifData: exifData
//   //   };

//     try {
//         const { success } = await env.SKYCHECK_DB.prepare(
//             `
//       insert into images (bucket, path, mimetype, timestamp, camera, shutterspeedvalue, camerabearing, digitalzoomratio, exposuretime, focallength, 
//                           focallength35mm, gpsaltitude, gpshpositioningerror, gpsspeed, gpsspeedref, latitude, longitude, pixelheight, pixelwidth) values 
//                          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `
//         )
//             .bind(
//                 dataToSave.bucket,
//                 dataToSave.fileName,
//                 dataToSave.mimetype,
//                 dataToSave.exifData.timestamp,
//                 dataToSave.exifData.camera,
//                 dataToSave.exifData.shutterspeedvalue,
//                 dataToSave.exifData.camerabearing,
//                 dataToSave.exifData.digitalzoomratio,
//                 dataToSave.exifData.exposuretime,
//                 dataToSave.exifData.focallength,
//                 dataToSave.exifData.focallength35mm,
//                 dataToSave.exifData.gpsaltitude,
//                 dataToSave.exifData.gpshpositioningerror,
//                 dataToSave.exifData.gpsspeed,
//                 dataToSave.exifData.gpsspeedref,
//                 dataToSave.exifData.latitude,
//                 dataToSave.exifData.longitude,
//                 dataToSave.exifData.pixelheight,
//                 dataToSave.exifData.pixelwidth
//             )
//             .run();
//             return new Response(JSON.stringify({ success }));
//     } catch (error) {
//         return new Response(error.message, { status: 500 });
//     }
};
