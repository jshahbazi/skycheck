import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios';
import { S3Client } from '@aws-sdk/client-s3'


// // GET requests to /filename would return "Hello, world!"
// export const onRequestGet = () => {
//   return new Response("Hello, world!")
// }



export const onRequestPost = async ({ request }) => {
  // return new Response("Hello, world!")
  // const { name } = await request.json()
  const { fileName } = request.body;
  console.log("request: ", request);
  console.log("fileName: ", fileName);

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  })  

  try {
    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
      }),
      { expiresIn: 60 }
    );
    console.log(`Success generating upload URL!`);

    return new Response(JSON.stringify({ signedUrl }));

  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }

}