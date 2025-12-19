#!/usr/bin/env python3
"""
Valkey (ElastiCache) 연결 테스트 Python 스크립트
사용법: python3 test-valkey-python.py [dev|prod]
"""

import sys
import json
import boto3
import redis
from datetime import datetime

def get_secret(secret_name, region):
    """Secrets Manager에서 연결 정보 가져오기"""
    client = boto3.client('secretsmanager', region_name=region)
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"❌ Secrets Manager에서 연결 정보를 가져올 수 없습니다: {e}")
        sys.exit(1)

def test_valkey_connection(endpoint, port):
    """Valkey 연결 테스트"""
    try:
        # Redis 클라이언트 생성
        r = redis.Redis(
            host=endpoint,
            port=port,
            socket_connect_timeout=5,
            decode_responses=True
        )
        
        # PING 테스트
        result = r.ping()
        if result:
            print("✅ 연결 성공! PING -> PONG")
        else:
            print("❌ PING 실패")
            return False
        
        # 기본 정보 조회
        print("\n📊 기본 정보:")
        info = r.info('server')
        print(f"  Redis Version: {info.get('redis_version', 'N/A')}")
        print(f"  Uptime: {info.get('uptime_in_seconds', 0)} seconds")
        print(f"  Connected Clients: {info.get('connected_clients', 0)}")
        
        # 데이터 쓰기/읽기 테스트
        print("\n🧪 데이터 쓰기/읽기 테스트:")
        test_key = f"test:valkey:connection:{int(datetime.now().timestamp())}"
        test_value = f"test-value-{datetime.now().isoformat()}"
        
        # 쓰기
        r.set(test_key, test_value, ex=60)  # 60초 TTL
        print(f"  ✅ 쓰기 성공: {test_key} = {test_value}")
        
        # 읽기
        read_value = r.get(test_key)
        if read_value == test_value:
            print(f"  ✅ 읽기 성공: {read_value}")
        else:
            print(f"  ❌ 읽기 실패: 예상={test_value}, 실제={read_value}")
            return False
        
        # 리스트 테스트
        list_key = f"test:list:{int(datetime.now().timestamp())}"
        r.lpush(list_key, "item1", "item2", "item3")
        list_length = r.llen(list_key)
        print(f"  ✅ 리스트 테스트 성공: {list_key} (길이: {list_length})")
        
        # 해시 테스트
        hash_key = f"test:hash:{int(datetime.now().timestamp())}"
        r.hset(hash_key, mapping={"field1": "value1", "field2": "value2"})
        hash_value = r.hget(hash_key, "field1")
        print(f"  ✅ 해시 테스트 성공: {hash_key}.field1 = {hash_value}")
        
        # 테스트 데이터 정리
        r.delete(test_key, list_key, hash_key)
        print("  ✅ 테스트 데이터 삭제 완료")
        
        return True
        
    except redis.ConnectionError as e:
        print(f"❌ 연결 오류: {e}")
        print("\n가능한 원인:")
        print("  1. Security Group이 접근을 허용하지 않음")
        print("  2. 네트워크 경로 문제 (VPC 내부에서만 접근 가능)")
        print("  3. ElastiCache 클러스터가 아직 생성 중이거나 사용 불가능")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def main():
    environment = sys.argv[1] if len(sys.argv) > 1 else "dev"
    project_name = "passit"
    region = "ap-northeast-2"
    secret_name = f"{project_name}/{environment}/valkey/connection"
    
    print("=" * 50)
    print(f"Valkey 연결 테스트 - {environment} 환경")
    print("=" * 50)
    print()
    
    # Secrets Manager에서 연결 정보 가져오기
    print("📋 Secrets Manager에서 연결 정보 조회 중...")
    secret = get_secret(secret_name, region)
    
    endpoint = secret.get('primary_endpoint')
    port = secret.get('port', 6379)
    engine = secret.get('engine', 'valkey')
    
    print("✅ 연결 정보 확인 완료")
    print()
    print("연결 정보:")
    print(f"  Engine: {engine}")
    print(f"  Endpoint: {endpoint}")
    print(f"  Port: {port}")
    print()
    
    # 연결 테스트
    print("🔌 Valkey 연결 테스트 중...")
    success = test_valkey_connection(endpoint, port)
    
    print()
    print("=" * 50)
    if success:
        print("✅ 모든 테스트 통과!")
    else:
        print("❌ 테스트 실패")
        sys.exit(1)
    print("=" * 50)

if __name__ == "__main__":
    # 필수 패키지 확인
    try:
        import boto3
        import redis
    except ImportError as e:
        print(f"❌ 필수 패키지가 설치되어 있지 않습니다: {e}")
        print("\n설치 방법:")
        print("  pip install boto3 redis")
        sys.exit(1)
    
    main()
