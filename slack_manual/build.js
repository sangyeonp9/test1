const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,ImageRun,HeadingLevel,AlignmentType,WidthType,ShadingType,BorderStyle,LevelFormat,PageBreak,TableOfContents,Footer,PageNumber,VerticalAlign}=require('docx');
const F="맑은 고딕", W=9638, P="4A154B";
const img=(n,w,h)=>new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:120,after:120},children:[new ImageRun({type:"png",data:fs.readFileSync(`img/${n}.png`),transformation:{width:w,height:h},altText:{title:n,description:n,name:n}})]});
const t=(s,o={})=>new TextRun({text:s,font:F,...o});
const p=(s,o={})=>new Paragraph({spacing:{after:100,line:320},...o,children:Array.isArray(s)?s:[t(s)]});
const h1=s=>new Paragraph({heading:HeadingLevel.HEADING_1,children:[t(s)]});
const h2=s=>new Paragraph({heading:HeadingLevel.HEADING_2,children:[t(s)]});
const bl=s=>new Paragraph({numbering:{reference:"b",level:0},spacing:{after:60},children:Array.isArray(s)?s:[t(s)]});
const nl=(s,ref)=>new Paragraph({numbering:{reference:ref,level:0},spacing:{after:60},children:Array.isArray(s)?s:[t(s)]});
const B=s=>t(s,{bold:true});
const bd={style:BorderStyle.SINGLE,size:4,color:"BBBBBB"};const borders={top:bd,bottom:bd,left:bd,right:bd};
const cell=(c,w,o={})=>new TableCell({width:{size:w,type:WidthType.DXA},borders,verticalAlign:VerticalAlign.CENTER,margins:{top:80,bottom:80,left:120,right:120},shading:o.fill?{type:ShadingType.CLEAR,fill:o.fill,color:"auto"}:undefined,children:[new Paragraph({alignment:o.center?AlignmentType.CENTER:AlignmentType.LEFT,children:[t(c,{bold:o.bold,color:o.color,size:21})]})]});
function table(widths,head,rows){return new Table({width:{size:W,type:WidthType.DXA},columnWidths:widths,rows:[
 new TableRow({tableHeader:true,children:head.map((h,i)=>cell(h,widths[i],{fill:P,bold:true,color:"FFFFFF",center:true}))}),
 ...rows.map((r,ri)=>new TableRow({children:r.map((c,i)=>cell(c,widths[i],{fill:ri%2?"F7F1F7":undefined,bold:i==0}))}))]});}
function box(title,lines,fill,bc){const b={style:BorderStyle.SINGLE,size:8,color:bc};return new Table({width:{size:W,type:WidthType.DXA},columnWidths:[W],rows:[new TableRow({children:[new TableCell({width:{size:W,type:WidthType.DXA},borders:{top:b,bottom:b,left:{style:BorderStyle.SINGLE,size:36,color:bc},right:b},shading:{type:ShadingType.CLEAR,fill,color:"auto"},margins:{top:100,bottom:100,left:200,right:200},children:[new Paragraph({spacing:{after:60},children:[t(title,{bold:true,color:bc})]}),...lines.map(l=>new Paragraph({spacing:{after:40,line:300},children:[t(l,{size:21})]}))]})]})]});}
const sp=()=>new Paragraph({spacing:{after:80},children:[]});
const tip=(l)=>[box("💡 TIP",l,"FFF8E1","E8912D"),sp()];
const warn=(l)=>[box("⚠️ 주의",l,"FDECEF","E01E5A"),sp()];

const c=[];
// cover
c.push(new Paragraph({spacing:{before:3200,after:200},alignment:AlignmentType.CENTER,children:[t("Slack",{size:96,bold:true,color:P})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:200},children:[t("처음 사용하는 분을 위한",{size:34,color:"555555"})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:600},border:{bottom:{style:BorderStyle.SINGLE,size:12,color:P,space:12}},children:[t("사용 설명서",{size:60,bold:true})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:600},children:[t("가입부터 메시지·파일 공유, 알림 설정까지 한눈에",{size:26,color:"555555"})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:400},children:[t("※ 화면 구성과 메뉴 이름은 버전·운영체제에 따라 조금 다를 수 있습니다.",{size:20,color:"888888"})]}));
c.push(new Paragraph({children:[new PageBreak()]}));
c.push(new Paragraph({spacing:{after:200},children:[t("목차",{size:36,bold:true,color:P})]}));
c.push(table([1000,3400,5238],["장","제목","내용"],[["1","Slack이란?","Slack 소개, 용어 정리"],["2","시작하기","가입·설치·프로필 설정"],["3","화면 구성 익히기","6개 영역 설명"],["4","채널과 DM 사용하기","참여·생성·DM 보내기"],["5","메시지 보내기","서식·멘션·스레드·이모지"],["6","파일 공유와 검색","파일 업로드, 검색 필터, 저장"],["7","알림과 상태 설정","알림 조절, 방해 금지"],["8","유용한 기능","허들, 예약, 슬래시 명령"],["9","사용 에티켓","권장·비권장 행동"],["10","FAQ","자주 묻는 질문"],["부록","단축키 모음","Windows / Mac"]]));
c.push(new Paragraph({children:[new PageBreak()]}));

