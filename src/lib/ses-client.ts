import AWS from 'aws-sdk';

export const ses = new AWS.SES({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test'
});