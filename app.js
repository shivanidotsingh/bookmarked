// ── bookmarked app.js — System 7 desktop ──
// Reads DATA + CATS from data.js

function slug(s){ return s.replace(/[^A-Za-z]/g,''); }
function favicon(url){ return 'https://www.google.com/s2/favicons?domain='+url+'&sz=64'; }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Modern macOS-style blue folder (inline SVG, scalable, exact color)
var FOLDER_SVG =
  '<svg class="folder-svg" viewBox="0 0 48 40" width="48" height="40" xmlns="http://www.w3.org/2000/svg">'
  + '<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">'
  + '<stop offset="0" stop-color="#7cc0f7"/><stop offset="1" stop-color="#3d92e8"/></linearGradient>'
  + '<linearGradient id="fb" x1="0" y1="0" x2="0" y2="1">'
  + '<stop offset="0" stop-color="#9ed1fb"/><stop offset="1" stop-color="#5aa8f0"/></linearGradient></defs>'
  + '<path d="M3 9 a3 3 0 0 1 3-3 h11 l4 4 h21 a3 3 0 0 1 3 3 v3 H3 Z" fill="url(#fb)"/>'
  + '<path d="M3 13 h42 a2 2 0 0 1 2 2 v20 a3 3 0 0 1-3 3 H4 a3 3 0 0 1-3-3 V15 a2 2 0 0 1 2-2 Z" fill="url(#fg)"/>'
  + '</svg>';

// Subcategories promoted to their own desktop icons (removed from parent folders)
var PROMOTED = [
  { sub:"Colors",                  parent:"Design Resources", icon:"🌈" },
  { sub:"Toolkits + Method Cards", parent:"Tools & Community", icon:"⚙️" }
];
function isPromoted(catName, subName){
  return PROMOTED.some(function(p){ return p.parent===catName && p.sub===subName; });
}

// ── CLOCK (menu bar) ──
function tick(){
  var d=new Date();
  var h=d.getHours(), m=d.getMinutes();
  var ap=h<12?'AM':'PM'; var h12=h%12; if(h12===0)h12=12;
  document.getElementById('clock').textContent = h12+':'+(m<10?'0':'')+m+' '+ap;
}
tick(); setInterval(tick,30000);

// ── BUILD DESKTOP ICONS ──
var desktop = document.getElementById('desktop');

// layout: items down the right side, classic Mac style
var startX = window.innerWidth - 130, startY = 50, stepY = 86;
var iconRow = 0;
function nextRightSlot(){
  var y = startY + iconRow*stepY;
  iconRow++;
  return y;
}

// Category folders
CATS.forEach(function(cat){
  var el = document.createElement('div');
  el.className = 'icon folder';
  el.innerHTML = '<div class="glyph">'+FOLDER_SVG+'</div><div class="lbl">'+esc(cat.name)+'</div>';
  el.style.left = startX+'px';
  el.style.top  = nextRightSlot()+'px';
  makeIconDraggable(el, function(){ openFolder(cat); });
  desktop.appendChild(el);
});

// Promoted subcategory icons (Colors, Toolkits)
PROMOTED.forEach(function(p){
  var el = document.createElement('div');
  el.className = 'icon promoted';
  el.innerHTML = '<div class="glyph">'+p.icon+'</div><div class="lbl">'+esc(p.sub)+'</div>';
  el.style.left = startX+'px';
  el.style.top  = nextRightSlot()+'px';
  makeIconDraggable(el, function(){ openSubcategory(p.sub, p.parent); });
  desktop.appendChild(el);
});

// Spreadsheet icon
var sheetIcon = document.createElement('div');
sheetIcon.className='icon';
sheetIcon.innerHTML='<div class="glyph">🔍︎</div><div class="lbl">bookmarked.xls</div>';
sheetIcon.style.left = startX+'px';
sheetIcon.style.top  = nextRightSlot()+'px';
makeIconDraggable(sheetIcon, openSheet);
desktop.appendChild(sheetIcon);

// Rainbow shuffle icon (top-left)
var shuf = document.createElement('div');
shuf.className='icon';
shuf.innerHTML='<div class="glyph">🔮</div><div class="lbl">random site</div>';
shuf.style.left='28px'; shuf.style.top='40px';
makeIconDraggable(shuf, stumble);
desktop.appendChild(shuf);