c.push(h1("1. Slack이란?"));
c.push(p([B("Slack"),t("은 회사·팀 안에서 대화하고 자료를 공유하는 "),B("업무용 메신저"),t("입니다. 카카오톡처럼 채팅하지만, 주제별 대화방(채널)으로 업무를 깔끔하게 나눌 수 있습니다.")]));
c.push(h2("1-1. 이메일·카카오톡과 무엇이 다른가요?"));
c.push(table([2200,2480,2480,2478],["구분","이메일","개인 메신저","Slack"],[
["대화 방식","편지 주고받기","친구와 대화","주제별 채널 대화"],
["속도","느림","빠름","빠름"],
["업무 정리","폴더로 정리","정리 어려움","채널·스레드로 정리"],
["자료 검색","메일함 검색","대화 내용 검색 한계","메시지·파일 통합 검색"],
["신규 입사자","지난 메일 공유 필요","지난 대화 못 봄","공개 채널 기록 열람"]]));
c.push(sp());
c.push(h2("1-2. Slack의 구조 한눈에 보기"));
c.push(img("struct",600,207));
c.push(table([2400,7238],["용어","쉬운 설명"],[
["워크스페이스","우리 회사(팀)만의 Slack 공간. 하나의 건물이라고 생각하세요."],
["채널 (#)","주제·팀·프로젝트별 대화방. 건물 안의 '회의실'과 같습니다."],
["DM","특정 사람과 나누는 비공개 대화 (1:1 또는 그룹)."],
["스레드","메시지 하나에 이어 붙이는 답글 공간. 대화가 섞이지 않게 해줍니다."],
["멘션 (@)","특정 사람을 호출해 알림을 보내는 기능."]]));
c.push(new Paragraph({children:[new PageBreak()]}));

c.push(h1("2. 시작하기"));
c.push(img("flow",600,109));
c.push(h2("2-1. 가입 및 로그인"));
[ "회사에서 받은 초대 메일의 [Slack 참여하기] 버튼을 클릭합니다.",
  "이름과 비밀번호를 입력해 계정을 만듭니다. (또는 Google 계정으로 계속하기)",
  "워크스페이스 이름(예: 우리회사)이 보이면 입장이 완료됩니다."].forEach(s=>c.push(nl(s,"n1")));
c.push(sp());
c.push(h2("2-2. 설치 방법"));
c.push(table([2000,3800,3838],["환경","방법","특징"],[
["웹 브라우저","주소창에 회사 Slack 주소(회사명.slack.com) 입력","설치 없이 바로 사용"],
["PC 앱","slack.com/downloads 에서 Windows/Mac 앱 설치","알림이 빠르고 편리 (권장)"],
["모바일 앱","App Store / Google Play 에서 'Slack' 검색 후 설치","외출 중에도 확인"]]));
c.push(sp());
c.push(h2("2-3. 프로필 설정"));
c.push(p("화면 좌측 하단(또는 우측 상단)의 내 사진을 클릭 → [프로필] 에서 아래 항목을 입력하세요. 동료가 나를 쉽게 알아볼 수 있습니다."));
c.push(bl("프로필 사진: 얼굴이 보이는 사진 권장"));
c.push(bl("표시 이름: 예) 홍길동 (마케팅팀)"));
c.push(bl("직책·연락처 등 추가 정보"));
c.push(sp());

