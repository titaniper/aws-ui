import AWS from 'aws-sdk';

export const ses = new AWS.SES({
  endpoint: 'http://localhost:4566',
  region: 'us-west-2',
  // accessKeyId: 'test',
  // secretAccessKey: 'test',
});