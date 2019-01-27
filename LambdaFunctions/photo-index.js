var domain = "<Enter your domain URL>";
var region = "<Enter Region>";
var index = 'photos';
var type = '_doc';
var id =  Date.now();

var AWS = require('aws-sdk');
AWS.region = "us-east-1";
var rekognition = new AWS.Rekognition();
    
function indexDocument(document) {
            var endpoint = new AWS.Endpoint(domain);
            var request = new AWS.HttpRequest(endpoint, region);
            // console.log(id);
            request.method = 'PUT';
            request.path += index + '/' + type + '/' + id;
            request.body = JSON.stringify(document);
            request.headers['host'] = domain;
            request.headers['Content-Type'] = 'application/json';
          
            // console.log('request', request);
          
            var credentials = new AWS.EnvironmentCredentials('AWS');
            var signer = new AWS.Signers.V4(request, 'es');
            signer.addAuthorization(credentials, new Date());
          
            var client = new AWS.HttpClient();
            client.handleRequest(request, null, function(response) {
              console.log(response.statusCode + ' ' + response.statusMessage);
              var responseBody = '';
              response.on('data', function (chunk) {
                responseBody += chunk;
              });
              response.on('end', function (chunk) {
                console.log('Response body: ' + responseBody);
              });
            }, function(error) {
              console.log('Error: ' + error);
            });
          }
          
exports.handler =  (event,callback) => {
  //Calls DetectFaces API and shows estimated ages of detected faces
    console.log(JSON.stringify(event));
    var params = {
      Image: {
        S3Object: {
            Bucket: event['Records'][0]['s3']['bucket']['name'],
            Name: event['Records'][0]['s3']['object']['key']
            // Bucket : "b2photostore",
            // Name : "elephant.jpg"
        }
      },
      MaxLabels: 10,
      MinConfidence: 75
    };
    rekognition.detectLabels(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      }
      else {
          console.log(JSON.stringify(data));
          var labels = [], i, j;
          for( i = 0;j=data.Labels.length,i<j; i++){
            labels.push(data.Labels[i].Name);
          }
          var response = { "objectKey" : params.Image.S3Object.Name, "bucket" : params.Image.S3Object.Bucket, "createdTimestamp":event['Records'][0]['eventTime'], "labels" : labels};
          // console.log(response);
          var json = response;
          
          indexDocument(json);
      }
    });
};