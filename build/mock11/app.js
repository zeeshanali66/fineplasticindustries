(function(){
var WA='https://wa.me/923009492478', WA_DISPLAY='+92 300 9492478', EMAIL='fineplasticindustry@yahoo.com';
var BASE=document.documentElement.getAttribute('data-base')||'';
var KEY='fpi-mock11-tags';

/* id, image, ground colour sampled from that photo's own border.
   No shape names: the number is the name, and it is always right. */
var S=[
["01","water-waisted-6","#75665A"],["02","juice-square-6","#74655A"],
["03","water-ribbed-5","#69635A"],["04","water-ribbed-pair","#686259"],
["05","beverage-single-redcap","#877972"],["06","jars-3-sizes","#7C6C5F"],
["07","cosmetic-large-pump","#4A3834"],["08","cosmetic-black-cylinder","#D9DCE9"],
["09","shape-09","#ADA094"],["10","pharma-amber-syrup","#E3E7F7"],
["11","pharma-amber-vials","#D1D9E7"],["12","hdpe-handled-range","#7A6A60"],
["13","clear-straight-cylinder","#939499"],["14","shape-14","#A89A8D"],
["15","clear-twist-bluecap","#797C88"],["16","white-round-short","#6E7280"],
["17","white-slim-cylinder","#797981"],["18","white-ribbed-round","#7F8087"],
["19","white-tapered-shoulder","#655D69"],["20","white-cylinder-capped","#777A83"],
["21","white-round-wide","#868785"],["22","clear-tall-cylinder","#7E828D"],
["23","white-tall-slim","#71767D"]
];
var ROW={};S.forEach(function(r){ROW[r[0]]=r;});

/* ---- tags survive moving between pages; storage can be blocked, so guard it ---- */
var tags=[];
try{tags=JSON.parse(sessionStorage.getItem(KEY)||'[]').filter(function(id){return ROW[id];});}catch(e){tags=[];}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(tags));}catch(e){}}
function sorted(){return tags.slice().sort();}
function message(t){return 'Hello Fine Plastic Industries. I am interested in shape '+t.join(', ')+'.';}

/* ---- shape tiles, rendered wherever a page asks for them ---- */
document.querySelectorAll('[data-shapes]').forEach(function(box){
  var list=box.getAttribute('data-shapes'), still=box.hasAttribute('data-still');
  var ids=list==='all'?S.map(function(r){return r[0];}):list.split(',');
  ids.forEach(function(id,i){
    var r=ROW[id]; if(!r)return;
    var el=document.createElement(still?'div':'button');
    el.className='sp'+(still?' still':'');
    el.style.setProperty('--g',r[2]);
    el.innerHTML='<span class="ph"><img src="/images/'+r[1]+'-700.webp" alt="'+(still?'Shape '+id:'')+'" '
      +(i<4?'':'loading="lazy"')+'></span>'
      +'<span class="row"><span class="no">No. '+id+'</span>'+(still?'':'<span class="add">Add</span>')+'</span>';
    if(!still){
      el.type='button';el.dataset.id=id;
      el.setAttribute('aria-pressed','false');
      el.setAttribute('aria-label','Shape '+id+', add to your list');
    }
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

/* ---- pin the featured row, only where the browser can animate it natively ---- */
document.querySelectorAll('.range').forEach(function(range){
  var pin=range.querySelector('.pin'),track=range.querySelector('.track');
  var ok=window.CSS&&CSS.supports('animation-timeline','view()');
  var mq=matchMedia('(min-width:761px) and (prefers-reduced-motion: no-preference)');
  function size(){
    if(!(ok&&mq.matches)){range.classList.remove('pinned');range.style.height='';return;}
    range.classList.add('pinned');
    var travel=Math.max(0,track.scrollWidth-pin.clientWidth);
    track.style.setProperty('--travel',travel+'px');
    /* two pixels of travel per pixel of scroll keeps the pin short */
    range.style.height=(travel/2+innerHeight)+'px';
  }
  size();addEventListener('resize',size);
  if(mq.addEventListener)mq.addEventListener('change',size);
  if(document.fonts)document.fonts.ready.then(size);
});

/* ---- photos: through the phone's share sheet, the only way a page can hand
   WhatsApp a real image. The sheet cannot pre-select the chat, so each photo
   carries its shape number printed on it. Desktop keeps the plain link. ---- */
var photoMode=!!(window.File&&navigator.share&&navigator.canShare)&&matchMedia('(pointer:coarse)').matches;
var files={},pending={};
function stamp(id){
  if(pending[id])return pending[id];
  var ready=document.fonts?document.fonts.load('500 30px Figtree'):Promise.resolve();
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
        x.font='500 '+Math.round(bar*.44)+'px Figtree,Arial,sans-serif';
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
  document.querySelectorAll('button.sp').forEach(function(el){
    var on=tags.indexOf(el.dataset.id)>-1;
    el.setAttribute('aria-pressed',on?'true':'false');
    var a=el.querySelector('.add'); if(a)a.textContent=on?'Added':'Add';
  });
  if(tray){
    tray.classList.toggle('on',t.length>0);
    tl.textContent=t.join('  ');
    ts.href=WA+'?text='+encodeURIComponent(message(t));
    if(tp)tp.textContent=t.length>1?'Send '+t.length+' photos':'Send photo';
  }
  if(photoMode)t.forEach(function(id){stamp(id).catch(function(){});});
  onPaint.forEach(function(fn){fn(t);});
}
document.addEventListener('click',function(e){
  var b=e.target.closest('button.sp');
  if(!b)return;
  var i=tags.indexOf(b.dataset.id);
  if(i>-1){tags.splice(i,1);}else{tags.push(b.dataset.id);}
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
