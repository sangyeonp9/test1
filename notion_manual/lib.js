const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,ImageRun,HeadingLevel,AlignmentType,WidthType,ShadingType,BorderStyle,LevelFormat,PageBreak,TableOfContents,Footer,PageNumber,VerticalAlign}=require('docx');
const F="맑은 고딕", W=9638, P="37352F";
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


module.exports={Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,ImageRun,HeadingLevel,AlignmentType,WidthType,ShadingType,BorderStyle,LevelFormat,PageBreak,Footer,PageNumber,F,W,P,img,t,p,h1,h2,bl,nl,B,table,box,sp,tip,warn};
