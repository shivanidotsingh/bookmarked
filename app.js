// ── bookmarked app.js — System 7 desktop ──
// Reads DATA + CATS from data.js

function slug(s){ return s.replace(/[^A-Za-z]/g,''); }
function favicon(url){ return 'https://www.google.com/s2/favicons?domain='+url+'&sz=64'; }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── CLOCK (menu bar) ──
function tick(){
  var d=new Date();
  var h=d.getHours(), m=d.getMinutes();
  var ap=h<12?'AM':'PM'; var h12=h%12; if(h12===0)h12=12;
  document.getElementById('clock').textContent = h12+':'+(m<10?'0':'')+m+' '+ap;
}
tick(); setInterval(tick,10000);

// ── BUILD DESKTOP ICONS ──
var desktop = document.getElementById('desktop');

// layout: folders down the right side in two columns, classic Mac style
var startX = window.innerWidth - 200, startY = 50, stepY = 92, col=0;
function placeIcon(el, i){
  var x = startX + (col? 100:0);
  var y = startY + i*stepY;
  el.style.left = x+'px';
  el.style.top  = y+'px';
}

CATS.forEach(function(cat, i){
  var el = document.createElement('div');
  el.className = 'icon folder';
  el.innerHTML = '<div class="glyph">📁</div><div class="lbl">'+esc(cat.name)+'</div>';
  placeIcon(el, i);
  makeDraggable(el, function(){ openFolder(cat); });
  desktop.appendChild(el);
});

// Spreadsheet icon
var sheetIcon = document.createElement('div');
sheetIcon.className='icon';
sheetIcon.innerHTML='<div class="glyph">📊</div><div class="lbl">bookmarked.xls</div>';
sheetIcon.style.left = (startX)+'px';
sheetIcon.style.top  = (startY + CATS.length*stepY)+'px';
makeDraggable(sheetIcon, openSheet);
desktop.appendChild(sheetIcon);

// Rainbow shuffle icon (top-left of desktop)
var shuf = document.createElement('div');
shuf.className='icon';
shuf.innerHTML='<div class="shuffle-glyph">✺</div><div class="lbl">random site</div>';
shuf.style.left='28px'; shuf.style.top='40px';
makeDraggable(shuf, stumble);
desktop.appendChild(shuf);

// ── DRAG + DOUBLE-CLICK ──
function makeDraggable(el, onOpen){
  var sx,sy,ox,oy,moved=false,down=false;
  el.addEventListener('mousedown', function(e){
    down=true; moved=false;
    sx=e.clientX; sy=e.clientY;
    ox=parseInt(el.style.left); oy=parseInt(el.style.top);
    document.querySelectorAll('.icon').forEach(function(n){n.classList.remove('selected');});
    el.classList.add('selected');
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!down) return;
    var dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)>3||Math.abs(dy)>3){ moved=true; el.classList.add('dragging'); }
    el.style.left=(ox+dx)+'px'; el.style.top=(oy+dy)+'px';
  });
  document.addEventListener('mouseup', function(){
    if(down) el.classList.remove('dragging');
    down=false;
  });
  el.addEventListener('dblclick', function(){ onOpen(); });
  // touch: single tap opens (no drag on mobile for simplicity)
  el.addEventListener('touchend', function(e){ e.preventDefault(); onOpen(); });
}

// ── FOLDER WINDOW (icon view, grouped by subcategory) ──
var win = document.getElementById('window');
function openFolder(cat){
  document.getElementById('sheet').style.display='none';
  document.getElementById('win-title').textContent = cat.emoji+'  '+cat.name;
  var sites = DATA.filter(function(d){ return d.cat===cat.name; });
  document.getElementById('win-count').textContent = sites.length+' items';
  var body = document.getElementById('win-body');
  var html='';
  cat.subs.forEach(function(sub){
    var inSub = sites.filter(function(d){ return d.sub===sub.name; });
    if(!inSub.length) return;
    html += '<div class="subhead"><span class="se">'+sub.emoji+'</span>'+esc(sub.name)+' <span style="font-weight:normal;color:#999">('+inSub.length+')</span></div>';
    html += '<div class="filegrid">';
    inSub.forEach(function(d){
      html += '<a class="file" href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.title)+'">'
           +  '<img src="'+favicon(d.url)+'" alt="">'
           +  '<span class="fname">'+esc(d.label)+'</span></a>';
    });
    html += '</div>';
  });
  body.innerHTML = html;
  body.scrollTop = 0;
  win.style.display='flex';
}
function closeWindow(){ win.style.display='none'; }

// ── SPREADSHEET WINDOW (table) ──
var activeCats={}, sortCol=null, sortDir=1;
function openSheet(){
  win.style.display='none';
  // build category filter pills once
  var f=document.getElementById('sheet-filters');
  if(!f.dataset.built){
    CATS.forEach(function(c){
      var b=document.createElement('button');
      b.className='cat-pill'; b.textContent=c.name; b.setAttribute('data-cat',c.name);
      b.onclick=function(){ toggleCat(c.name); };
      f.appendChild(b);
    });
    f.dataset.built='1';
  }
  document.getElementById('sheet').style.display='flex';
  renderSheet();
}
function closeSheet(){ document.getElementById('sheet').style.display='none'; }

function toggleCat(c){
  activeCats[c]?delete activeCats[c]:(activeCats[c]=true);
  document.querySelectorAll('.cat-pill').forEach(function(p){
    p.classList.toggle('active', !!activeCats[p.getAttribute('data-cat')]);
  });
  renderSheet();
}
function sortSheet(col){
  sortDir = sortCol===col ? -sortDir : 1;
  sortCol = col;
  document.getElementById('arr').textContent = sortDir===1?'▲':'▼';
  renderSheet();
}
function sheetFiltered(){
  var q=document.getElementById('search').value.toLowerCase();
  var cats=Object.keys(activeCats);
  return DATA.filter(function(d){
    if(cats.length && !activeCats[d.cat]) return false;
    if(q){
      var h=(d.title+' '+d.label+' '+d.sub+' '+d.cat).toLowerCase();
      if(h.indexOf(q)<0) return false;
    }
    return true;
  }).sort(function(a,b){
    if(!sortCol) return 0;
    var av=(a[sortCol]||'').toLowerCase(), bv=(b[sortCol]||'').toLowerCase();
    return av<bv?-sortDir:av>bv?sortDir:0;
  });
}
function renderSheet(){
  var f=sheetFiltered();
  document.getElementById('sheet-count').textContent = f.length+' of '+DATA.length;
  var tb=document.getElementById('sheet-tbody');
  if(!f.length){ tb.innerHTML='<tr><td colspan="3" class="empty">nothing found</td></tr>'; return; }
  var rows='';
  f.forEach(function(d){
    rows += '<tr>'
      + '<td class="c-site"><a href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.title)+'">'
      +   '<img src="'+favicon(d.url)+'" alt="">'+esc(d.label)+'</a></td>'
      + '<td><span class="tag-cat cc-'+slug(d.cat)+'">'+esc(d.cat)+'</span></td>'
      + '<td>'+esc(d.sub)+'</td>'
      + '</tr>';
  });
  tb.innerHTML=rows;
}

// ── STUMBLE ──
function stumble(){
  var d = DATA[Math.floor(Math.random()*DATA.length)];
  window.open(d.url,'_blank');
}

// click empty desktop deselects
desktop.addEventListener('mousedown', function(e){
  if(e.target===desktop || e.target.id==='hint')
    document.querySelectorAll('.icon').forEach(function(n){n.classList.remove('selected');});
});
