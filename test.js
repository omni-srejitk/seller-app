const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const version = process.env.S3_VERSION;
const region = process.env.S3_REGION;
const bucket = process.env.s3_BUCKET;

//TODO:move to ext config
const s3 = new AWS.S3({
  useAccelerateEndpoint: true,
  region: region,
});

const signedUrlExpireSeconds = 60 * 60 * 60;

let myBucket = bucket;

const getSignedUrlForUpload = (s3, myBucket) => async (data) => {
  //TODO: Use Axios to send http request
  try {
    let orgId = "";
    if (data.organizationId) {
      orgId = data.organizationId;
    } else {
      orgId = data?.currentUser?.organization ?? uuidv4();
    }

    const myKey =
      orgId +
      "/" +
      data.path +
      "/" +
      data?.fileName +
      data?.fileType?.replace(/^\.?/, ".");
    const params = {
      Bucket: myBucket,
      Key: myKey,
      Expires: signedUrlExpireSeconds,
    };
    console.log(params);

    return await new Promise((resolve, reject) =>
      s3.getSignedUrl("putObject", params, function (err, url) {
        console.log(
          "[getSignedUrlForUpload] Error getting presigned url from AWS S3",
          err
        );
        if (err) {
          console.log(
            "[getSignedUrlForUpload] Error getting presigned url from AWS S3"
          );
          reject({
            success: false,
            message: "Pre-Signed URL error",
            urls: url,
          });
        } else {
          console.log("Presigned URL: ", url);
          console.log("putObject", params);
          var para = resolve({
            success: true,
            message: `AWS SDK S3 Pre-signed urls generated successfully with params ${JSON.stringify(
              params
            )} and path ${myKey}`,
            path: myKey,
            urls: url,
          });
        }
      })
    );
  } catch (err) {
    console.log("err", err);
    return err;
  }
};

const awsRes = getSignedUrlForUpload(
  s3,
  myBucket
)({
  organizationId: "",
  currentUser: {
    organization: "",
  },
  path: "",
  fileName: "",
  fileType: "",
})
  .then((data) => console.log({ awsRes: data }))
  .catch((err) => console.log({ err }));
