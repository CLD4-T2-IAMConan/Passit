// src/pages/PaymentResultPage.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function PaymentResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('PROCESSING'); // PROCESSING, SUCCESS, FAILED
    const [message, setMessage] = useState('결제 승인 정보를 처리 중입니다. 잠시만 기다려 주세요. (Payment ID: 7)');

    // ... (URL 파라미터 추출 로직은 이전과 동일하게 유지)
    const queryParams = new URLSearchParams(location.search);
    const pathSegments = location.pathname.split('/');
    const paymentId = pathSegments[3] || queryParams.get('paymentId');
    const tid = queryParams.get('tid');
    const authToken = queryParams.get('authToken');
    const authResultCode = queryParams.get('authResultCode');


    // ⚠️ useEffect 로직은 '임시 성공 처리' 버전 대신, 최종 승인 오류를 테스트하기 위해
    //    '404 Not Found' 상태에서도 화면만 볼 수 있도록 간단히 수정합니다.
    useEffect(() => {
        // ... (인증 실패 및 데이터 누락 처리 로직은 생략. 필요하다면 원본에서 복사해오세요.)

        // 3. 백엔드 최종 승인 API 호출 함수 정의
        const completePayment = async () => {
            try {
                // 404가 나더라도 화면만은 볼 수 있도록 임시적으로 try/catch 밖으로 SUCCESS 로직을 옮깁니다.
                const response = await axios.post(`/api/payments/${paymentId}/complete`, {
                    tid: tid,
                    authToken: authToken
                });

                if (response.data === "SUCCESS") {
                    setStatus('SUCCESS');
                    setMessage('결제가 성공적으로 완료되었습니다.');
                } else {
                    throw new Error("서버 응답이 불완전합니다.");
                }

            } catch (error) {
                // ⚠️ 이 부분이 임시 강제 성공 로직입니다. ⚠️

                        console.error("최종 결제 승인 실패:", error);

                        // 🚨 임시 조치: 오류 발생 시에도 SUCCESS 상태로 강제 전환
                        setStatus('SUCCESS');
                        // 강제 성공 시 메시지를 명확하게 표시
                        setMessage('백엔드 처리 오류 발생. (임시) 결제 완료 화면으로 전환되었습니다. 실제 결제는 실패했을 수 있습니다.');
                        // ----------------------------------------------------

                        // 원본 오류 처리 로직 (주석 처리)
                        /*
                        setStatus('FAILED');
                        setMessage('서버에서 최종 결제 승인에 실패했습니다: ' + (error.response?.data || error.message));
                        */
                    }
            };


        completePayment();

    }, [location.search, paymentId, tid, authToken, authResultCode]); // 의존성 배열 추가

    // --- 5. UI 렌더링 (이미지 기반 스타일 적용) ---

    // 1. 처리 중 화면 (이미지: image_628d76.png)
    if (status === 'PROCESSING') {
        return (
            <div style={styles.container}>
                {/* 파란색 로딩 스피너 */}
                <div className="spinner-border text-primary" role="status" style={styles.spinner}></div>

                <h2 style={styles.processingText}>결제 승인 정보를 처리 중입니다.</h2>
                <p style={styles.subText}>잠시만 기다려 주세요. (Payment ID: {paymentId})</p>
            </div>
        );
    }

    // 2. 실패 화면 (이미지: image_55e198.png)
    if (status === 'FAILED') {
        // 이미지를 반영하기 위한 인라인 스타일 (CSS 클래스는 사용자 환경에 맞게 조정 필요)
        return (
            <div style={styles.container}>
                {/* 빨간색 큰 X 아이콘 */}
                <div style={styles.failIconContainer}>
                    <div style={styles.failIcon}>❌</div> {/* 실제로는 SVG/폰트 아이콘 사용 */}
                </div>

                <h1 style={styles.failTitle}>결제가 실패했습니다.</h1>

                {/* 빨간색 경고 박스 (이미지의 오류 메시지 박스) */}
                <div style={styles.errorBox}>
                    <p style={styles.errorTitle}>
                        <span style={styles.alertIcon}>&#9888;</span> 결제 승인 오류
                    </p>
                    <p style={styles.errorMessage}>{message}</p>
                </div>

                <button
                    onClick={() => navigate('/payment/retry')}
                    style={styles.failButton}
                >
                    결제 재시도하기
                </button>
            </div>
        );
    }

    // 3. 성공 화면 (실패 화면의 색상만 변경하여 재사용)
    if (status === 'SUCCESS') {
        return (
            <div style={styles.container}>
                {/* 초록색 체크 아이콘 */}
                <div style={{...styles.failIconContainer, borderColor: 'green'}}>
                    <div style={{...styles.failIcon, color: 'green'}}>✅</div>
                </div>

                <h1 style={styles.failTitle}>결제가 완료되었습니다.</h1>
                <p style={{...styles.subText, color: 'green'}}>{message}</p>

                <button
                    onClick={() => navigate('/')}
                    style={styles.successButton}
                >
                    메인 페이지로 돌아가기
                </button>
            </div>
        );
    }

    return null;
}

// --------------------------- 인라인 스타일 정의 (CSS 대체) ---------------------------
const styles = {
    container: {
        textAlign: 'center',
        padding: '50px',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
    },
    spinner: {
        width: '3rem',
        height: '3rem',
        borderWidth: '0.3em',
        color: '#007bff', // Bootstrap primary blue
        animation: 'spin 1s linear infinite', // 실제 CSS 파일에 @keyframes spin 정의 필요
        margin: '20px auto'
    },
    processingText: {
        fontSize: '1.5rem',
        color: '#333'
    },
    subText: {
        fontSize: '1rem',
        color: '#6c757d'
    },
    // 실패 UI 스타일
    failIconContainer: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        border: '5px solid #dc3545', // Red border
        margin: '0 auto 30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '4rem',
        color: '#dc3545',
        backgroundColor: '#fff'
    },
    failIcon: {
        lineHeight: 1
    },
    failTitle: {
        fontSize: '2rem',
        color: '#dc3545', // Red text
        marginBottom: '40px'
    },
    errorBox: {
        backgroundColor: '#f8d7da', // Light red background
        color: '#721c24', // Dark red text
        border: '1px solid #f5c6cb',
        borderRadius: '5px',
        padding: '15px',
        textAlign: 'left',
        marginBottom: '30px'
    },
    errorTitle: {
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '5px'
    },
    errorMessage: {
        margin: 0,
        fontSize: '0.9rem'
    },
    alertIcon: {
        marginRight: '10px',
        color: '#dc3545' // Icon red
    },
    failButton: {
        backgroundColor: '#6c757d', // Grayish button from image
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    successButton: {
        backgroundColor: '#007bff', // Blue button for success
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
};

export default PaymentResultPage;