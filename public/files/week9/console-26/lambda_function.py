"""Week 9-3: REST API proxy (payload v1.0), small-table lab."""
import json
import os
import logging
from decimal import Decimal
import boto3

logger = logging.getLogger(__name__)
table = boto3.resource('dynamodb').Table(os.environ['TABLE_NAME'])

def decimal_default(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError('Unsupported JSON type')

def reply(status, body, headers=None):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'),
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    **(headers or {})},
        'body': json.dumps(body, default=decimal_default, ensure_ascii=False),
    }

def reject_constant(value):
    raise ValueError('Non-finite JSON number')

def lambda_handler(event, context):
    try:
        # REST API proxy v1.0. HTTP API v2.0 needs a separate event adapter.
        if not isinstance(event, dict):
            return reply(400, {'error': '이벤트는 객체여야 합니다'})
        method, path = event.get('httpMethod'), event.get('path')
        if not isinstance(method, str) or not isinstance(path, str):
            return reply(400, {'error': 'REST API v1.0의 httpMethod와 path가 필요합니다'})

        if path == '/users' and method == 'GET':
            # One Scan reads at most 1 MB. Aggregate pages for this small lab.
            users, options = [], {'ConsistentRead': True}
            while True:
                page = table.scan(**options)
                users.extend(page.get('Items', []))
                last_key = page.get('LastEvaluatedKey')
                if not last_key:
                    break
                options['ExclusiveStartKey'] = last_key
            return reply(200, {
                'message': 'CloudArchitect Week 9-3 - Lambda와 DynamoDB 연동',
                'users': users, 'count': len(users),
            })

        if path.startswith('/users/') and method == 'GET':
            user_id = (event.get('pathParameters') or {}).get('id')
            if not isinstance(user_id, str) or not user_id.strip():
                return reply(400, {'error': '문자열 id가 필요합니다'})
            profile = (event.get('queryStringParameters') or {}).get('profileType', 'basic')
            if profile not in ('basic', 'detailed'):
                return reply(400, {'error': 'profileType은 basic 또는 detailed여야 합니다'})
            item = table.get_item(Key={'id': user_id}, ConsistentRead=True).get('Item')
            if item is None:
                return reply(404, {'error': '사용자를 찾을 수 없습니다', 'id': user_id})
            user = {key: item.get(key) for key in ('id', 'name', 'email')} if profile == 'basic' else item
            return reply(200, {'message': f'사용자 프로필 조회 성공 ({profile})', 'user': user})

        if path == '/users' and method == 'POST':
            if event.get('isBase64Encoded'):
                return reply(400, {'error': '이 실습은 일반 JSON 본문을 사용합니다'})
            raw = event.get('body')
            if not isinstance(raw, str):
                return reply(400, {'error': 'body는 JSON 문자열이어야 합니다'})
            try:
                body = json.loads(raw, parse_float=Decimal, parse_constant=reject_constant)
            except (ValueError, TypeError):
                return reply(400, {'error': '올바른 JSON 본문이 필요합니다'})
            if not isinstance(body, dict):
                return reply(400, {'error': 'JSON 본문은 객체여야 합니다'})
            for key in ('id', 'name', 'email'):
                if not isinstance(body.get(key), str) or not body[key].strip():
                    return reply(400, {'error': f'{key}는 비어 있지 않은 문자열이어야 합니다'})
            age = body.get('age')
            if age is not None and (isinstance(age, bool) or not isinstance(age, (int, Decimal)) or age < 0 or age > 150 or age != int(age)):
                return reply(400, {'error': 'age는 0~150의 정수여야 합니다'})
            # PutItem replaces the whole item; it is not a partial update.
            result = table.put_item(Item=body, ReturnValues='ALL_OLD')
            replaced = bool(result.get('Attributes'))
            return reply(200 if replaced else 201, {
                'message': '사용자 전체 교체 성공' if replaced else '사용자 생성 성공',
                'id': body['id'],
            })

        if path == '/users' or path.startswith('/users/'):
            allowed = 'GET, POST' if path == '/users' else 'GET'
            return reply(405, {'error': '지원하지 않는 HTTP 메서드'}, {'Allow': allowed})
        return reply(404, {'error': '지원하지 않는 경로'})
    except Exception:
        logger.exception('Users API request failed')
        return reply(500, {'error': '내부 서버 오류'})