// ── ICON DRAG + DOUBLE-CLICK ──
function makeIconDraggable(el, onOpen){
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
  el.addEventListener('touchend', function(e){ e.preventDefault(); onOpen(); });
}

// ── MULTI-WINDOW SYSTEM ──
var zTop = 100;
var winCount = 0;
var openWindows = {};   // key -> element, prevents duplicate windows

function focusWindow(el){ el.style.zIndex = ++zTop; }

function makeWindow(key, title, bodyHTML, opts){
  opts = opts || {};
  if(openWindows[key]){            // already open: just focus it
    focusWindow(openWindows[key]);
    return openWindows[key];
  }
  var w = document.createElement('div');
  w.className = 'window';
  var offset = (winCount % 6) * 26;
  w.style.left = (90 + offset) + 'px';
  w.style.top  = (60 + offset) + 'px';
  w.style.width  = (opts.width  || 560) + 'px';
  w.style.height = (opts.height || 440) + 'px';
  w.style.zIndex = ++zTop;
  winCount++;

  w.innerHTML =
    '<div class="title-bar">'
    + '<button class="close-box" title="close"></button>'
    + '<span class="title-text">'+title+'</span>'
    + (opts.count!=null ? '<span class="title-count">'+opts.count+'</span>' : '')
    + '</div>'
    + '<div class="window-body'+(opts.bodyClass? ' '+opts.bodyClass:'')+'">'+bodyHTML+'</div>';

  desktop.appendChild(w);
  openWindows[key] = w;

  // focus on click
  w.addEventListener('mousedown', function(){ focusWindow(w); });
  // close
  w.querySelector('.close-box').addEventListener('click', function(e){
    e.stopPropagation();
    desktop.removeChild(w);
    delete openWindows[key];
  });
  // drag by titlebar
  makeWindowDraggable(w, w.querySelector('.title-bar'));
  return w;
}

function makeWindowDraggable(w, handle){
  var sx,sy,ox,oy,down=false;
  handle.addEventListener('mousedown', function(e){
    if(e.target.classList.contains('close-box')) return;
    down=true; focusWindow(w);
    sx=e.clientX; sy=e.clientY;
    ox=parseInt(w.style.left); oy=parseInt(w.style.top);
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!down) return;
    w.style.left=(ox+(e.clientX-sx))+'px';
    w.style.top =Math.max(22,(oy+(e.clientY-sy)))+'px';
  });
  document.addEventListener('mouseup', function(){ down=false; });
}

// ── FOLDER WINDOW (sidebar of subcategories + grouped icon view) ──
function folderBodyHTML(cat){
  var sites = DATA.filter(function(d){ return d.cat===cat.name && !isPromoted(cat.name, d.sub); });
  var subsWithSites = cat.subs.filter(function(sub){
    return !isPromoted(cat.name, sub.name) && sites.some(function(d){ return d.sub===sub.name; });
  });
  var side = '<nav class="folder-sidebar">';
  subsWithSites.forEach(function(sub, i){
    var n = sites.filter(function(d){ return d.sub===sub.name; }).length;
    side += '<a class="side-item" data-target="sub-'+i+'">'
         +  '<span class="se">'+sub.emoji+'</span>'+esc(sub.name)
         +  '<span class="side-count">'+n+'</span></a>';
  });
  side += '</nav>';
  var main = '<div class="folder-main">';
  subsWithSites.forEach(function(sub, i){
    var inSub = sites.filter(function(d){ return d.sub===sub.name; });
    main += '<div class="subhead" id="sub-'+i+'"><span class="se">'+sub.emoji+'</span>'+esc(sub.name)
         +  ' <span style="font-weight:normal;color:#999">('+inSub.length+')</span></div>';
    main += '<div class="filegrid">';
    inSub.forEach(function(d){
      main += '<a class="file" href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.title)+'">'
           +  '<img src="'+favicon(d.url)+'" alt="">'
           +  '<span class="fname">'+esc(d.label)+'</span></a>';
    });
    main += '</div>';
  });
  main += '</div>';
  return '<div class="folder-split">'+side+main+'</div>';
}

