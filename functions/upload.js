import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import axios from 'axios';


// // GET requests to /filename would return "Hello, world!"
// export const onRequestGet = () => {
//   return new Response("Hello, world!")
// }


export const getSignedUrl = async ({ fileName }) => {
  try {
    console.log(`Generating an upload URL!`);

    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
      }),
      { expiresIn: 60 }
    );

    console.log(`Success generating upload URL!`);

    return signedUrl;

  } catch (err) {
    console.log(`ERROR: ${err.message || 'An error occurred'}`);
    return err.message;
  }
}

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

    return signedUrl;

} catch (error) {
    console.error(error);
  }




  return new Response(`Hello, ${name}!`)
}