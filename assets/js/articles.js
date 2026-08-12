const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
function norm(s){return (s||'').toString().toLowerCase().trim()}
function card(a,base=''){return `<article class="card" data-title="${a.title}" data-category="${a.category}" data-views="${a.views}" data-reading="${a.readingTime}" data-updated="${a.updated}" data-search="${[a.title,a.description,a.category,(a.keywords||[]).join(' '),a.content||''].join(' ')}"><i class="fa-solid ${a.icon}"></i><h3>${a.title}</h3><p>${a.description}</p><div class="meta"><span>${a.category}</span><span>${a.readingTime} دقائق</span><span>${a.updated}</span><span>${a.views} مشاهدة</span></div><a class="btn" href="${base}${a.slug}.html">اقرأ المزيد</a></article>`}
function initKnowledge(articles,base=''){const grid=$('#cards'),q=$('#q'),cat=$('#categoryFilter'),sort=$('#sortFilter'),count=$('#resultCount'),empty=$('.empty'),sug=$('#suggestions');let all=[...articles];function render(){let term=norm(q?.value),c=cat?.value||'all',list=all.filter(a=>(c==='all'||a.category===c)&&(!term||norm([a.title,a.description,a.category,(a.keywords||[]).join(' '),a.content].join(' ')).includes(term)));let mode=sort?.value||'latest';list.sort((a,b)=>mode==='popular'?b.views-a.views:mode==='alpha'?a.title.localeCompare(b.title,'ar'):mode==='reading'?a.readingTime-b.readingTime:new Date(b.updated)-new Date(a.updated));grid.innerHTML=list.map(a=>card(a,base)).join('');count&&(count.textContent=`${list.length} نتيجة`);empty&&(empty.style.display=list.length?'none':'block')}[q,cat,sort].forEach(el=>el&&el.addEventListener('input',render));q&&q.addEventListener('input',()=>{let term=norm(q.value);sug.innerHTML=term?all.filter(a=>norm(a.title+a.description+a.category+(a.keywords||[]).join(' ')).includes(term)).slice(0,6).map(a=>`<a href="${base}${a.slug}.html">${a.title} <small>— ${a.category}</small></a>`).join(''):'';sug.style.display=sug.innerHTML?'block':'none'});setTimeout(()=>{$('.skeleton')?.remove();render()},250)}
addEventListener('scroll',()=>{let h=document.documentElement;let p=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;let bar=$('.progress');if(bar)bar.style.width=p+'%';let top=$('.to-top');if(top)top.style.display=h.scrollTop>420?'block':'none'});function copyLink(){navigator.clipboard&&navigator.clipboard.writeText(location.href)}function printPdf(){print()}

(() => {
  if (window.__pageSectionCardsRequested) return;
  window.__pageSectionCardsRequested = true;
  const loader = document.createElement('script');
  const currentSource = document.currentScript?.src || new URL('./assets/js/articles.js', document.baseURI).href;
  loader.src = new URL('page-section-cards.js', currentSource).href;
  loader.async = false;
  document.head.appendChild(loader);
})();
