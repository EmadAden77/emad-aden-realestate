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

  const formatOfficePost=value=>{
    const cleaned=(value||'')
      .replace(/https?:\/\/\S+/gi,'')
      .replace(/(^|\s)#[\p{L}\p{N}_-]+/gu,'')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
    return escapeHtml(cleaned);
  };

  const renderFacebookFeed=async()=>{
    const toolsSection=document.getElementById('tools');
    if(!toolsSection)return;

    const style=document.createElement('style');
    style.textContent=`
      .facebook-feed{padding-top:10px}
      .facebook-feed-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:18px}
      .facebook-feed-head h2{margin:.35rem 0 0}
      .facebook-feed-slider{position:relative;overflow:hidden;border-radius:24px;isolation:isolate;cursor:grab;touch-action:pan-y}
      .facebook-feed-slider.is-dragging{cursor:grabbing}
      .facebook-feed-track{display:flex;will-change:transform;transform:translate3d(0,0,0)}
      .facebook-feed-slide{min-width:100%;padding:1px;opacity:.44;transform:scale(.965);filter:saturate(.88);transition:opacity .72s cubic-bezier(.22,1,.36,1),transform .72s cubic-bezier(.22,1,.36,1),filter .72s cubic-bezier(.22,1,.36,1)}
      .facebook-feed-slide.is-active{opacity:1;transform:scale(1);filter:saturate(1)}
      .facebook-feed-card{overflow:hidden;border:1px solid rgba(229,192,123,.16);border-radius:22px;background:rgba(255,255,255,.025);box-shadow:0 24px 80px rgba(0,0,0,.2);transform:translateZ(0)}
      .facebook-feed-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;transform:scale(1.035);transition:transform 1.05s cubic-bezier(.22,1,.36,1);will-change:transform}
      .facebook-feed-slide.is-active .facebook-feed-card img{transform:scale(1)}
      .facebook-feed-content{padding:24px 22px 26px}
      .facebook-feed-meta{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid rgba(229,192,123,.16)}
      .facebook-feed-date{display:inline-flex;align-items:center;gap:7px;color:#d7bd85;font-size:.84rem}
      .facebook-feed-source{display:inline-flex;align-items:center;gap:7px;color:rgba(255,255,255,.68);font-size:.82rem;font-weight:700}
      .facebook-feed-content p{margin:0;font-size:1rem;line-height:2.05;white-space:pre-line;text-align:justify;color:rgba(255,255,255,.92)}
      .facebook-feed-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:18px}
      .facebook-feed-arrow{display:grid;place-items:center;width:46px;height:46px;border:1px solid rgba(229,192,123,.28);border-radius:50%;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.018));color:#f4d99f;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.16);transition:transform .28s ease,border-color .28s ease,background .28s ease,box-shadow .28s ease}
      .facebook-feed-arrow:hover{transform:translateY(-2px) scale(1.05);border-color:rgba(244,217,159,.6);background:rgba(244,217,159,.1);box-shadow:0 14px 34px rgba(0,0,0,.22)}
      .facebook-feed-arrow:active{transform:scale(.94)}
      .facebook-feed-dots{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(229,192,123,.12);border-radius:999px;background:rgba(255,255,255,.025)}
      .facebook-feed-dot{width:8px;height:8px;border:0;border-radius:50%;background:rgba(244,217,159,.26);padding:0;cursor:pointer;transition:width .38s cubic-bezier(.22,1,.36,1),background .28s ease,transform .28s ease}
      .facebook-feed-dot:hover{transform:scale(1.2);background:rgba(244,217,159,.55)}
      .facebook-feed-dot.active{width:28px;border-radius:10px;background:#f4d99f}
      .facebook-feed-status{padding:24px;text-align:center;border:1px solid rgba(229,192,123,.12);border-radius:18px;background:rgba(255,255,255,.02)}
      @media(max-width:600px){.facebook-feed-head{align-items:stretch;flex-direction:column}.facebook-feed-content{padding:18px 16px 20px}.facebook-feed-meta{align-items:flex-start;flex-direction:column}.facebook-feed-content p{font-size:.96rem;line-height:1.95;text-align:right}.facebook-feed-arrow{width:42px;height:42px}}
      @media(prefers-reduced-motion:reduce){.facebook-feed-slide,.facebook-feed-card img,.facebook-feed-arrow,.facebook-feed-dot{transition:none!important}}
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
        const image=post.image?`<img src="${escapeHtml(post.image)}" alt="صورة مستجدات مكتب عماد عدن العقاري" loading="lazy" decoding="async">`:'';
        const date=post.publishedAt?dateFormatter.format(new Date(post.publishedAt)):'';
        const message=formatOfficePost(post.message);
        return `<div class="facebook-feed-slide${index===0?' is-active':''}" role="group" aria-label="التحديث ${index+1} من ${data.posts.length}"><article class="facebook-feed-card">${image}<div class="facebook-feed-content"><div class="facebook-feed-meta"><span class="facebook-feed-date"><i class="fa-regular fa-calendar"></i>${escapeHtml(date)}</span><span class="facebook-feed-source"><i class="fa-solid fa-building"></i>مكتب عماد عدن العقاري</span></div><p>${message}</p></div></article></div>`;
      }).join('');
      const dots=data.posts.map((_,index)=>`<button class="facebook-feed-dot${index===0?' active':''}" type="button" aria-label="عرض التحديث ${index+1}" data-index="${index}"></button>`).join('');
      container.innerHTML=`<div class="facebook-feed-slider" tabindex="0"><div class="facebook-feed-track">${slides}</div></div><div class="facebook-feed-controls"><button class="facebook-feed-arrow facebook-feed-prev" type="button" aria-label="التحديث السابق"><i class="fa-solid fa-chevron-right"></i></button><div class="facebook-feed-dots">${dots}</div><button class="facebook-feed-arrow facebook-feed-next" type="button" aria-label="التحديث التالي"><i class="fa-solid fa-chevron-left"></i></button></div>`;

      const slider=container.querySelector('.facebook-feed-slider');
      const track=container.querySelector('.facebook-feed-track');
      const slideElements=[...container.querySelectorAll('.facebook-feed-slide')];
      const dotButtons=[...container.querySelectorAll('.facebook-feed-dot')];
      const count=data.posts.length;
      let current=0;
      let timer;
      let animation;
      let startX=0;
      let deltaX=0;
      let dragging=false;

      const setTrack=(offset,animate=true)=>{
        animation?.cancel();
        if(!animate||reducedMotion){
          track.style.transform=`translate3d(${offset}%,0,0)`;
          return;
        }
        const from=current*100;
        animation=track.animate([
          {transform:`translate3d(${from}%,0,0)`},
          {transform:`translate3d(${offset}%,0,0)`}
        ],{
          duration:760,
          easing:'cubic-bezier(.22,1,.36,1)',
          fill:'forwards'
        });
        animation.onfinish=()=>{track.style.transform=`translate3d(${offset}%,0,0)`;animation.cancel();animation=null;};
      };

      const showSlide=(index,animate=true)=>{
        const next=(index+count)%count;
        const previous=current;
        current=next;
        if(previous!==current||!animate)setTrack(current*100,animate);
        slideElements.forEach((slide,slideIndex)=>slide.classList.toggle('is-active',slideIndex===current));
        dotButtons.forEach((dot,dotIndex)=>dot.classList.toggle('active',dotIndex===current));
      };

      const startAuto=()=>{
        if(reducedMotion||count<2)return;
        clearInterval(timer);
        timer=setInterval(()=>showSlide(current+1),6500);
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
        dragging=true;
        startX=event.clientX;
        deltaX=0;
        slider.classList.add('is-dragging');
        clearInterval(timer);
        animation?.cancel();
        slider.setPointerCapture?.(event.pointerId);
      });
      slider.addEventListener('pointermove',event=>{
        if(!dragging)return;
        deltaX=event.clientX-startX;
        const percent=(deltaX/Math.max(slider.clientWidth,1))*100;
        track.style.transform=`translate3d(${current*100+percent}%,0,0)`;
      });
      const finishDrag=()=>{
        if(!dragging)return;
        dragging=false;
        slider.classList.remove('is-dragging');
        if(Math.abs(deltaX)>50)showSlide(deltaX>0?current-1:current+1);
        else setTrack(current*100,true);
        startX=0;
        deltaX=0;
        startAuto();
      };
      slider.addEventListener('pointerup',finishDrag);
      slider.addEventListener('pointercancel',finishDrag);
      slider.addEventListener('mouseenter',()=>clearInterval(timer));
      slider.addEventListener('mouseleave',()=>{if(!dragging)startAuto();});
      document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(timer):startAuto());
      showSlide(0,false);
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