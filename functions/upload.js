import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios';


// // GET requests to /filename would return "Hello, world!"
// export const onRequestGet = () => {
//   return new Response("Hello, world!")
// }


export const onRequestPost = async ({ request }) => {
  // const { name } = await request.json()
  const { fileName } = request.body;

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

    return new Response(JSON.stringify({ signedUrl });

  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }

}