<h1>Video Conference Application using AWS Chime SDK</h1>

We are using plain Javascript without any frameworks like ReactJS etc.

**Generate Amazon Chime SDK Javascript Client Library - single file** <br>

git clone https://github.com/aws-samples/amazon-chime-sdk.git <br>
cd amazon-chime-sdk/utils/singlejs

Here make sure that src/index.js looks like this (update it if necessary): <br>
export * as default from 'amazon-chime-sdk-js';

npm install <br>
npm run bundle

This will generate amazon-chime-sdk.min.js in build directory.

**Lambda function** <br>
services/lambda/lambda.py<br>
Make sure that the **chime.endpoint** region is correct here.

**HTML file** <br>
web/index.html<br>
The website can be accessed by using &lt;CloudFrontURL&gt;

**Javascript Code** <br>
web/assets/js/vid.js<br>
Here you must set the **MEETING_SERVICE** constant to point to your API ( API Gateway > Lambda function)

**How to create an API (Gateway)**

_Create API_ <br>
In AWS Console > API Gateway > Create API > Choose API Type > HTTP API > Build > <br>
Provide API Name 'byte-meeting' > For 'Configure Routes' Hit Next > For 'Configure Stages' Hit Next > Review & Create 

_Configure Routes_ <br>
Select Routes on left menu > Hit 'Create' on right pane > Choose Method 'ANY' Route '/bytes-meeting' > Create > <br>
Select the newly created route/method > Select 'Attach Integration' > 'Create and Attach Integration' <br>
Choose Integration Target - Integration Type from dropdown : Lambda function , Choose AWS Region , <br>
Select 'bytes-meeting' lambda function ARN <br>
Make sure "Grant API Gateway permission to invoke your Lambda function" is checked > Hit Create 

_Deploy API_ <br>
Select Deploy menu on left > Select Stages > Select your stage $default <br>
Check if under Attached Deployment: Automatic Deployment is Enabled. If yes, you are all set. <br>
If not you must hit the Deploy button at top right to deploy your API 
