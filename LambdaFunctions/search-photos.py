from elasticsearch import Elasticsearch,RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3
import json
import re

session = boto3.Session()
credentials = session.get_credentials()
access_key = credentials.access_key
secret_key = credentials.secret_key
region = 'us-east-1'

host = '<Enter Elastic search host url>'
awsauth = AWS4Auth(access_key,secret_key, region, 'es',session_token=credentials.token)

def lambda_handler(event,context):
    try:
        lex_client = boto3.client('lex-runtime')
        q = event["queryStringParameters"]['q']
        text = ['hi',q]
        print('Text is:',text)
        response = ""
        
        for i in range(len(text)):
            inputText = text[i].lower()
            response = lex_client.post_text(
                botName="extractSearchKeywords",
                botAlias="searchKeywords",
                userId="user",
                inputText=inputText
                )
    
        query = response['slots']['firstKeyword']
        print(query)
        s = re.split(',|and',query)
        labels = [item.strip() for item in s]
        print(labels)
        
        es = Elasticsearch(
            hosts=[{'host': host, 'port': 443}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        
        # es.indices.delete(index='photos', ignore=[400, 404])
        
        res = es.search(index="photos", body={"query": 
                                                {"terms": 
                                                    { "labels": labels}
                                                }})
        results=[]                                       
        print("Got %d Hits:" % res['hits']['total'])
        for hit in res['hits']['hits']:
            result = 'https://s3.amazonaws.com/<your bucket name>/'+hit["_source"]["objectKey"]
            results.append(result)
        # results = "Hi i passed the test."
        results = {"results":results}
        resp = {
            "isBase64Encoded": False,
            "statusCode": 200,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": json.dumps(results)
        }
        return resp
    except:
        resp = {
            "isBase64Encoded": False,
            "statusCode": 200,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": 'Error in Lambda execution. Check Lambda logs.'
        }
        return resp