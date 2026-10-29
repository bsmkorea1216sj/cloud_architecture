"""Offline regressions for the published Week 9-2 sample; never calls AWS."""
import copy
import json
import logging
import runpy
import sys
import types
import zipfile
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'public/content/week9/9-2-lambda-function.md'
ZIP = ROOT / 'public/files/week9/week9-2-lambda-function.zip'
text = DOC.read_text(encoding='utf-8')
fence = chr(96) * 3
start = text.index(fence + 'python\n', text.index('### 3.1')) + len(fence + 'python\n')
code = text[start:text.index('\n' + fence, start)]
compile(code, 'lambda_function.py', 'exec')
with zipfile.ZipFile(ZIP) as archive:
    assert archive.read('lambda_function.py').decode().strip() == code.strip()
    for name in ('setup-9-2.sh', 'setup-9-2-student.sh', 'cleanup-9-2.sh', 'cleanup-9-2-student.sh'):
        assert '[cite:' not in archive.read(name).decode()

class Table:
    def __init__(self):
        self.items = {'user001': {'id': 'user001', 'name': '김철수'}}
        self.calls = []
    def scan(self, **options):
        self.calls.append(options)
        if 'ExclusiveStartKey' not in options:
            return {'Items': [{'id': 'user001'}], 'Count': 1, 'LastEvaluatedKey': {'id': 'user001'}}
        return {'Items': [{'id': 'user002'}], 'Count': 1}
    def get_item(self, Key, **options):
        return {'Item': self.items[Key['id']]} if Key['id'] in self.items else {}
    def put_item(self, Item, ReturnValues):
        old = self.items.get(Item['id'])
        self.items[Item['id']] = copy.deepcopy(Item)
        return {'Attributes': old} if old else {}

table = Table()
boto3 = types.ModuleType('boto3')
boto3.resource = lambda name: types.SimpleNamespace(Table=lambda name: table)
sys.modules['boto3'] = boto3
namespace = {}
exec(compile(code, 'lambda_function.py', 'exec'), namespace)
handler = namespace['lambda_handler']
logging.disable(logging.CRITICAL)
checks = 0

def call(event, expected):
    global checks
    result = handler(event, None)
    assert result['statusCode'] == expected, (event, result)
    assert result['headers']['Content-Type'] == 'application/json'
    checks += 1
    return json.loads(result['body'])

def post(body):
    return {'httpMethod': 'POST', 'path': '/users', 'body': body}

def get(user_id, profile='basic'):
    return {'httpMethod': 'GET', 'path': '/users/' + user_id, 'pathParameters': {'id': user_id}, 'queryStringParameters': {'profileType': profile}}

result = call({'httpMethod': 'GET', 'path': '/users'}, 200)
assert result['count'] == 2 and len(table.calls) == 2
assert table.calls[1]['ExclusiveStartKey'] == {'id': 'user001'}
assert call(get('user001'), 200)['user']['email'] is None
call(get('absent'), 404)
call(get('user001', 'invalid'), 400)
call({'httpMethod': 'GET', 'path': '/users/x'}, 400)
call(post('{invalid'), 400)
call(post('[]'), 400)
call(post(None), 400)
call(post('{}'), 400)
call(post(json.dumps({'id': 7, 'name': 'x', 'email': 'x@example.com'})), 400)
call(post(json.dumps({'id': ' ', 'name': 'x', 'email': 'x@example.com'})), 400)
user = {'id': 'test-user', 'name': '테스트', 'email': 'test@example.com', 'score': 12.5, 'age': 28}
call(post(json.dumps(user)), 201)
assert table.items['test-user']['score'] == Decimal('12.5')
user.pop('score')
call(post(json.dumps(user)), 200)
assert 'score' not in table.items['test-user']
user['age'] = -1
call(post(json.dumps(user)), 400)
call(post('{"id":"x","name":"x","email":"x","score":NaN}'), 400)
call({'httpMethod': 'GET', 'path': '/unknown'}, 404)
call({'httpMethod': 'DELETE', 'path': '/users'}, 405)
call({'version': '2.0', 'rawPath': '/users'}, 400)
call(None, 400)
def fail(**kwargs):
    raise RuntimeError('private database detail')
table.scan = fail
result = call({'httpMethod': 'GET', 'path': '/users'}, 500)
assert 'private' not in json.dumps(result)
assert 'Python 3.14' not in text
assert 'Init Duration' in text and 'Name=CloudArchitect-Lab' in text
print(f'PASS: {checks} offline API cases; Markdown/ZIP source parity and documentation checks')