c.push(new Paragraph({children:[new PageBreak()]}));
c.push(h1("3. 화면 구성 익히기"));
c.push(p("Slack 화면은 크게 6곳으로 나뉩니다. 아래 그림의 번호와 표를 함께 확인하세요."));
c.push(img("layout",600,349));
c.push(table([900,2300,6438],["번호","이름","역할"],[
["1","왼쪽 메뉴바","홈, DM, 활동(알림), 파일 등 큰 메뉴로 이동"],
["2","사이드바","내가 참여한 채널과 DM 목록. 클릭하면 해당 대화방이 열림"],
["3","검색창","메시지·파일·사람을 찾는 곳"],
["4","채널 이름/정보","현재 채널 이름과 참여 인원. 클릭하면 상세 정보 확인"],
["5","메시지 영역","대화 내용. 이모지 반응(👍)과 스레드 답글이 함께 표시됨"],
["6","메시지 입력창","메시지를 쓰고 서식·첨부·멘션·전송을 하는 곳"]]));

c.push(h1("4. 채널과 DM 사용하기"));
c.push(h2("4-1. 채널 vs DM 비교"));
c.push(table([2000,3819,3819],["구분","채널 (#)","DM"],[
["대화 대상","팀·주제·프로젝트 단위 여러 명","1명 또는 소수(최대 9명)"],
["공개 여부","공개(누구나 참여) / 비공개(초대만)","참여자만 볼 수 있음"],
["적합한 용도","공지, 업무 논의, 자료 공유","간단한 질문, 개인 요청"],
["나중에 입사한 사람","이전 대화 열람 가능(공개 채널)","열람 불가"]]));
c.push(sp());
c.push(h2("4-2. 채널 참여하기"));
["사이드바 [채널] 옆의 ⋮ 또는 [+] 를 클릭합니다.","[채널 둘러보기]를 선택합니다.","관심 있는 채널을 찾아 [참여하기]를 누릅니다."].forEach(s=>c.push(nl(s,"n2")));
c.push(sp());
c.push(h2("4-3. 채널 만들기"));
["사이드바 [채널] 옆 [+] → [채널 만들기]를 클릭합니다.","채널 이름을 입력합니다. (예: 마케팅팀, 프로젝트-a / 소문자·띄어쓰기 대신 하이픈 권장)","공개 또는 비공개를 선택하고 [만들기]를 누릅니다.","함께할 멤버를 초대합니다."].forEach(s=>c.push(nl(s,"n3")));
c.push(sp());
c.push(...tip(["채널 이름 앞에 말머리를 붙이면 찾기 쉽습니다.  예) 팀-마케팅, 프로젝트-신제품, 공지-전체"]));
c.push(h2("4-4. DM 보내기"));
["왼쪽 메뉴의 [DM]을 클릭합니다.","[새 메시지](연필 아이콘)를 클릭합니다.","받는 사람 이름을 입력해 선택하고 메시지를 보냅니다. 여러 명을 선택하면 그룹 DM이 됩니다."].forEach(s=>c.push(nl(s,"n4")));

c.push(h1("5. 메시지 보내기"));
c.push(h2("5-1. 기본 입력창 기능"));
c.push(table([2000,2400,5238],["아이콘","기능","사용 방법"],[
["B  I","서식","굵게·기울임·취소선 적용 (글자 선택 후 클릭)"],
["🔗","링크","웹 주소를 글자에 연결"],
["😀","이모지","감정 표현 이모지 삽입"],
["@","멘션","@이름 입력 → 해당 사람에게 알림 전송"],
["📎","파일 첨부","문서·이미지·영상 업로드"],
["▶","보내기","메시지 전송 (키보드 Enter)"]]));
c.push(sp());
c.push(...tip(["Enter = 전송,  Shift + Enter = 줄바꿈  (한 번에 길게 쓸 때 유용)"]));
c.push(h2("5-2. 멘션(@) 사용법"));
c.push(table([2600,3400,3638],["입력","알림 대상","언제 쓰나요?"],[
["@홍길동","홍길동 한 명","특정 사람에게 확인·요청할 때"],
["@channel","채널의 모든 멤버","꼭 알려야 하는 중요 공지"],
["@here","지금 접속 중인 멤버","지금 바로 답이 필요한 질문"]]));
c.push(sp());
c.push(...warn(["@channel 은 모든 사람에게 알림이 가므로 정말 중요한 때만 사용하세요."]));
c.push(h2("5-3. 스레드로 답글 달기"));
c.push(p("여러 대화가 섞이지 않도록 '답글'은 스레드로 이어 붙이세요."));
["답글을 달 메시지에 마우스를 올립니다.","[스레드에서 답글 달기] (💬)를 클릭합니다.","오른쪽에 열린 창에 답글을 입력합니다."].forEach(s=>c.push(nl(s,"n5")));
c.push(sp());
c.push(h2("5-4. 이모지 반응"));
c.push(p("메시지에 마우스를 올리고 [😀+] 를 클릭하면 이모지로 간단히 반응할 수 있습니다. 확인했다는 뜻으로 ✅ 나 👍 를 쓰면 별도 답글 없이도 소통이 됩니다."));
c.push(h2("5-5. 보낸 메시지 수정·삭제"));
c.push(p("내 메시지에 마우스를 올리고 [⋮ 더보기] → [메시지 수정] 또는 [메시지 삭제]를 선택합니다."));

