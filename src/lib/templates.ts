/** Starter structures, so a new manual begins with a shape instead of a blank page. */

export type Template = {
  id: string;
  name: string;
  summary: string;
  pages: Array<{ title: string; content: string }>;
};

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "빈 매뉴얼",
    summary: "문서 하나로 시작합니다.",
    pages: [{ title: "시작하기", content: "# 시작하기\n\n내용을 작성하세요.\n" }],
  },
  {
    id: "service",
    name: "웹 서비스 설명서",
    summary: "소개 · 시작하기 · 사용법 · 자주 묻는 질문",
    pages: [
      {
        title: "소개",
        content:
          "# 소개\n\n이 서비스가 무엇이고 누구를 위한 것인지 한 문단으로 설명합니다.\n\n## 주요 기능\n\n- 기능 하나\n- 기능 둘\n- 기능 셋\n",
      },
      {
        title: "시작하기",
        content:
          "# 시작하기\n\n## 계정 만들기\n\n1. 첫 번째 단계\n2. 두 번째 단계\n3. 세 번째 단계\n\n## 처음 해볼 것\n\n가입 직후 가장 먼저 하면 좋은 작업을 안내합니다.\n",
      },
      {
        title: "사용법",
        content:
          "# 사용법\n\n## 기본 흐름\n\n작업을 처음부터 끝까지 따라갈 수 있게 순서대로 적습니다.\n\n> **참고**\n>\n> 주의할 점이 있다면 여기에 적습니다.\n",
      },
      {
        title: "자주 묻는 질문",
        content:
          "# 자주 묻는 질문\n\n## 질문을 여기에 적습니다\n\n답변을 여기에 적습니다.\n\n## 또 다른 질문\n\n답변을 여기에 적습니다.\n",
      },
    ],
  },
  {
    id: "product",
    name: "설치형 제품 설명서",
    summary: "소개 · 설치 · 사용법 · 자주 묻는 질문",
    pages: [
      {
        title: "소개",
        content:
          "# 소개\n\n이 제품이 무엇이고 누구를 위한 것인지 한 문단으로 설명합니다.\n\n## 주요 기능\n\n- 기능 하나\n- 기능 둘\n- 기능 셋\n",
      },
      {
        title: "설치",
        content:
          "# 설치\n\n## 요구 사항\n\n| 항목 | 최소 사양 |\n| --- | --- |\n| 운영체제 |  |\n| 메모리 |  |\n\n## 설치 방법\n\n1. 첫 번째 단계\n2. 두 번째 단계\n3. 세 번째 단계\n",
      },
      {
        title: "사용법",
        content:
          "# 사용법\n\n## 기본 흐름\n\n작업을 처음부터 끝까지 따라갈 수 있게 순서대로 적습니다.\n\n> **참고**\n>\n> 주의할 점이 있다면 여기에 적습니다.\n",
      },
      {
        title: "자주 묻는 질문",
        content:
          "# 자주 묻는 질문\n\n## 질문을 여기에 적습니다\n\n답변을 여기에 적습니다.\n\n## 또 다른 질문\n\n답변을 여기에 적습니다.\n",
      },
    ],
  },
  {
    id: "internal",
    name: "업무 매뉴얼",
    summary: "개요 · 업무 절차 · 담당과 연락처 · 문제 해결",
    pages: [
      {
        title: "개요",
        content:
          "# 개요\n\n이 문서가 다루는 범위와 대상 독자를 적습니다.\n\n## 이 문서를 읽어야 하는 사람\n\n- \n",
      },
      {
        title: "업무 절차",
        content:
          "# 업무 절차\n\n## 1단계\n\n무엇을, 누가, 언제 하는지 적습니다.\n\n## 2단계\n\n\n\n## 3단계\n\n",
      },
      {
        title: "담당과 연락처",
        content:
          "# 담당과 연락처\n\n| 업무 | 담당 | 연락처 |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |\n",
      },
      {
        title: "문제 해결",
        content:
          "# 문제 해결\n\n## 증상\n\n어떤 상황에서 무엇이 잘못되는지 적습니다.\n\n### 확인할 것\n\n- [ ] 확인 항목 하나\n- [ ] 확인 항목 둘\n\n### 해결 방법\n\n",
      },
    ],
  },
  {
    id: "api",
    name: "API 문서",
    summary: "개요 · 인증 · 엔드포인트 · 오류 코드",
    pages: [
      {
        title: "개요",
        content:
          "# 개요\n\n기본 주소와 응답 형식을 적습니다.\n\n```\nhttps://api.example.com/v1\n```\n",
      },
      {
        title: "인증",
        content:
          "# 인증\n\n요청 헤더에 토큰을 담아 보냅니다.\n\n```http\nAuthorization: Bearer <TOKEN>\n```\n",
      },
      {
        title: "엔드포인트",
        content:
          "# 엔드포인트\n\n## GET /items\n\n항목 목록을 반환합니다.\n\n| 파라미터 | 타입 | 필수 | 설명 |\n| --- | --- | --- | --- |\n| `limit` | number | 아니오 | 최대 개수 |\n\n### 응답\n\n```json\n{\n  \"items\": []\n}\n```\n",
      },
      {
        title: "오류 코드",
        content:
          "# 오류 코드\n\n| 코드 | 의미 | 대응 |\n| --- | --- | --- |\n| 400 | 잘못된 요청 |  |\n| 401 | 인증 실패 |  |\n| 404 | 없음 |  |\n| 500 | 서버 오류 |  |\n",
      },
    ],
  },
];
