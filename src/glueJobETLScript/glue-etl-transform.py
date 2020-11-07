# ***** BEGIN LICENSE BLOCK *****
#
# Copyright (C) 2020 Namit Bhalla (oyenamit@gmail.com)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>
#
# ***** END LICENSE BLOCK *****



import sys
import os
import boto3
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.context import DynamicFrame

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'region', 'dbname', 'tablename', 'destinationpath'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)
sourcedatabase = args['dbname']
tablename = args['tablename']
destinationpath = args['destinationpath']

# It is assumed that Glue Crawler will create table name which is same as the input folder name.
# tablename is directly taken from input folder name specified in the CloudFormation template.
# But if the user has nested folder (for example, test/input), then we cannot use this name as-is.
# This is an ugly hack to extract the folder name and use it as the table name
sourcetable = os.path.basename(tablename)

# Read the data from source
datasource0 = glueContext.create_dynamic_frame.from_catalog(database = sourcedatabase, table_name = sourcetable, transformation_ctx = "datasource0")
if datasource0.toDF().head(1):
    datasource1 = DynamicFrame.fromDF(datasource0.toDF().distinct(), glueContext,"datasource1")
    lowercase = datasource1.toDF().toDF(*[c.lower() for c in datasource1.toDF().columns])

    # To write in JSON format, transform and write data to S3
    # glueContext.write_dynamic_frame.from_options(frame = lowercase, connection_type="s3", connection_options = {"path": destinationpath}, format = "json")
    # Write data in parquet format, overwriting any previous data
    lowercase.write.mode("overwrite").parquet(destinationpath)
    print "Finished writing transformed data to S3"

job.commit()

