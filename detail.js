const b=document.body,slug=b.dataset.slug,kind=b.dataset.kind,layout=b.dataset.layout,title=b.dataset.title;
const box=document.getElementById(kind==='paper'?'paper':'gallery');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pretty=g=>g.split(/[\\/]/).map(p=>p.split('-').map(w=>w==='sos'?'SOS':w.charAt(0).toUpperCase()+w.slice(1)).join(' ')).join(' · ');
const soon=t=>{box.className='';box.innerHTML='<p class="note">'+t+'</p>'};
const media=(f,i)=>f.type==='video'?'<video controls preload="metadata" playsinline src="'+f.src+'"></video>':'<img loading="lazy" alt="'+esc(title)+' '+(i+1)+'" src="'+f.src+'">';
function lightbox(list,start){
 let i=start;
 const L=document.createElement('div');L.className='lb';
 L.innerHTML='<button class="lb-x" aria-label="Close">×</button>'+(list.length>1?'<button class="lb-n lb-p" aria-label="Previous">‹</button><button class="lb-n lb-nx" aria-label="Next">›</button>':'')+'<img alt="">';
 const im=L.querySelector('img'),show=()=>{im.src=list[i].src;im.alt=title+' '+(i+1)},step=d=>{i=(i+d+list.length)%list.length;show()};
 const key=e=>{if(e.key==='Escape')close();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)};
 const close=()=>{L.remove();document.body.style.overflow='';document.removeEventListener('keydown',key)};
 L.onclick=e=>{const c=e.target.classList;if(e.target===L||c.contains('lb-x'))close();else if(c.contains('lb-p'))step(-1);else if(c.contains('lb-nx'))step(1)};
 document.addEventListener('keydown',key);document.body.style.overflow='hidden';document.body.append(L);show();
}
function carousel(files){
 const w=document.createElement('div');w.className='carousel';
 w.innerHTML='<div class="track" tabindex="0">'+files.map((f,i)=>'<div class="slide"'+(f.type==='video'?'':' style="--bg:url(\''+f.src+'\')"')+'>'+media(f,i)+'</div>').join('')+'</div>'+(files.length>1?'<button class="cbtn prev" aria-label="Previous">‹</button><button class="cbtn next" aria-label="Next">›</button>':'')+'<span class="count">1 / '+files.length+'</span>';
 const t=w.querySelector('.track'),c=w.querySelector('.count'),go=d=>t.scrollBy({left:d*t.clientWidth});
 w.querySelectorAll('.cbtn').forEach(x=>x.onclick=()=>go(x.classList.contains('next')?1:-1));
 t.addEventListener('scroll',()=>{c.textContent=(Math.round(t.scrollLeft/t.clientWidth)+1)+' / '+files.length});
 t.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
 const imgs=files.filter(f=>f.type!=='video');
 w.querySelectorAll('.slide img').forEach((el,k)=>{el.onclick=()=>lightbox(imgs,k)});
 return w}
function grid(files){const g=document.createElement('div');g.className='gallery';const imgs=files.filter(f=>f.type!=='video');
 g.innerHTML=files.map((f,i)=>f.type==='video'?media(f,i):'<a href="'+f.src+'" data-k="'+imgs.indexOf(f)+'">'+media(f,i)+'</a>').join('');
 g.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();lightbox(imgs,+a.dataset.k)});return g}
Promise.resolve(window.MEDIA||Promise.reject()).then(d=>{
 if(kind==='paper'){const p=[].concat((d.papers||{})[slug]||[]);if(!p.length)return soon('The paper will be posted here soon.');
  box.innerHTML=p.map(x=>'<div class="paper-item"><h3>'+esc(x.name)+'</h3><a class="cta-link" href="'+x.src+'" target="_blank" rel="noopener">Open PDF ↗</a><iframe class="paper" src="'+x.src+'" title="'+esc(x.name)+'"></iframe></div>').join('');return}
 const files=[].concat((d.media||{})[slug]||[]);if(!files.length)return soon('Photos coming soon.');
 box.className='';box.innerHTML='';
 const order=[];files.forEach(f=>{let g=order.find(x=>x.g===f.g);if(!g)order.push(g={g:f.g,files:[]});g.files.push(f)});
 order.forEach(o=>{if(o.g){const h=document.createElement('h3');h.className='group-title';h.textContent=pretty(o.g);box.append(h)}box.append(layout==='carousel'?carousel(o.files):grid(o.files))});
}).catch(()=>soon(kind==='paper'?'The paper will be posted here soon.':'Photos coming soon.'));