c.push(h1("6. 파일 공유와 검색"));
c.push(h2("6-1. 파일 공유하기"));
c.push(table([3000,6638],["방법","설명"],[
["📎 버튼 클릭","컴퓨터에서 파일 선택 후 업로드"],
["끌어다 놓기","파일을 대화창 위로 드래그 & 드롭"],
["붙여넣기","복사한 이미지를 입력창에 Ctrl + V"]]));
c.push(sp());
c.push(h2("6-2. 검색하기"));
c.push(p("화면 상단의 검색창에 단어를 입력하세요. 메시지, 파일, 사람, 채널을 모두 찾을 수 있습니다."));
c.push(table([3200,6438],["검색 필터 예시","의미"],[
["회의록 from:@홍길동","홍길동이 쓴 '회의록' 메시지"],
["견적서 in:#마케팅팀","마케팅팀 채널 안에서 '견적서' 검색"],
["보고서 has:link","링크가 포함된 '보고서' 메시지"],
["계약 after:2026-01-01","2026년 1월 1일 이후 메시지"]]));
c.push(sp());
c.push(h2("6-3. 중요한 메시지 저장하기"));
c.push(p("메시지에 마우스를 올려 [🔖 저장]을 누르면 나중에 [저장됨] 목록에서 다시 볼 수 있습니다. 할 일을 잊지 않는 데 유용합니다."));

c.push(h1("7. 알림과 상태 설정"));
c.push(h2("7-1. 알림 설정하기"));
c.push(p("내 사진 → [환경설정] → [알림] 에서 설정합니다. 너무 많은 알림은 업무를 방해하므로 아래를 추천합니다."));
c.push(table([3000,3200,3438],["알림 범위","받는 상황","추천 대상"],[
["모든 새 메시지","모든 대화마다 알림","소수 인원의 긴급 채널"],
["DM·멘션·키워드만","나를 직접 부르거나 지정한 단어가 나올 때","대부분의 사용자 (권장)"],
["없음","알림 없음","집중이 필요한 시간"]]));
c.push(sp());
c.push(h2("7-2. 채널별 알림 끄기"));
c.push(p("채널 이름 클릭 → [알림 설정] → [음소거]를 선택하면 해당 채널 알림이 꺼지고, 필요할 때 들어가 확인할 수 있습니다."));
c.push(h2("7-3. 상태 표시와 방해 금지"));
c.push(table([2600,2400,4638],["상태","표시","활용 예"],[
["🟢 접속 중","초록 점","대화 가능"],
["🍽 식사 중 / 🗓 회의 중","직접 설정한 이모지","동료에게 부재 사유 공유"],
["🏝 휴가 중","직접 설정","휴가 기간 안내"],
["🔕 방해 금지","알림 일시 중지","퇴근 후, 집중 근무 시간"]]));
c.push(sp());
c.push(p("설정 방법: 내 사진 클릭 → [상태 업데이트] 또는 [알림 일시 중지]."));

c.push(h1("8. 유용한 기능 더 알아보기"));
c.push(table([2400,4000,3238],["기능","설명","사용 방법"],[
["허들 (Huddle)","음성·화면 공유를 하는 가벼운 통화","채널/DM 상단 🎧 클릭"],
["알림 예약","메시지를 원하는 시간에 보내기","▶ 옆 화살표 → 예약 전송"],
["미리 알림","나중에 다시 알려달라고 설정","메시지 ⋮ → 미리 알림"],
["슬래시 명령","/ 로 시작하는 빠른 명령","입력창에 / 입력"],
["앱 연결","구글 캘린더·드라이브 등 연동","사이드바 [앱] 에서 추가"]]));
c.push(sp());
c.push(h2("자주 쓰는 슬래시 명령"));
c.push(table([3000,6638],["명령","기능"],[
["/remind","정해둔 시간에 알림 받기 (예: /remind me 내일 9시 보고서 제출)"],
["/status","내 상태 설정"],
["/dnd","방해 금지 시작"],
["/invite","채널에 사람 초대"]]));
c.push(sp());

