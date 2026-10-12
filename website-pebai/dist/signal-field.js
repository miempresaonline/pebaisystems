(() => {
  const canvas = document.getElementById('signal-canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const hero = canvas.closest('.hero');
  let w=0,h=0,nodes=[],frame=0,visible=true,last=0;
  const palette = () => document.documentElement.dataset.theme === 'light' ? ['#493AC4','#656370'] : ['#B7FF3C','#6A5CFF'];
  let colors=palette();
  const disabled = () => document.documentElement.dataset.motion==='off';
  function resize() {
    const rect=hero.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,1.5);
    w=rect.width; h=rect.height;
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes=Array.from({length:w<760?24:44},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*.1}));
    render(0);
  }
  function render(dt) {
    ctx.clearRect(0,0,w,h);
    nodes.forEach((n,i)=>{
      n.x=(n.x+n.vx*dt+w)%w; n.y=(n.y+n.vy*dt+h)%h;
      ctx.globalAlpha=.25;ctx.fillStyle=colors[i%6===0?0:1];
      ctx.beginPath();ctx.arc(n.x,n.y,i%6===0?1.5:.8,0,Math.PI*2);ctx.fill();
      if(i===0)return;
      const prev=nodes[i-1],dist=Math.hypot(prev.x-n.x,prev.y-n.y);
      if(dist<160){ctx.globalAlpha=.12*(1-dist/160);ctx.strokeStyle=colors[1];ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(prev.x,prev.y);ctx.stroke();}
    });
    ctx.globalAlpha=1;
  }
  function tick(now) {
    frame=0;
    if (!visible || document.hidden || disabled()) return;
    if(now-last>=33){render(Math.min(2,(now-last)/16));last=now;}
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; last=performance.now(); render(0);
    if(visible && !document.hidden && !disabled())frame=requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(hero);
  document.addEventListener('visibilitychange',sync);
  addEventListener('pebai-motion',sync);
  addEventListener('pebai-theme',()=>{colors=palette();render(0);});
  resize();sync();
})();
