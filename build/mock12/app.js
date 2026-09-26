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
function message(t){return 'Hello Fine Plastic Industries. I am interested in shape '+t.join(', ')+'.';}

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

/* ---- photos: through the phone's share sheet, the only way a page can hand
   WhatsApp a real image. The sheet cannot pre-select the chat, so each photo
   carries its shape number printed on it. Desktop keeps the plain link. ---- */
var photoMode=!!(window.File&&navigator.share&&navigator.canShare)&&matchMedia('(pointer:coarse)').matches;
var files={},pending={};
function stamp(id){
  if(pending[id])return pending[id];
  var ready=document.fonts?document.fonts.load('600 30px Figtree'):Promise.resolve();
  pending[id]=ready.catch(function(){}).then(function(){
    return new Promise(function(res,rej){
      var img=new Image();
      img.onload=function(){
        var W=img.naturalWidth,H=img.naturalHeight,bar=Math.round(W*.12),m=Math.round(bar*.38);
        var c=document.createElement('canvas');c.width=W;c.height=H+bar;
        var x=c.getContext('2d');
        x.drawImage(img,0,0);
        x.fillStyle='#111';x.fillRect(0,H,W,bar);
        x.textBaseline='middle';x.fillStyle='#fff';
        x.font='600 '+Math.round(bar*.44)+'px Figtree,Arial,sans-serif';
        x.fillText('Shape '+id,m,H+bar/2);
        x.textAlign='right';x.fillStyle='#B9B9B9';
        x.font='400 '+Math.round(bar*.25)+'px Figtree,Arial,sans-serif';
        x.fillText('Fine Plastic Industries  '+WA_DISPLAY,W-m,H+bar/2);
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
function sharePhotos(t,text,fallback){
  var go=function(){
    var list=t.map(function(id){return files[id];}).filter(Boolean);
    var data={files:list,text:text},ok=false;
    try{ok=list.length===t.length&&navigator.canShare(data);}catch(e){}
    if(!ok){fallback();return;}
    navigator.share(data).catch(function(err){
      if(err&&err.name==='AbortError')return; /* they closed the sheet on purpose */
      fallback();
    });
  };
  if(t.every(function(id){return files[id];})){go();return;}
  /* not built yet: the tap stays valid for a few seconds, so wait briefly */
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;fallback();}},2500);
  Promise.all(t.map(stamp)).then(function(){
    if(done)return;done=true;clearTimeout(timer);go();
  },function(){
    if(done)return;done=true;clearTimeout(timer);fallback();
  });
}

/* a single shape's page can send just its own photo */
document.querySelectorAll('[data-send-one]').forEach(function(a){
  var id=a.getAttribute('data-send-one');
  a.href=WA+'?text='+encodeURIComponent(message([id]));a.target='_blank';a.rel='noopener';
  if(photoMode){
    stamp(id).catch(function(){});
    a.textContent='Send this photo on WhatsApp';
    a.addEventListener('click',function(e){
      e.preventDefault();
      sharePhotos([id],message([id]),function(){location.href=a.href;});
    });
  }
});

/* ---- the tray ---- */
var tray=document.getElementById('tray');
var tl,ts,tp,th;
if(tray){
  tl=document.getElementById('trayList');ts=document.getElementById('traySend');
  tp=document.getElementById('trayPhotos');th=document.getElementById('trayHint');
  if(photoMode){
    tp.hidden=false;th.hidden=false;
    ts.classList.remove('wa');ts.classList.add('alt');ts.textContent='Numbers only';
    tp.addEventListener('click',function(){
      var t=sorted();sharePhotos(t,message(t),function(){location.href=ts.href;});
    });
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
    if(tp)tp.textContent=t.length>1?'Send '+t.length+' photos':'Send photo';
  }
  if(photoMode)t.forEach(function(id){stamp(id).catch(function(){});});
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
    if(t.length)lines.push('Shapes: '+t.join(', '));
    return lines.join('\n');
  }
  function refresh(){
    var t=sorted(),text=build(t);
    pre.textContent=text;
    tagBox.innerHTML=t.length?t.map(function(id){return '<span>No. '+id+'</span>';}).join('')
      :'<span>None yet. Tag shapes in the range and they show here.</span>';
    send.textContent=photoMode&&t.length?'Send with '+t.length+' photo'+(t.length>1?'s':''):'Send on WhatsApp';
    mail.href='mailto:'+EMAIL+'?subject='+encodeURIComponent('Quote request')+'&body='+encodeURIComponent(text);
  }
  form.addEventListener('input',refresh);
  form.addEventListener('change',refresh);
  onPaint.push(refresh);
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.reportValidity())return;
    var t=sorted(),text=build(t),link=WA+'?text='+encodeURIComponent(text);
    if(photoMode&&t.length){sharePhotos(t,text,function(){location.href=link;});}
    else{window.open(link,'_blank','noopener');}
  });
}

paint();
})();
