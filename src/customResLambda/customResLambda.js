/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2020 Namit Bhalla (oyenamit@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>
 *
 * ***** END LICENSE BLOCK ***** */



const aws         = require('aws-sdk');
const {promisify} = require('util');
const s3          = new aws.S3();
const response    = require('cfn-response');


exports.handler = async function(event, context) {

    console.log('CustomResourceHander lambda called for: ', event.RequestType);

    // --------------------------------------------------------------------------------------------
    // Print the incoming CloudWatch event.
    // --------------------------------------------------------------------------------------------    
    // console.log('Received event:', JSON.stringify(event, null, 2));
    
    let result = response.SUCCESS;

    if(event.RequestType == 'Delete') {

        console.log('Processing Delete request');

        let continuationToken = null;
        let totalItemCount = 0;

        // ----------------------------------------------------------------------------------------
        // Parameters to list contents of S3 bucket
        // ----------------------------------------------------------------------------------------        
        const listParams = {
            Bucket: event.ResourceProperties.bucketName,
            MaxKeys: 100
        };

        // ----------------------------------------------------------------------------------------
        // Parameters to delete contents of S3 bucket
        // ----------------------------------------------------------------------------------------        
        const deleteParams = {
            Bucket: event.ResourceProperties.bucketName,
            Delete: { Objects: [] }
        };

        // ----------------------------------------------------------------------------------------
        // Iterate over the contents of the bucket and delete them
        // ----------------------------------------------------------------------------------------
        while(true) {
            try {

                // --------------------------------------------------------------------------------
                // After the previous iteration, some objects are still left in the bucket.
                // Continue the iteration.
                // --------------------------------------------------------------------------------                
                if(continuationToken) {
                    listParams.ContinuationToken = continuationToken;
                }

                // --------------------------------------------------------------------------------
                // Retrieve the next set of objects (count is decided by 'MaxKeys')
                // --------------------------------------------------------------------------------                
                let data = await s3.listObjectsV2(listParams).promise();
                console.log('listObjects KeyCount: ' + data.KeyCount + ' IsTruncated: ' + data.IsTruncated + ' NextContinuationToken: ' + data.NextContinuationToken);

                // --------------------------------------------------------------------------------
                // Iterate over the returned S3 objects and add them to list of items to delete
                // --------------------------------------------------------------------------------                
                for(let i = 0; i < data.Contents.length; ++i) {
                    console.log('S3 object: ' + data.Contents[i].Key);
                    ++totalItemCount;

                    let oneItem = { Key: data.Contents[i].Key };
                    deleteParams.Delete.Objects.push(oneItem);
                }

                // --------------------------------------------------------------------------------
                // Delete the set of S3 objects
                // --------------------------------------------------------------------------------                
                console.log('Deleting objects from this iteration');
                await s3.deleteObjects(deleteParams).promise();


                // --------------------------------------------------------------------------------
                // Are there more objects in S3 bucket?
                // --------------------------------------------------------------------------------
                if(data.IsTruncated === true) {
                    console.log('More objects present in bucket. Continuing the iteration');
                    continuationToken = data.NextContinuationToken;
                }
                else {
                    console.log('Finishing the iteration. Total item count: ' + totalItemCount);
                    continuationToken = null;
                    break;
                }
            }
            catch (e) {
                console.log('Error in listObjects/deleteObjects: ' + e);
                result = response.FAILED;
                break;
            }
        }
    }

    // --------------------------------------------------------------------------------------------
    // Even if an event is not handled ('Create', 'Update' or 'Delete'), always send the response
    // back so that CloudFormation can continue with the stack operation.
    // --------------------------------------------------------------------------------------------    
    console.log('Sending response to CloudFormation');
    const sendAsync = promisify(response.send);

    try {
        const ret = await sendAsync(event, context, result, null, null, false);
        console.log('Successful in sending response to CloudFormation: ' + ret);
        return ret;
    }
    catch(err) {
        console.log('Error in sending response to CloudFormation. Error: ' + err);
        throw err;
    }
};