function openFolder(cat){
  var sites = DATA.filter(function(d){ return d.cat===cat.name && !isPromoted(cat.name, d.sub); });
  var w = makeWindow('folder:'+cat.name, cat.emoji+'  '+esc(cat.name), folderBodyHTML(cat),
                     {count: sites.length+' items'});
  wireSidebar(w);
}

function wireSidebar(w){
  var body = w.querySelector('.window-body');
  var mainEl = body.querySelector('.folder-main');
  if(!mainEl) return;
  body.querySelectorAll('.side-item').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var t = body.querySelector('#'+a.getAttribute('data-target'));
      if(t) mainEl.scrollTo({ top: t.offsetTop - mainEl.offsetTop - 4, behavior:'smooth' });
      body.querySelectorAll('.side-item').forEach(function(s){ s.classList.remove('active'); });
      a.classList.add('active');
    });
  });
}

// ── PROMOTED SUBCATEGORY WINDOW (just that one subcategory's sites) ──
function openSubcategory(subName, parentName){
  var sites = DATA.filter(function(d){ return d.cat===parentName && d.sub===subName; });
  var emoji = '';
  var cat = CATS.find(function(c){ return c.name===parentName; });
  if(cat){ var s = cat.subs.find(function(x){ return x.name===subName; }); if(s) emoji=s.emoji; }
  var main = '<div class="folder-main"><div class="filegrid" style="padding-top:14px">';
  sites.forEach(function(d){
    main += '<a class="file" href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.title)+'">'
         +  '<img src="'+favicon(d.url)+'" alt="">'
         +  '<span class="fname">'+esc(d.label)+'</span></a>';
  });
  main += '</div></div>';
  makeWindow('sub:'+subName, emoji+'  '+esc(subName), main,
             {count: sites.length+' items', width:480, height:400});
}


// ── SPREADSHEET WINDOW (table) ──
// Default order: shuffled once per visit (Fisher–Yates). Column sort still works on click.
var SHEET_ORDER = DATA.slice();
(function(){
  for(var i=SHEET_ORDER.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=SHEET_ORDER[i]; SHEET_ORDER[i]=SHEET_ORDER[j]; SHEET_ORDER[j]=t;
  }
})();
var activeCats={}, sortCol=null, sortDir=1;
function sheetBodyHTML(){
  return ''
    + '<div class="sheet-toolbar">'
    +   '<input type="text" id="search" placeholder="search&hellip;" oninput="renderSheet()">'
    +   '<span class="sheet-filters" id="sheet-filters"></span>'
    + '</div>'
    + '<table><thead><tr>'
    +   '<th onclick="sortSheet(\'label\')">Site <span id="arr">▲</span></th>'
    +   '<th>Category</th><th>Subcategory</th>'
    + '</tr></thead><tbody id="sheet-tbody"></tbody></table>';
}
function openSheet(){
  var w = makeWindow('sheet', 'bookmarked.xls', sheetBodyHTML(),
                     {width:680, height:480, bodyClass:'sheet-body', count:''});
  var f=w.querySelector('#sheet-filters');
  if(f && !f.dataset.built){
    CATS.forEach(function(c){
      var b=document.createElement('button');
      b.className='cat-pill'; b.textContent=c.name; b.setAttribute('data-cat',c.name);
      b.onclick=function(){ toggleCat(c.name); };
      f.appendChild(b);
    });
    f.dataset.built='1';
  }
  renderSheet();
}
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
  var arr=document.getElementById('arr'); if(arr) arr.textContent = sortDir===1?'▲':'▼';
  renderSheet();
}
function sheetFiltered(){
  var si=document.getElementById('search');
  var q=si?si.value.toLowerCase():'';
  var cats=Object.keys(activeCats);
  return SHEET_ORDER.filter(function(d){
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
  var tb=document.getElementById('sheet-tbody'); if(!tb) return;
  var f=sheetFiltered();
  var sc=openWindows['sheet']; if(sc){ var tc=sc.querySelector('.title-count'); if(tc) tc.textContent=f.length+' of '+DATA.length; }
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