c.push(h1("9. 이것만은 지켜요! 사용 에티켓"));
c.push(table([900,3900,4838],["","이렇게 하세요 ✅","이렇게는 피하세요 ❌"],[
["1","적절한 채널에 올리기","관련 없는 채널에 아무 말이나 올리기"],
["2","답글은 스레드로 달기","새 메시지로 대화 흐름 끊기"],
["3","한 번에 완결된 문장으로 쓰기","한 줄씩 여러 번 나눠 보내기"],
["4","@channel 은 꼭 필요할 때만","사소한 일에 전체 호출"],
["5","확인은 이모지 반응(✅)으로","'넵', '확인' 같은 불필요 메시지 반복"],
["6","업무 시간 외에는 방해 금지 설정","퇴근 후에도 즉답을 기대"]]));
c.push(sp());

c.push(h1("10. 자주 묻는 질문 (FAQ)"));
c.push(table([3600,6038],["질문","답변"],[
["실수로 메시지를 잘못 보냈어요.","메시지의 ⋮ → [메시지 삭제] 또는 [수정] (관리자 설정에 따라 제한될 수 있음)"],
["채널에서 나가고 싶어요.","채널 이름 클릭 → [나가기]"],
["알림이 너무 많이 와요.","환경설정 → 알림에서 'DM·멘션만'으로 변경, 불필요한 채널은 음소거"],
["예전 대화를 찾고 싶어요.","검색창에 키워드를 넣고 from:, in: 필터 사용"],
["비밀번호를 잊어버렸어요.","로그인 화면 [비밀번호를 잊으셨나요?] 클릭 후 메일 안내를 따름"],
["모바일에서도 쓸 수 있나요?","네. 같은 계정으로 앱에 로그인하면 PC와 동기화됩니다."]]));
c.push(sp());
c.push(h1("부록. 단축키 모음"));
c.push(table([3600,3019,3019],["기능","Windows","Mac"],[
["빠른 이동(채널·DM 찾기)","Ctrl + K","⌘ + K"],
["검색","Ctrl + G","⌘ + G"],
["줄바꿈","Shift + Enter","Shift + Return"],
["메시지 전송","Enter","Return"],
["마지막 메시지 수정","↑ (입력창 비었을 때)","↑ (입력창 비었을 때)"],
["단축키 목록 보기","Ctrl + /","⌘ + /"]]));
c.push(sp());
c.push(box("📌 한 줄 요약",["① 채널에서 팀 대화  ② 스레드로 답글  ③ @멘션으로 호출  ④ 검색으로 자료 찾기  ⑤ 알림은 내게 맞게 조절"],"F3E8F4",P));

const doc=new Document({
 styles:{default:{document:{run:{font:F,size:22}},
  heading1:{run:{font:F,size:34,bold:true,color:P},paragraph:{spacing:{before:360,after:160},keepNext:true,outlineLevel:0}},
  heading2:{run:{font:F,size:26,bold:true,color:"1264A3"},paragraph:{spacing:{before:240,after:120},keepNext:true,outlineLevel:1}}},
  paragraphStyles:[
   {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{font:F,size:34,bold:true,color:P},paragraph:{spacing:{before:360,after:160},keepNext:true,outlineLevel:0,border:{bottom:{style:BorderStyle.SINGLE,size:8,color:P,space:4}}}},
   {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{font:F,size:26,bold:true,color:"1264A3"},paragraph:{spacing:{before:240,after:120},keepNext:true,outlineLevel:1}}]},
 numbering:{config:[{reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
  ...["n1","n2","n3","n4","n5"].map(r=>({reference:r,levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]}))]},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},
  footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[t("Slack 사용 설명서  |  ",{size:18,color:"888888"}),new TextRun({children:[PageNumber.CURRENT],font:F,size:18,color:"888888"})]})]})},
  children:c}]});
Packer.toBuffer(doc).then(b=>{fs.writeFileSync("Slack_사용설명서.docx",b)});
