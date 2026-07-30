document.addEventListener('DOMContentLoaded',()=>{
  const body=document.body;
  const enhancementStyle=document.createElement('link');
  enhancementStyle.rel='stylesheet';
  enhancementStyle.href='assets/css/luxury-enhancements.css';
  document.head.appendChild(enhancementStyle);

  const restorePageState=()=>{
    body.classList.remove('page-leaving');
    body.classList.add('page-ready');
    body.style.opacity='';
    body.style.transform='';
  };

  requestAnimationFrame(restorePageState);

  const progress=document.createElement('div');
  progress.className='scroll-progress';
  progress.innerHTML='<span></span>';
  body.prepend(progress);
  const progressBar=progress.firstElementChild;
  const topbar=document.querySelector('.topbar');
  const menuButton=document.getElementById('menuButton');
  const mobileMenu=document.getElementById('mobileMenu');
  const backTop=document.getElementById('backToTop');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const requestCard=document.querySelector('.service-card.request');
  if(requestCard){
    requestCard.href='request-reception.html';
    requestCard.removeAttribute('target');
    requestCard.removeAttribute('rel');
    const requestLink=requestCard.querySelector('.card-link');
    if(requestLink)requestLink.innerHTML='فتح صفحة الطلبات <i class="fa-solid fa-arrow-left"></i>';
  }

  menuButton?.addEventListener('click',()=>{
    const open=mobileMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded',String(open));
  });

  mobileMenu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    mobileMenu.classList.remove('open');
    menuButton?.setAttribute('aria-expanded','false');
  }));

  const updateScrollUI=()=>{
    const scrollTop=window.scrollY;
    const max=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);
    progressBar.style.width=`${Math.min(scrollTop/max*100,100)}%`;
    topbar?.classList.toggle('is-scrolled',scrollTop>24);
    backTop?.classList.toggle('show',scrollTop>500);
  };

  window.addEventListener('scroll',updateScrollUI,{passive:true});
  window.addEventListener('resize',updateScrollUI,{passive:true});
  updateScrollUI();

  backTop?.addEventListener('click',()=>window.scrollTo({
    top:0,
    behavior:reducedMotion?'auto':'smooth'
  }));

  const revealItems=[...document.querySelectorAll('.reveal')];
  revealItems.forEach((el,index)=>{
    if(!el.dataset.reveal){
      const patterns=['left','scale','right','scale'];
      el.dataset.reveal=patterns[index%patterns.length];
    }
    if(!reducedMotion)el.style.transitionDelay=`${Math.min((index%5)*70,280)}ms`;
  });

  if('IntersectionObserver'in window&&!reducedMotion){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    revealItems.forEach(el=>observer.observe(el));
  }else{
    revealItems.forEach(el=>el.classList.add('in'));
  }

  const cards=document.querySelectorAll('.service-card,.tool-card,.district,.trust-card,.feature-main,.feature-side');
  cards.forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(reducedMotion||window.innerWidth<900)return;
      const rect=card.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width;
      const y=(event.clientY-rect.top)/rect.height;
      card.style.setProperty('--pointer-x',`${x*100}%`);
      card.style.setProperty('--pointer-y',`${y*100}%`);
    });
    card.addEventListener('pointerleave',()=>{
      card.style.removeProperty('--pointer-x');
      card.style.removeProperty('--pointer-y');
    });
  });

  document.querySelectorAll('.btn,.icon-btn,.menu-btn').forEach(button=>button.addEventListener('pointerdown',event=>{
    if(reducedMotion)return;
    const rect=button.getBoundingClientRect();
    const size=Math.max(rect.width,rect.height);
    const ripple=document.createElement('span');
    ripple.className='ripple';
    ripple.style.width=ripple.style.height=`${size}px`;
    ripple.style.right=`${rect.right-event.clientX-size/2}px`;
    ripple.style.top=`${event.clientY-rect.top-size/2}px`;
    button.appendChild(ripple);
    setTimeout(()=>ripple.remove(),650);
  }));

  const sectionLinks=[...document.querySelectorAll('.navlinks a[href^="#"]')];
  const sections=sectionLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver'in window&&sections.length){
    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          sectionLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`));
        }
      });
    },{rootMargin:'-35% 0px -55% 0px',threshold:0});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  document.querySelectorAll('a[href]').forEach(link=>{
    const href=link.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||link.target==='_blank')return;
    link.addEventListener('click',event=>{
      if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin)return;
      event.preventDefault();
      if(reducedMotion){
        location.href=url.href;
        return;
      }
      body.classList.add('page-leaving');
      setTimeout(()=>location.href=url.href,220);
    });
  });

  document.querySelectorAll('img:not([loading])').forEach((img,index)=>{
    if(index>0)img.loading='lazy';
    img.decoding='async';
  });

  const escapeHtml=value=>{
    const element=document.createElement('div');
    element.textContent=value||'';
    return element.innerHTML;
  };

  const renderFacebookFeed=async()=>{
    const toolsSection=document.getElementById('tools');
    if(!toolsSection)return;

    const style=document.createElement('style');
    style.textContent=`
      .facebook-feed{padding-top:10px}
      .facebook-feed-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:18px}
      .facebook-feed-head h2{margin:.35rem 0 0}
      .facebook-feed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      .facebook-feed-card{overflow:hidden;border:1px solid rgba(229,192,123,.16);border-radius:20px;background:rgba(255,255,255,.025)}
      .facebook-feed-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
      .facebook-feed-content{padding:18px}
      .facebook-feed-date{display:inline-flex;align-items:center;gap:7px;margin-bottom:10px;color:#d7bd85;font-size:.82rem}
      .facebook-feed-content p{display:-webkit-box;overflow:hidden;margin:0 0 15px;line-height:1.8;-webkit-line-clamp:4;-webkit-box-orient:vertical}
      .facebook-feed-content a{display:inline-flex;align-items:center;gap:8px;color:#f4d99f;font-weight:800;text-decoration:none}
      .facebook-feed-status{grid-column:1/-1;padding:24px;text-align:center;border:1px solid rgba(229,192,123,.12);border-radius:18px;background:rgba(255,255,255,.02)}
      @media(max-width:850px){.facebook-feed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.facebook-feed-head{align-items:stretch;flex-direction:column}.facebook-feed-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const section=document.createElement('section');
    section.className='section facebook-feed';
    section.setAttribute('aria-labelledby','facebookFeedTitle');
    section.innerHTML=`
      <div class="wrap">
        <div class="facebook-feed-head reveal in">
          <div><span class="kicker">آخر التحديثات</span><h2 id="facebookFeedTitle">أخبار المكتب على فيسبوك</h2></div>
          <a class="btn ghost" href="https://www.facebook.com/aleimad7aden/" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i> زيارة الصفحة</a>
        </div>
        <div id="facebookFeedGrid" class="facebook-feed-grid" aria-live="polite" aria-busy="true">
          <p class="facebook-feed-status">جارٍ تحميل آخر المنشورات...</p>
        </div>
      </div>`;
    toolsSection.parentNode.insertBefore(section,toolsSection);

    const grid=section.querySelector('#facebookFeedGrid');
    try{
      const response=await fetch('/api/facebook-posts',{headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok||!Array.isArray(data.posts))throw new Error('Unable to load posts');
      if(!data.posts.length){
        grid.innerHTML='<p class="facebook-feed-status">لا توجد منشورات متاحة حاليًا.</p>';
        return;
      }
      const dateFormatter=new Intl.DateTimeFormat('ar',{year:'numeric',month:'long',day:'numeric'});
      grid.innerHTML=data.posts.map(post=>{
        const image=post.image?`<img src="${escapeHtml(post.image)}" alt="صورة منشور مكتب عماد عدن العقاري" loading="lazy" decoding="async">`:'';
        const date=post.publishedAt?dateFormatter.format(new Date(post.publishedAt)):'';
        return `<article class="facebook-feed-card">${image}<div class="facebook-feed-content"><span class="facebook-feed-date"><i class="fa-regular fa-calendar"></i>${escapeHtml(date)}</span><p>${escapeHtml(post.message)}</p><a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">للمزيد اضغط <i class="fa-solid fa-arrow-left"></i></a></div></article>`;
      }).join('');
    }catch(error){
      grid.innerHTML='<p class="facebook-feed-status">تعذر تحميل منشورات فيسبوك حاليًا. <a href="https://www.facebook.com/aleimad7aden/" target="_blank" rel="noopener">زيارة صفحة المكتب</a></p>';
    }finally{
      grid.setAttribute('aria-busy','false');
    }
  };

  renderFacebookFeed();

  const year=document.getElementById('year');
  if(year)year.textContent=new Date().getFullYear();

  window.addEventListener('pageshow',event=>{
    restorePageState();
    mobileMenu?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded','false');
    updateScrollUI();
    if(event.persisted){
      revealItems.forEach(el=>el.classList.add('in'));
    }
  });

  window.addEventListener('pagehide',()=>{
    body.classList.remove('page-leaving');
  });
});
