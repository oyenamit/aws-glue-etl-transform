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



// This source code has been adapted from AWS sample source available at:
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-lambda-function-code-cfnresponsemodule.html

exports.SUCCESS = "SUCCESS";
exports.FAILED = "FAILED";

// ------------------------------------------------------------------------------------------------
// This function is used to send response back from custom resource lambda
// ------------------------------------------------------------------------------------------------
exports.send = function(event, context, responseStatus, responseData, physicalResourceId, noEcho, callback) {

    const https = require("https");
    const url = require("url");

    // --------------------------------------------------------------------------------------------
    // Payload for the HTTP PUT call
    // --------------------------------------------------------------------------------------------
    let responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: physicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: noEcho || false,
        Data: responseData
    });

    console.log("Response body:\n", responseBody);

    // --------------------------------------------------------------------------------------------
    // event.ResponseURL is a pre-signed URL that is provided by CloudFormation so that the lambda
    // function can send a response back once it is finished with its processing.
    // --------------------------------------------------------------------------------------------
    let parsedUrl = url.parse(event.ResponseURL);

    // --------------------------------------------------------------------------------------------
    // Parameters for HTTP PUT call
    // --------------------------------------------------------------------------------------------
    let options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    // --------------------------------------------------------------------------------------------
    // Initiate the HTTP PUT call
    // --------------------------------------------------------------------------------------------
    let request = https.request(options, function(response) {
        console.log("Successful in sending PUT request for response. Status code/message: " + response.statusCode + "/" + response.statusMessage);

        callback(null, "" + response.statusCode + "/" + response.statusMessage);
    });

    request.on("error", function(error) {
        console.log("Failed to send PUT request for response. Error: " + error);

        callback(error, null);
    });


    // --------------------------------------------------------------------------------------------
    // Send the response payload and finish the PUT call
    // --------------------------------------------------------------------------------------------
    request.write(responseBody);
    request.end();
};

