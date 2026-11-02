const b=document.getElementById('burger'),m=document.getElementById('menu');
const set=o=>{m.classList.toggle('open',o);b.setAttribute('aria-expanded',o)};
b.addEventListener('click',()=>set(!m.classList.contains('open')));
m.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));