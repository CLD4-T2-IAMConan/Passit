#!/usr/bin/env python3
"""
S3 버킷 테스트 Python 스크립트
사용법: python3 test-s3-python.py [dev|prod]
"""

import sys
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

def test_bucket(bucket_name, s3_client, region):
    """단일 버킷 테스트"""
    print("-" * 50)
    print(f"버킷: {bucket_name}")
    print("-" * 50)
    
    # 버킷 존재 확인
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print("✅ 버킷 존재 확인")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            print("❌ 버킷이 존재하지 않습니다.")
            return False
        elif error_code == '403':
            print("❌ 버킷에 접근할 수 없습니다 (권한 부족)")
            return False
        else:
            print(f"❌ 오류: {e}")
            return False
    
    # 버킷 정보 조회
    print("\n📊 버킷 정보:")
    try:
        location = s3_client.get_bucket_location(Bucket=bucket_name)
        region_name = location.get('LocationConstraint', region)
        print(f"  Location: {region_name}")
    except Exception as e:
        print(f"  Location: 확인 불가 ({e})")
    
    try:
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        version_status = versioning.get('Status', 'Disabled')
        print(f"  Versioning: {version_status}")
    except Exception as e:
        print(f"  Versioning: 확인 불가 ({e})")
    
    try:
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        if rules:
            sse_algo = rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm', 'N/A')
            print(f"  Encryption: {sse_algo}")
        else:
            print("  Encryption: 확인 불가")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
            print("  Encryption: 설정되지 않음")
        else:
            print(f"  Encryption: 확인 불가 ({e})")
    
    # 파일 업로드 테스트
    print("\n🧪 파일 업로드 테스트:")
    test_key = f"test/connection-test-{int(datetime.now().timestamp())}.txt"
    test_content = f"S3 테스트 파일 - {datetime.now().isoformat()}"
    
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='text/plain'
        )
        print(f"✅ 업로드 성공: s3://{bucket_name}/{test_key}")
        
        # 파일 다운로드 테스트
        try:
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            downloaded_content = response['Body'].read().decode('utf-8')
            
            if downloaded_content == test_content:
                print("✅ 다운로드 성공 및 내용 일치 확인")
            else:
                print("❌ 다운로드한 내용이 원본과 다릅니다")
                print(f"   예상: {test_content}")
                print(f"   실제: {downloaded_content}")
            
            # 테스트 파일 삭제
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print("✅ 테스트 파일 삭제 완료")
            
        except ClientError as e:
            print(f"❌ 다운로드 실패: {e}")
            # 업로드한 파일은 삭제 시도
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            except:
                pass
        
    except ClientError as e:
        print(f"❌ 업로드 실패: {e}")
        print("\n가능한 원인:")
        print("  1. IAM 권한 부족 (s3:PutObject 필요)")
        print("  2. 버킷 정책 제한")
        print("  3. KMS 키 권한 부족 (암호화 사용 시)")
        return False
    
    return True

def main():
    environment = sys.argv[1] if len(sys.argv) > 1 else "dev"
    project_name = "passit"
    region = "ap-northeast-2"
    bucket_prefix = f"{project_name}-{environment}"
    buckets = ["uploads", "logs", "backup"]
    
    print("=" * 50)
    print(f"S3 버킷 테스트 - {environment} 환경")
    print("=" * 50)
    print()
    
    # S3 클라이언트 생성
    try:
        s3_client = boto3.client('s3', region_name=region)
    except Exception as e:
        print(f"❌ S3 클라이언트 생성 실패: {e}")
        sys.exit(1)
    
    # 각 버킷 테스트
    success_count = 0
    for bucket_name in buckets:
        full_bucket_name = f"{bucket_prefix}-{bucket_name}"
        if test_bucket(full_bucket_name, s3_client, region):
            success_count += 1
        print()
    
    print("=" * 50)
    print(f"✅ S3 버킷 테스트 완료! ({success_count}/{len(buckets)} 성공)")
    print("=" * 50)
    print()
    print("📝 추가 확인 사항:")
    print("  - 버킷 정책 확인: aws s3api get-bucket-policy --bucket <bucket-name>")
    print("  - 버킷 객체 목록: aws s3 ls s3://<bucket-name>/")

if __name__ == "__main__":
    # 필수 패키지 확인
    try:
        import boto3
    except ImportError:
        print("❌ boto3가 설치되어 있지 않습니다.")
        print("\n설치 방법:")
        print("  pip install boto3")
        sys.exit(1)
    
    main()
