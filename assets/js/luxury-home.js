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
      .facebook-feed-slider{position:relative;overflow:hidden;border-radius:24px}
      .facebook-feed-track{display:flex;transition:transform .55s ease;will-change:transform;touch-action:pan-y}
      .facebook-feed-slide{min-width:100%;padding:1px}
      .facebook-feed-card{overflow:hidden;border:1px solid rgba(229,192,123,.16);border-radius:22px;background:rgba(255,255,255,.025)}
      .facebook-feed-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
      .facebook-feed-content{padding:20px}
      .facebook-feed-date{display:inline-flex;align-items:center;gap:7px;margin-bottom:10px;color:#d7bd85;font-size:.82rem}
      .facebook-feed-content p{display:-webkit-box;overflow:hidden;margin:0 0 15px;line-height:1.9;-webkit-line-clamp:5;-webkit-box-orient:vertical}
      .facebook-feed-content a{display:inline-flex;align-items:center;gap:8px;color:#f4d99f;font-weight:800;text-decoration:none}
      .facebook-feed-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px}
      .facebook-feed-arrow{width:44px;height:44px;border:1px solid rgba(229,192,123,.28);border-radius:50%;background:rgba(255,255,255,.035);color:#f4d99f;cursor:pointer}
      .facebook-feed-dots{display:flex;align-items:center;gap:7px}
      .facebook-feed-dot{width:9px;height:9px;border:0;border-radius:50%;background:rgba(244,217,159,.28);padding:0;cursor:pointer}
      .facebook-feed-dot.active{width:26px;border-radius:10px;background:#f4d99f}
      .facebook-feed-status{padding:24px;text-align:center;border:1px solid rgba(229,192,123,.12);border-radius:18px;background:rgba(255,255,255,.02)}
      @media(max-width:600px){.facebook-feed-head{align-items:stretch;flex-direction:column}.facebook-feed-content{padding:16px}.facebook-feed-arrow{width:40px;height:40px}}
      @media(prefers-reduced-motion:reduce){.facebook-feed-track{transition:none}}
    `;
    document.head.appendChild(style);

    const section=document.createElement('section');
    section.className='section facebook-feed';
    section.setAttribute('aria-labelledby','facebookFeedTitle');
    section.innerHTML=`
      <div class="wrap">
        <div class="facebook-feed-head reveal in">
          <div><span class="kicker">آخر التحديثات</span><h2 id="facebookFeedTitle">مستجدات المكتب</h2></div>
        </div>
        <div id="facebookFeedContainer" aria-live="polite" aria-busy="true">
          <p class="facebook-feed-status">جارٍ تحميل آخر المنشورات...</p>
        </div>
      </div>`;
    toolsSection.parentNode.insertBefore(section,toolsSection);

    const container=section.querySelector('#facebookFeedContainer');
    try{
      const response=await fetch('/api/facebook-posts',{headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok||!Array.isArray(data.posts))throw new Error('Unable to load posts');
      if(!data.posts.length){
        container.innerHTML='<p class="facebook-feed-status">لا توجد منشورات متاحة حاليًا.</p>';
        return;
      }
      const dateFormatter=new Intl.DateTimeFormat('ar',{year:'numeric',month:'long',day:'numeric'});
      const slides=data.posts.map((post,index)=>{
        const image=post.image?`<img src="${escapeHtml(post.image)}" alt="صورة منشور مكتب عماد عدن العقاري" loading="lazy" decoding="async">`:'';
        const date=post.publishedAt?dateFormatter.format(new Date(post.publishedAt)):'';
        return `<div class="facebook-feed-slide" role="group" aria-label="المنشور ${index+1} من ${data.posts.length}"><article class="facebook-feed-card">${image}<div class="facebook-feed-content"><span class="facebook-feed-date"><i class="fa-regular fa-calendar"></i>${escapeHtml(date)}</span><p>${escapeHtml(post.message)}</p><a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">للمزيد اضغط <i class="fa-solid fa-arrow-left"></i></a></div></article></div>`;
      }).join('');
      const dots=data.posts.map((_,index)=>`<button class="facebook-feed-dot${index===0?' active':''}" type="button" aria-label="عرض المنشور ${index+1}" data-index="${index}"></button>`).join('');
      container.innerHTML=`<div class="facebook-feed-slider" tabindex="0"><div class="facebook-feed-track">${slides}</div></div><div class="facebook-feed-controls"><button class="facebook-feed-arrow facebook-feed-prev" type="button" aria-label="المنشور السابق"><i class="fa-solid fa-chevron-right"></i></button><div class="facebook-feed-dots">${dots}</div><button class="facebook-feed-arrow facebook-feed-next" type="button" aria-label="المنشور التالي"><i class="fa-solid fa-chevron-left"></i></button></div>`;

      const slider=container.querySelector('.facebook-feed-slider');
      const track=container.querySelector('.facebook-feed-track');
      const dotButtons=[...container.querySelectorAll('.facebook-feed-dot')];
      const count=data.posts.length;
      let current=0;
      let timer;
      let startX=0;
      let deltaX=0;

      const showSlide=index=>{
        current=(index+count)%count;
        track.style.transform=`translateX(${current*100}%)`;
        dotButtons.forEach((dot,dotIndex)=>dot.classList.toggle('active',dotIndex===current));
      };
      const startAuto=()=>{
        if(reducedMotion||count<2)return;
        clearInterval(timer);
        timer=setInterval(()=>showSlide(current+1),6000);
      };
      const resetAuto=()=>{clearInterval(timer);startAuto();};

      container.querySelector('.facebook-feed-prev')?.addEventListener('click',()=>{showSlide(current-1);resetAuto();});
      container.querySelector('.facebook-feed-next')?.addEventListener('click',()=>{showSlide(current+1);resetAuto();});
      dotButtons.forEach(dot=>dot.addEventListener('click',()=>{showSlide(Number(dot.dataset.index));resetAuto();}));
      slider.addEventListener('keydown',event=>{
        if(event.key==='ArrowLeft'){showSlide(current+1);resetAuto();}
        if(event.key==='ArrowRight'){showSlide(current-1);resetAuto();}
      });
      slider.addEventListener('pointerdown',event=>{
        startX=event.clientX;
        deltaX=0;
        slider.setPointerCapture?.(event.pointerId);
      });
      slider.addEventListener('pointermove',event=>{if(startX)deltaX=event.clientX-startX;});
      slider.addEventListener('pointerup',()=>{
        if(Math.abs(deltaX)>45)showSlide(deltaX>0?current-1:current+1);
        startX=0;
        deltaX=0;
        resetAuto();
      });
      slider.addEventListener('mouseenter',()=>clearInterval(timer));
      slider.addEventListener('mouseleave',startAuto);
      document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(timer):startAuto());
      showSlide(0);
      startAuto();
    }catch(error){
      container.innerHTML='<p class="facebook-feed-status">تعذر تحميل آخر التحديثات حاليًا.</p>';
    }finally{
      container.setAttribute('aria-busy','false');
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