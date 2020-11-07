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



const aws = require('aws-sdk');
const s3  = new aws.S3();

// -------------------------------------------------------------------------------------------------
// Client uploads data by sending document contents in base64 encoding and document name.
// These values are passed to lambda as members of event object.
// -------------------------------------------------------------------------------------------------
exports.handler = async (event, context) => {

    console.log('Data uploader lambda called');
    
    let retVal = {
        code: 200,
        message: "Success!"
    };
    
    // ---------------------------------------------------------------------------------------------
    // Input validation
    // ---------------------------------------------------------------------------------------------
    if((event.docdata === undefined) || (event.docname === undefined))
    {
        retVal.code = 400;
        retVal.message = 'Not enough arguments';
        throw (new Error(JSON.stringify(retVal)));
    }
    
    console.log('event.docname: ' + event.docname);
    let decodedDoc = new Buffer.from(event.docdata, 'base64');

    // ---------------------------------------------------------------------------------------------
    // Parameters to upload document to S3 bucket
    // ---------------------------------------------------------------------------------------------
    let params = {
      "Body": decodedDoc,
      "Bucket": process.env.S3_BUCKET_NAME,
      "Key": process.env.S3_FOLDER_NAME + '/' + event.docname
    };
    
    // ---------------------------------------------------------------------------------------------
    // Upload the document to S3 bucket
    // ---------------------------------------------------------------------------------------------
    try {
        await s3.upload(params).promise();
        return JSON.stringify(retVal);
    }
    catch(err) {
        console.log('Error occurred while uploading: ' + err);
        
        retVal.code = 500;
        retVal.message = 'An error occurred';
        throw (new Error(JSON.stringify(retVal)));
    }
};

