(function(){
var WA='https://wa.me/923009492478', WA_DISPLAY='+92 300 9492478', EMAIL='fineplasticindustry@yahoo.com';
var BASE=document.documentElement.getAttribute('data-base')||'';
var KEY='fpi-mock12-tags';

/* id, graded image, ground colour sampled from that image's own border,
   original image (used where the page promises colours as photographed).
   Written by build_mock12.py so the pages and this script agree. */
var S=window.FPI_S||[];
var ROW={};S.forEach(function(r){ROW[r[0]]=r;});
function shapeUrl(id){return BASE+'/shape/'+id+'/';}

/* ---- tags survive moving between pages; storage can be blocked, so guard it ---- */
var tags=[];
try{tags=JSON.parse(sessionStorage.getItem(KEY)||'[]').filter(function(id){return ROW[id];});}catch(e){tags=[];}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(tags));}catch(e){}}
function sorted(){return tags.slice().sort();}
/* each shape goes with its page link: WhatsApp previews the first link with that shape's photo */
var NL=String.fromCharCode(10);
function links(t){return t.map(function(id){return 'No. '+id+': '+location.origin+shapeUrl(id);}).join(NL);}
function message(t){return 'Hello Fine Plastic Industries. I am interested in shape '+t.join(', ')+'.'+NL+links(t);}

/* a link like /quote/?add=12 arrives with that shape already on the list */
(function(){
  var m=/[?&]add=(\d\d)\b/.exec(location.search);
  if(m&&ROW[m[1]]&&tags.indexOf(m[1])<0){tags.push(m[1]);save();}
})();

/* ---- shape tiles: the photo opens the shape's page, Add puts it on the list ---- */
document.querySelectorAll('[data-shapes]').forEach(function(box){
  var list=box.getAttribute('data-shapes'), still=box.hasAttribute('data-still');
  var ids=list==='all'?S.map(function(r){return r[0];}):list.split(',');
  ids.forEach(function(id,i){
    var r=ROW[id]; if(!r)return;
    var img=still?r[3]:r[1], el=document.createElement('div');
    el.className='sp'+(still?' still':'');el.dataset.id=id;
    el.style.setProperty('--g',still?r[4]:r[2]);
    el.innerHTML='<a class="ph" href="'+shapeUrl(id)+'" style="view-transition-name:s'+id+'" aria-label="Shape '+id+'">'
      +'<img src="/images/'+img+'-700.webp" alt="" '+(i<4?'':'loading="lazy"')+'></a>'
      +'<span class="row"><a class="no" href="'+shapeUrl(id)+'">No. '+id+'</a>'
      +(still?'':'<button class="add" type="button" data-id="'+id+'" aria-pressed="false" aria-label="Add shape '+id+' to your list">Add</button>')
      +'</span>';
    box.appendChild(el);
  });
});

/* ---- statement words light up one by one ---- */
document.querySelectorAll('[data-words]').forEach(function(p){
  p.innerHTML=p.textContent.trim().split(/\s+/).map(function(w){return '<span class="w">'+w+'</span>';}).join(' ');
});

/* ---- a fill opens the message already naming it ---- */
document.querySelectorAll('[data-fill]').forEach(function(a){
  var f=a.getAttribute('data-fill');
  var text=f==='caps'?'Hello Fine Plastic Industries. I need injection moulded caps.'
    :'Hello Fine Plastic Industries. I need bottles for '+f+'.';
  a.href=WA+'?text='+encodeURIComponent(text);a.target='_blank';a.rel='noopener';
});

/* a single shape's page asks about just that shape. A web page can open a chat with a set number
   only with text; photos would go through the share sheet, which cannot pick the chat, so the link
   (with its photo preview) is what carries the picture. */
document.querySelectorAll('[data-send-one]').forEach(function(a){
  var id=a.getAttribute('data-send-one');
  a.href=WA+'?text='+encodeURIComponent(message([id]));a.target='_blank';a.rel='noopener';
});

/* ---- the tray ---- */
var tray=document.getElementById('tray');
var tl,ts;
if(tray){
  tl=document.getElementById('trayList');ts=document.getElementById('traySend');
  document.getElementById('trayClr').addEventListener('click',function(){tags=[];save();paint();});
}

