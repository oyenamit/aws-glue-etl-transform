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



const aws  = require('aws-sdk');
const glue = new aws.Glue();

// -------------------------------------------------------------------------------------------------
// This lambda is called when an object is added, removed or deleted from the S3 data store
// -------------------------------------------------------------------------------------------------
exports.handler = async (event, context) => {

    console.log('S3 event handler lambda called');
    
    // ---------------------------------------------------------------------------------------------
    // Print the incoming Amazon CloudWatch Events event
    // ---------------------------------------------------------------------------------------------
    // console.log('Received event:', JSON.stringify(event, null, 2));
    
    // ---------------------------------------------------------------------------------------------
    // Parameters to start Glue Crawler
    // ---------------------------------------------------------------------------------------------
    const crawlerParams = {
        Name: process.env.inputJobCrawlerName
    };
    
    try {
        console.log('Starting crawler: ' + crawlerParams.Name);
        await glue.startCrawler(crawlerParams).promise();
    }
    catch(err) {
        console.log('Error occurred while starting crawler: ' + err);
        throw err;
    }
    
    // ---------------------------------------------------------------------------------------------
    // Parameters to trigger Glue Job
    // ---------------------------------------------------------------------------------------------
    const triggerParams = {
        Name: process.env.inputJobTriggerName  
    };
    
    try {
        console.log('Starting trigger: ' + triggerParams.Name);
        await glue.startTrigger(triggerParams).promise();
        return 'Success';
    }
    catch(err) {
        console.log('Error occurred while starting trigger: ' + err);
        throw err;
    }
};

