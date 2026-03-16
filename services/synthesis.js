/**
 * GCP Vertex AI 옷 합성 서비스
 * 모델: Imagen 2 image editing (imagegeneration@006)
 * 
 * GCP_PROJECT_ID, GCP_REGION, GCP_SERVICE_ACCOUNT_KEY 환경변수 필요
 */

function getAccessToken() {
  const key = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
  // JWT 기반 서비스 계정 인증
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return auth.getAccessToken();
}

/**
 * 아기 사진(babyBase64)에 옷(clothBase64)을 입혀서 결과 base64 반환
 */
export async function synthesizeClothes(babyBase64, clothBase64, prompt = '') {
  if (!process.env.GCP_PROJECT_ID || !process.env.GCP_SERVICE_ACCOUNT_KEY) {
    throw new Error('GCP 크리덴셜이 설정되지 않았습니다.');
  }

  const { GoogleAuth } = await import('google-auth-library');
  const key = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const token = await auth.getAccessToken();

  const project = process.env.GCP_PROJECT_ID;
  const region = process.env.GCP_REGION || 'us-central1';
  const model = 'imagegeneration@006';
  const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:predict`;

  const synthesisPrompt = prompt ||
    '아기에게 제공된 옷을 자연스럽게 입혀주세요. 아기의 자세와 표정은 그대로 유지하면서 옷만 합성해 주세요.';

  const body = {
    instances: [{
      prompt: synthesisPrompt,
      referenceImages: [
        { referenceType: 'REFERENCE_TYPE_SUBJECT', referenceImage: { bytesBase64Encoded: babyBase64 } },
        { referenceType: 'REFERENCE_TYPE_STYLE',   referenceImage: { bytesBase64Encoded: clothBase64 } },
      ],
    }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vertex AI 오류: ${err}`);
  }

  const json = await res.json();
  const resultBase64 = json.predictions?.[0]?.bytesBase64Encoded;
  if (!resultBase64) throw new Error('Vertex AI 결과가 비어있습니다.');
  return resultBase64;
}
