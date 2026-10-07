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

/* ---- photos: only the phone's share menu can hand WhatsApp a real image, and it cannot pick the chat.
   A short sheet says so: send the list first (that opens our chat), then share the photos and choose us.
   Each photo carries its shape number and our WhatsApp number. Desktop keeps the links. ---- */
var photoMode=!!(window.File&&navigator.share&&navigator.canShare)&&matchMedia('(pointer:coarse)').matches;
var files={},pending={};
function stamp(id){
  if(pending[id])return pending[id];
  var ready=document.fonts?document.fonts.load('600 30px Figtree'):Promise.resolve();
  pending[id]=ready.catch(function(){}).then(function(){
    return new Promise(function(res,rej){
      var img=new Image();
      img.onload=function(){
        var W=img.naturalWidth,H=img.naturalHeight,bar=Math.round(W*.16),m=Math.round(W*.055);
        var c=document.createElement('canvas');c.width=W;c.height=H+bar;
        var x=c.getContext('2d');
        x.drawImage(img,0,0);
        x.fillStyle='#111';x.fillRect(0,H,W,bar);
        x.textBaseline='middle';x.fillStyle='#fff';
        x.font='600 '+Math.round(bar*.34)+'px Figtree,Arial,sans-serif';
        x.fillText('Shape '+id,m,H+bar/2);
        var left=m*2+x.measureText('Shape '+id).width,num='WhatsApp us at '+WA_DISPLAY,f=Math.round(bar*.24);
        x.textAlign='right';
        do{x.font='600 '+f+'px Figtree,Arial,sans-serif';f--;}while(f>10&&x.measureText(num).width>W-m-left);
        x.fillText(num,W-m,H+bar*.66);
        x.fillStyle='#B9B9B9';x.font='400 '+Math.round(bar*.19)+'px Figtree,Arial,sans-serif';
        x.fillText('Fine Plastic Industries',W-m,H+bar*.36);
        c.toBlob(function(b){
          if(!b)return rej(new Error('encode'));
          files[id]=new File([b],'fine-plastic-shape-'+id+'.jpg',{type:'image/jpeg'});
          res(files[id]);
        },'image/jpeg',.9);
      };
      img.onerror=function(){rej(new Error('load'));};
      img.src='/images/'+ROW[id][1]+'-700.webp';
    });
  });
  pending[id].catch(function(){delete pending[id];});
  return pending[id];
}
/* share t's photos with text; anything short of a share goes to the text link */
function sharePhotos(t,text,fallback,done){
  var go=function(){
    var list=t.map(function(id){return files[id];}).filter(Boolean);
    var data={files:list,text:text},ok=false;
    try{ok=list.length===t.length&&navigator.canShare(data);}catch(e){}
    if(!ok){fallback();return;}
    navigator.share(data).then(done,function(err){
      if(err&&err.name==='AbortError')return; /* they closed the menu on purpose */
      fallback();
    });
  };
  if(t.every(function(id){return files[id];})){go();return;}
  /* not built yet: the tap stays valid for a few seconds, so wait briefly */
  var over=false;
  var timer=setTimeout(function(){if(!over){over=true;fallback();}},2500);
  Promise.all(t.map(stamp)).then(function(){
    if(over)return;over=true;clearTimeout(timer);go();
  },function(){
    if(over)return;over=true;clearTimeout(timer);fallback();
  });
}
var dlg=document.getElementById('photoDlg'),dlgIds=[];
function askPhotos(t){
  if(!dlg||!t.length)return;
  dlgIds=t;
  t.forEach(function(id){stamp(id).catch(function(){});}); /* ready before they tap Share */
  document.getElementById('pdChat').href=WA+'?text='+encodeURIComponent(message(t));
  document.querySelector('#pdShare span').textContent=t.length>1?'Share '+t.length+' photos':'Share the photo';
  dlg.showModal();
}
if(dlg){
  var chat=document.getElementById('pdChat');
  document.getElementById('pdShare').addEventListener('click',function(){
    sharePhotos(dlgIds,'Hello Fine Plastic Industries. I am interested in shape '+dlgIds.join(', ')+'.',
      function(){location.href=chat.href;},function(){dlg.close();});
  });
  document.getElementById('pdClose').addEventListener('click',function(){dlg.close();});
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();}); /* a tap outside the sheet */
}
if(photoMode)document.querySelectorAll('[data-photo-one]').forEach(function(b){
  b.hidden=false;
  b.addEventListener('click',function(){askPhotos([b.getAttribute('data-photo-one')]);});
});

/* ---- the tray ---- */
var tray=document.getElementById('tray');
var tl,ts;
if(tray){
  tl=document.getElementById('trayList');ts=document.getElementById('traySend');
  if(photoMode){
    var tp=document.getElementById('trayPhotos');
    tp.hidden=false;tray.classList.add('ph');
    tp.addEventListener('click',function(){askPhotos(sorted());});
  }
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
