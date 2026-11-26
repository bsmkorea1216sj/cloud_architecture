import { useEffect, useState } from 'react';

const chapters = [
  { id: 'overview', title: '교육 소개 · 전체 구조', file: 'README.md' },
  { id: 'setup', title: '01. 개발환경 준비', file: '01-setup/README.md' },
  { id: 'classify', title: '02. 이미지 분류·Photoshop', file: '02-classification/README.md' },
  { id: 'codex', title: '03. Codex · GitHub', file: '03-codex-github/README.md' },
  { id: 'gcp', title: '04. GCP Cloud Run 배포', file: '04-gcp/README.md' },
  { id: 'cafe24', title: '05. Cafe24 상품 등록', file: '05-cafe24/README.md' },
  { id: 'operations', title: '06. 운영·검수·확장', file: '06-operations/README.md' },
  { id: 'resources', title: '자료실 · 구조도 · 약어', file: 'diagrams/architecture.md' },
];
const docBase='https://github.com/bsmkorea1216sj/AIEdu/blob/main/cafe24-ai-shopping/';
const samples = [
 ['DEMO-001','면 반팔 티셔츠','의류 / 상의'],['DEMO-002','스테인리스 프라이팬','생활 / 주방'],
 ['DEMO-003','욕실 청소 브러시','생활 / 욕실'],['DEMO-004','데님 청바지','의류 / 하의'],
 ['DEMO-005','다용도 수납함','검수 필요'],
];
const sectionStyle: React.CSSProperties={background:'#fff',padding:'24px',borderRadius:14,border:'1px solid #dfe7f1',marginBottom:17};
const smallText: React.CSSProperties={color:'#52627b',lineHeight:1.8};
const monospace: React.CSSProperties={background:'#14213b',color:'#ecf3ff',padding:18,borderRadius:11,whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:13,lineHeight:1.75};
const paragraph=(text:string)=><p style={smallText}>{text}</p>;
const Body = ({id}:{id:string}) => {
 switch(id) {
 case 'overview':return <><section style={sectionStyle}><h1>AI로 만드는 나만의 쇼핑몰</h1>{paragraph('ChatGPT Codex → GitHub → GCP Cloud Run → Cafe24. 개발부터 상품 분류, 검수 및 등록 미리보기까지 한 흐름으로 학습합니다.')}<p><strong>4시간 기초 과정 · PPT 26장 연동 · 6단계 실습</strong></p></section><section style={sectionStyle}><h2>전체 아키텍처</h2><div className="cafe24-flow">{['① ChatGPT Codex / 코드 작성','② GitHub / 버전 관리','③ GCP Cloud Run / 백엔드 실행','④ Cafe24 / 상품 관리'].map(x=><div key={x}>{x}</div>)}</div><p style={smallText}>GitHub 푸시만으로 자동 배포되지 않습니다. 빌드 및 CI/CD 설정이 필요합니다.</p></section></>;
 case 'setup':return <section style={sectionStyle}><h1>01. 개발환경 준비</h1><p style={smallText}>GitHub 로그인, Codex 사용권한 확인, Python 3.11 이상 준비, 선택적으로 GCP 프로젝트·결제·예산 확인</p><h2>도구별 역할</h2><ul><li>Codex: 코드 생성·수정·테스트</li><li>GitHub: 소스 코드와 변경 기록</li><li>GCP Cloud Run: 백엔드 실행</li><li>Cafe24 Admin API: 쇼핑몰 상품관리 연동</li></ul><p>API 키·토큰·서비스 계정 파일은 GitHub에 업로드하지 않습니다.</p></section>;
 case 'classify':return <><section style={sectionStyle}><h1>02. 상품 이미지 자동 분류·가공</h1>{paragraph('Google Drive 지정 폴더에 상품 이미지를 투입 → PC의 동기화·감시 프로그램에서 감지 → Photoshop 액션/스크립트로 가공 → Downloads 카테고리별 정리 → Cafe24 등록용 미리보기 생성')}<div className="cafe24-flow">{['Drive 이미지 입력','PC 파일 감시','Photoshop 이미지 가공','카테고리별 저장','Cafe24 미리보기'].map(x=><div key={x}>{x}</div>)}</div><p style={smallText}>이 과정은 교육 설계안이며 로컬 자동화 프로그램 및 Photoshop 연동은 별도로 구현·검증해야 합니다.</p></section><section style={sectionStyle}><h2>분류 샘플</h2><table><thead><tr><th>ID</th><th>상품명</th><th>분류</th></tr></thead><tbody>{samples.map(x=><tr key={x[0]}>{x.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table><h2>출력 폴더 예시</h2><pre style={monospace}>{'Google Drive/상품이미지_입력/\nDownloads/cafe24-processed/\n  의류_상의/\n  생활_주방/\n  생활_욕실/\n  검수필요/'}</pre></section></>;
 case 'codex':return <section style={sectionStyle}><h1>03. Codex 개발과 GitHub 연동</h1>{paragraph('요구사항 → Codex 코드 생성 → 샘플 데이터 테스트 → 코드 검토 → GitHub 커밋 및 푸시. 실제 API는 처음부터 호출하지 않습니다.')}<h2>실습 명령</h2><pre style={monospace}>{'git status\ngit add .\ngit commit -m "Add demo product classifier"\ngit push origin main'}</pre><p style={smallText}>개인 연습 저장소 기준 명령입니다. 공유 저장소에서는 별도 브랜치와 Pull Request를 이용합니다.</p></section>;
 case 'gcp':return <section style={sectionStyle}><h1>04. GCP Cloud Run 백엔드 배포</h1><div className="cafe24-flow">{['GitHub','빌드 / 테스트','컨테이너','Cloud Run','HTTPS API'].map(x=><div key={x}>{x}</div>)}</div><h2>교육용 API 예시</h2><ul><li><code>GET /health</code> — 상태 확인</li><li><code>POST /classify</code> — 샘플 상품 분류</li><li><code>POST /products/preview</code> — 등록 미리보기</li></ul><p style={smallText}>Cloud Run 액세스 권한, 인스턴스 제한, 로그 및 예산 알림을 먼저 점검합니다. 예산 알림이 비용을 자동 차단하지는 않습니다.</p></section>;
 case 'cafe24':return <section style={sectionStyle}><h1>05. Cafe24 상품 등록 미리보기</h1>{paragraph('샘플 상품 검수 → 필수값 검증 → 중복 확인 → 승인 요청 → DRY_RUN 미리보기. 실제 상품 등록은 이 기초 교육에서 실행하지 않습니다.')}<h2>모의 등록 JSON</h2><pre style={monospace}>{JSON.stringify({internal_sku:'DEMO-001',product_name:'면 반팔 티셔츠',category_label:'의류/상의',review_status:'approved',dry_run:true},null,2)}</pre><p style={smallText}>이 예시는 교육용 형식으로 Cafe24 공식 API의 요청 스키마와 다릅니다.</p></section>;
 case 'operations':return <section style={sectionStyle}><h1>06. 운영·검수·확장</h1><h2>수강생 최종 체크리스트</h2>{['샘플 상품 5건을 분류했다','검수 대상 상품을 구분했다','등록 미리보기를 확인했다','실제 운영 쇼핑몰은 변경하지 않았다','GitHub 비밀정보 및 GCP 비용을 점검했다'].map(x=><label key={x} style={{display:'block',padding:'10px',marginBottom:8,background:'#f5f7fb',borderRadius:8}}><input type="checkbox" style={{marginRight:10}} />{x}</label>)}<h2>심화 과정</h2><p>공식 API OAuth 권한, 재고·옵션·이미지 연동, 관리자 승인, 중복 등록 방지, 감사 로그, 모니터링</p></section>;
 default:return <section style={sectionStyle}><h1>자료실 · 구조도 · 약어</h1><p><a href={docBase+'diagrams/architecture.md'} target="_blank" rel="noopener noreferrer">아키텍처 구조도 확인</a></p><p><a href="https://github.com/bsmkorea1216sj/AIEdu/tree/main/cafe24-ai-shopping" target="_blank" rel="noopener noreferrer">전체 GitHub MD 교재 열기</a></p><p>API: Application Programming Interface / GCP: Google Cloud Platform / CI/CD: Continuous Integration/Delivery</p></section>;
 }
};
export function Cafe24Guide() {
 const getSection=()=>new URLSearchParams(window.location.search).get('chapter') || 'overview';
 const [current,setCurrent]=useState(()=>chapters.some(x=>x.id===getSection())?getSection():'overview');
 useEffect(()=>{document.title='카페24 AI 쇼핑몰 실습 가이드 | BSM AI EDU';},[]);
 const select=(id:string)=>{setCurrent(id);window.history.replaceState(null,'',window.location.pathname+'?chapter='+id);document.getElementById('cafe24-reader')?.scrollTo({top:0})};
 const chapter=chapters.find(x=>x.id===current)!;
 return <div className="cafe24-guide">
 <style>{`
 .cafe24-guide{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#f5f7fb;color:#182943;font-family:Arial,"Malgun Gothic",sans-serif}
 .cafe24-header{height:62px;min-height:62px;background:#fff;border-bottom:1px solid #dce5f2;display:flex;align-items:center;justify-content:space-between;padding:0 20px;font-weight:800}
 .cafe24-header a{font-size:12px;color:#285fc2;text-decoration:none}
 .cafe24-columns{display:grid;grid-template-columns:clamp(210px,25vw,300px) minmax(0,1fr);height:calc(100dvh - 62px);overflow:hidden}
 .cafe24-nav{background:#fff;border-right:1px solid #dce5f2;overflow-y:auto;overscroll-behavior:contain;padding:20px 12px}
 .cafe24-nav h2{font-size:17px;margin:6px 12px 17px}.cafe24-nav button{display:block;text-align:left;border:none;background:transparent;border-radius:10px;width:100%;padding:12px;color:#435473;cursor:pointer;margin-bottom:5px;font-size:14px}
 .cafe24-nav button.selected{background:#eaf1ff;color:#1c55b3;font-weight:800}.cafe24-nav small{display:block;font:11px Consolas,monospace;color:#8290a5;padding-top:4px;overflow-wrap:anywhere}
 .cafe24-reader{overflow-y:auto;overscroll-behavior:contain;padding:24px clamp(16px,4vw,55px);min-width:0}.cafe24-reader-inner{max-width:1080px;margin:0 auto}
 .cafe24-reader h1{font-size:clamp(21px,3vw,29px);margin:4px 0 22px}.cafe24-reader h2{font-size:19px;margin-top:22px}
 .cafe24-reader ul{padding-left:21px;line-height:2}.cafe24-reader table{border-collapse:collapse;width:100%}.cafe24-reader th,.cafe24-reader td{padding:10px 8px;border-bottom:1px solid #dce5f2;text-align:left;font-size:13px}
 .cafe24-flow{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.cafe24-flow div{flex:1 1 150px;background:#edf3fd;border:1px solid #c6d7f5;border-radius:10px;padding:16px;text-align:center;font-size:13px;font-weight:700}
 @media(max-width:650px){.cafe24-columns{grid-template-columns:130px minmax(0,1fr)}.cafe24-header{padding:0 8px;font-size:13px}.cafe24-nav{padding:10px 5px}.cafe24-nav h2{font-size:13px;margin:3px 5px 9px}.cafe24-nav button{font-size:11px;padding:9px 6px}.cafe24-nav small{font-size:9px}.cafe24-reader{padding:12px 8px}.cafe24-reader section{padding:12px!important}}
 `}</style>
 <header className="cafe24-header"><span>BSM AI EDU | 카페24 AI 쇼핑몰 실습</span><a href="https://github.com/bsmkorea1216sj/AIEdu/tree/main/cafe24-ai-shopping" target="_blank" rel="noopener noreferrer">GitHub MD 교재</a></header>
 <div className="cafe24-columns"><aside className="cafe24-nav" aria-label="고정된 마크다운 목차"><h2>실습 가이드 목차</h2>{chapters.map(x=><button key={x.id} type="button" aria-current={current===x.id?'page':undefined} className={current===x.id?'selected':''} onClick={()=>select(x.id)}>{x.title}<small>{x.file}</small></button>)}</aside><main className="cafe24-reader" id="cafe24-reader"><div className="cafe24-reader-inner"><div style={{fontSize:12,color:'#72819b',marginBottom:17}}>카페24 AI 쇼핑몰 자동화 / {chapter.title}</div><Body id={current}/><a href={docBase+chapter.file} target="_blank" rel="noopener noreferrer">원본 MD 문서 보기 ↗</a></div></main></div>
 </div>
}