var onPaint=[];
function paint(){
  var t=sorted();
  document.querySelectorAll('button.add[data-id]').forEach(function(b){
    var on=tags.indexOf(b.dataset.id)>-1;
    b.setAttribute('aria-pressed',on?'true':'false');
    b.textContent=on?(b.dataset.on||'Added'):(b.dataset.off||'Add');
    var tile=b.closest('.sp'); if(tile)tile.classList.toggle('on',on);
  });
  if(tray){
    tray.classList.toggle('on',t.length>0);
    document.body.classList.toggle('tray-on',t.length>0); /* room so it never covers the page end */
    tl.textContent=t.join('  ');
    ts.href=WA+'?text='+encodeURIComponent(message(t));
  }
  /* the phone's bottom bar: plain WhatsApp, or the list once there is one */
  var mw=document.getElementById('mbarWa');
  if(mw){
    mw.querySelector('b').textContent=t.length?'Send my list':'WhatsApp';
    var n=mw.querySelector('.n'); n.hidden=!t.length; n.textContent=t.length;
    mw.href=WA+'?text='+encodeURIComponent(t.length?message(t):'Hello Fine Plastic Industries.');
  }
  onPaint.forEach(function(fn){fn(t);});
}
document.addEventListener('click',function(e){
  var b=e.target.closest('button.add[data-id]');
  if(!b)return;
  var id=b.dataset.id,i=tags.indexOf(id);
  if(i>-1){tags.splice(i,1);}else{tags.push(id);}
  save();paint();
});

/* ---- the price form: fills a message you can read before it is sent ---- */
var form=document.getElementById('quoteForm');
if(form){
  var pre=document.getElementById('qPreview'),tagBox=document.getElementById('qTags'),
      send=document.getElementById('qSend'),mail=document.getElementById('qMail');
  var LABELS=[['use','Bottle for'],['cap','Capacity'],['mat','Material'],['col','Colour'],
    ['neck','Neck size'],['qty','Quantity per order'],['city','City'],['nm','Name'],['ph','Phone']];
  function build(t){
    var lines=['Quote request from your website.'];
    LABELS.forEach(function(p){
      var v=(form.elements[p[0]].value||'').trim();
      if(v&&!(p[0]==='mat'&&v==='Not sure'))lines.push(p[1]+': '+v);
    });
    if(t.length)lines.push('Shapes: '+t.join(', '),links(t));
    return lines.join('\n');
  }
  function refresh(){
    var t=sorted(),text=build(t);
    pre.textContent=text;
    tagBox.innerHTML=t.length?t.map(function(id){return '<span>No. '+id+'</span>';}).join('')
      :'<span>None yet. Tag shapes in the range and they show here.</span>';
    mail.href='mailto:'+EMAIL+'?subject='+encodeURIComponent('Quote request')+'&body='+encodeURIComponent(text);
  }
  form.addEventListener('input',refresh);
  form.addEventListener('change',refresh);
  onPaint.push(refresh);
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.reportValidity())return;
    var t=sorted(),text=build(t),link=WA+'?text='+encodeURIComponent(text);
    window.open(link,'_blank','noopener');
  });
}

/* ---- the hero loop: the still (frame 1) is already showing; the video plays only where it helps.
   The caption follows the video: the shape on screen, then the range while all six stand together. ---- */
(function(){
  var host=document.getElementById('hero3d'); if(!host)return;
  var v=host.querySelector('video.loop'); if(!v)return;
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saver=!!(navigator.connection&&navigator.connection.saveData);
  if(calm||saver||!v.dataset.wide)return;                 /* the still stays */
  v.src=matchMedia('(max-width:860px)').matches?v.dataset.tall:v.dataset.wide;
  v.addEventListener('playing',function(){host.classList.add('playing');},{once:true});
  var caps=JSON.parse(v.dataset.caps||'[]'), cap=host.querySelector('.cap a'), shown=0;
  v.addEventListener('timeupdate',function(){
    var k=0; for(var i=0;i<caps.length;i++)if(v.currentTime>=caps[i][0])k=i;
    if(cap&&k!==shown){shown=k; cap.textContent=caps[k][1]; cap.href=caps[k][2];}
  });
  function go(){var p=v.play();if(p&&p.catch)p.catch(function(){});} /* refused autoplay: the still stays */
  go();
  if(window.IntersectionObserver)new IntersectionObserver(function(es){
    if(es[0].isIntersecting)go(); else v.pause();          /* spare the phone once it is off screen */
  }).observe(host);
})();

paint();
})();
