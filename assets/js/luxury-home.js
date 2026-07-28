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