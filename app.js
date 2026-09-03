// ── bookmarked app.js — System 7 desktop ──
// Reads DATA + CATS from data.js

function slug(s){ return s.replace(/[^A-Za-z]/g,''); }
function hostOf(url){
  try { return new URL(url).hostname; } catch(e){ return url; }
}
function faviconDDG(url){ return 'https://icons.duckduckgo.com/ip3/'+hostOf(url)+'.ico'; }
function faviconGoogle(url){ return 'https://www.google.com/s2/favicons?domain='+hostOf(url)+'&sz=64'; }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// Shared favicon markup: tries DuckDuckGo first, falls back to Google if that fails,
// and shows a plain sunflower emoji if both sources fail to load.
function faviconHTML(url){
  var g = faviconGoogle(url).replace(/"/g,'&quot;');
  return '<span class="favicon-wrap">'
       + '<img src="'+faviconDDG(url)+'" alt="" data-fallback="'+g+'" '
       + 'onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src=this.dataset.fallback;}'
       + 'else{this.classList.add(\'broken\');}">'
       + '</span>';
}

// Flat manila-yellow folder (inline SVG, scalable, flat fill, no outline, no gradients)
var FOLDER_SVG =
  '<svg class="folder-svg" viewBox="0 0 48 40" width="48" height="40" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M3 9 a3 3 0 0 1 3-3 h11 l4 4 h21 a3 3 0 0 1 3 3 v3 H3 Z" fill="#e8b43a"/>'
  + '<path d="M3 13 h42 a2 2 0 0 1 2 2 v20 a3 3 0 0 1-3 3 H4 a3 3 0 0 1-3-3 V15 a2 2 0 0 1 2-2 Z" fill="#ffdf80"/>'
  + '</svg>';

// Subcategories promoted to their own desktop icons (removed from parent folders)
var PROMOTED = [
  { sub:"Colors",   parent:"Design Resources" },
  { sub:"Toolkits", parent:"Tools & Collaborate" }
];
function isPromoted(catName, subName){
  return PROMOTED.some(function(p){ return p.parent===catName && p.sub===subName; });
}


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

// Category folders, with any promoted subcategories placed beside their parent (same row, one column left)
function makeDesktopIcon(x, y, className, glyphHTML, label, onOpen){
  var el = document.createElement('div');
  el.className = 'icon '+className;
  el.innerHTML = '<div class="glyph">'+glyphHTML+'</div><div class="lbl">'+esc(label)+'</div>';
  el.style.left = x+'px';
  el.style.top  = y+'px';
  makeIconDraggable(el, onOpen);
  desktop.appendChild(el);
}

CATS.forEach(function(cat){
  var rowY = nextRightSlot();
  makeDesktopIcon(startX, rowY, 'folder', FOLDER_SVG, cat.name, function(){ openFolder(cat); });
  PROMOTED.filter(function(p){ return p.parent===cat.name; }).forEach(function(p){
    makeDesktopIcon(startX-110, rowY, 'promoted', FOLDER_SVG, p.sub, function(){ openSubcategory(p.sub, p.parent); });
  });
});

// Spreadsheet icon
var sheetIcon = document.createElement('div');
sheetIcon.className='icon';
sheetIcon.innerHTML='<div class="glyph">🔍</div><div class="lbl">shivani\'s bookmarks</div>';
sheetIcon.style.left = startX+'px';
sheetIcon.style.top  = nextRightSlot()+'px';
makeIconDraggable(sheetIcon, openSheet);
desktop.appendChild(sheetIcon);

// Rainbow shuffle icon (top-left)
var shuf = document.createElement('div');
shuf.className='icon icon-stumble';
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

function focusWindow(el){
  el.style.zIndex = ++zTop;
  document.querySelectorAll('.window').forEach(function(w){ w.classList.remove('active'); });
  el.classList.add('active');
}

function makeWindow(key, title, bodyHTML, opts){
  opts = opts || {};
  if(openWindows[key]){            // already open: just focus it
    focusWindow(openWindows[key]);
    return openWindows[key];
  }
  var w = document.createElement('div');
  w.className = 'window';
  var offset = (winCount % 6) * 40;
  w.style.left = (90 + offset) + 'px';
  w.style.top  = (60 + offset) + 'px';
  w.style.width  = (opts.width  || 750) + 'px';
  w.style.height = (opts.height || 530) + 'px';
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
  focusWindow(w);

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
    if(e.target.classList.contains('close-box') || e.target.classList.contains('crumb-back')) return;
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

// Categories with few enough subcategories that grouping doesn't earn its keep —
// these open as one plain grid of every site in the category, no subfolders.
var FLAT_CATEGORIES = ["Learning & Community"];
// Flat categories are otherwise ungrouped, but a few specific subcategories still
// get their own subfolder tile within that flat grid (click to open, same as a
// regular nested category's subfolder — just living inside a mostly-flat one).
var NESTED_EXCEPTIONS = { "Learning & Community": ["Sustainable by Design"] };

// Shared tile-grid renderer: one favicon+title tile per site, used by both
// flat-category windows and subcategory windows.
function filegridHTML(sites){
  var html = '<div class="filegrid">';
  sites.forEach(function(d){
    html += '<a class="file" href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.label)+'">'
         +  faviconHTML(d.url)
         +  '<span class="fname">'+esc(d.title)+'</span></a>';
  });
  html += '</div>';
  return html;
}

// ── FOLDER WINDOW ──
// Flat categories: an ungrouped grid of every site, except any NESTED_EXCEPTIONS
// subs, which appear as a clickable subfolder tile within that same grid instead.
// Nested categories: a grid of subfolder tiles, each opening its own subcategory window.
function folderBodyHTML(cat){
  var sites = DATA.filter(function(d){ return d.cat===cat.name && !isPromoted(cat.name, d.sub); });

  if(FLAT_CATEGORIES.indexOf(cat.name) > -1){
    var nestedSubs = NESTED_EXCEPTIONS[cat.name] || [];
    var flatSites = sites.filter(function(d){ return nestedSubs.indexOf(d.sub) === -1; });
    // Group by sub (in the order subs are declared in CATS) so related sites sit
    // next to each other — an "invisible" grouping with no visible header per group.
    var subOrder = cat.subs.map(function(s){ return s.name; });
    flatSites.sort(function(a, b){ return subOrder.indexOf(a.sub) - subOrder.indexOf(b.sub); });
    var html = '<div class="folder-main"><div class="filegrid">';
    nestedSubs.forEach(function(subName){
      if(!sites.some(function(d){ return d.sub===subName; })) return;
      html += '<div class="subfolder-tile" data-sub="'+esc(subName)+'" data-parent="'+esc(cat.name)+'">'
           +  '<div class="glyph">'+FOLDER_SVG+'</div>'
           +  '<span class="fname">'+esc(subName)+'</span></div>';
    });
    flatSites.forEach(function(d){
      html += '<a class="file" href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.label)+'">'
           +  faviconHTML(d.url)
           +  '<span class="fname">'+esc(d.title)+'</span></a>';
    });
    html += '</div></div>';
    return html;
  }

  var subsWithSites = cat.subs.filter(function(sub){
    return !isPromoted(cat.name, sub.name) && sites.some(function(d){ return d.sub===sub.name; });
  });
  var html = '<div class="folder-main"><div class="filegrid">';
  subsWithSites.forEach(function(sub){
    html += '<div class="subfolder-tile" data-sub="'+esc(sub.name)+'" data-parent="'+esc(cat.name)+'">'
         +  '<div class="glyph">'+FOLDER_SVG+'</div>'
         +  '<span class="fname">'+esc(sub.name)+'</span></div>';
  });
  html += '</div></div>';
  return html;
}

function openFolder(cat){
  var w = makeWindow('folder:'+cat.name, esc(cat.name), folderBodyHTML(cat));
  var isFlat = FLAT_CATEGORIES.indexOf(cat.name) > -1;
  var hasNestedTiles = isFlat && (NESTED_EXCEPTIONS[cat.name] || []).length > 0;
  if(!isFlat || hasNestedTiles) wireFolderIndex(w, cat);
}

function wireFolderIndex(w, cat){
  w.querySelectorAll('.subfolder-tile').forEach(function(t){
    t.addEventListener('click', function(){
      showSubInWindow(w, cat, t.getAttribute('data-sub'));
    });
  });
}

// Swap the open folder window's content in-place to show one subcategory's
// sites, with a clickable breadcrumb back to the subfolder index — no new window.
function showSubInWindow(w, cat, subName){
  var sites = DATA.filter(function(d){ return d.cat===cat.name && d.sub===subName; });
  w.querySelector('.title-text').innerHTML =
    '<span class="crumb-back">'+esc(cat.name)+'</span> \u203a '+esc(subName);
  w.querySelector('.window-body').innerHTML = '<div class="folder-main">'+filegridHTML(sites)+'</div>';
  w.querySelector('.crumb-back').addEventListener('click', function(e){
    e.stopPropagation();
    w.querySelector('.title-text').textContent = cat.name;
    w.querySelector('.window-body').innerHTML = folderBodyHTML(cat);
    wireFolderIndex(w, cat);
  });
}

// ── SUBCATEGORY WINDOW (standalone — used by the Colors/Toolkits desktop icons,
// which have no parent folder window to navigate within) ──
function openSubcategory(subName, parentName){
  var sites = DATA.filter(function(d){ return d.cat===parentName && d.sub===subName; });
  var main = '<div class="folder-main">'+filegridHTML(sites)+'</div>';
  makeWindow('sub:'+subName, esc(subName), main,
             {width:750, height:530});
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
  var w = makeWindow('sheet', 'shivani\'s bookmarks', sheetBodyHTML(),
                     {width:750, height:530, bodyClass:'sheet-body', count:''});
  w.style.left = '120px';  // shift right to avoid covering desktop icons
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
      + '<td class="c-site"><a href="'+esc(d.url)+'" target="_blank" rel="noopener" title="'+esc(d.label)+'">'
      +   faviconHTML(d.url)+esc(d.title)+'</a></td>'
      + '<td><span class="tag-cat cc-'+slug(d.cat)+'">'+esc(d.cat)+'</span></td>'
      + '<td>'+esc(d.sub)+'</td>'
      + '</tr>';
  });
  tb.innerHTML=rows;
}

// ── STUMBLE ──
// URLs to skip when stumbling — sites that open to a signup/login wall rather
// than actual content. Add to this as you notice one; there's no automatic way
// to detect this, so it only grows as you flag them.
var STUMBLE_EXCLUDE = [
];
// Whole subcategories to skip when stumbling (matched against the sub field).
var STUMBLE_EXCLUDE_SUBS = [
  "Make a website, blog"
];
// Whole categories to skip when stumbling (matched against the cat field).
var STUMBLE_EXCLUDE_CATS = [
];
// Categories that should come up more often than others. Each site in a listed
// category gets this many entries in the draw instead of 1 — e.g. 3 means a
// Pass Time site is 3x as likely to be picked as an equivalent non-priority site.
var STUMBLE_PRIORITY_CATS = {
  "Pass Time": 3
};

function stumble(){
  var pool = [];
  DATA.forEach(function(d){
    if(STUMBLE_EXCLUDE.indexOf(d.url) > -1) return;
    if(STUMBLE_EXCLUDE_SUBS.indexOf(d.sub) > -1) return;
    if(STUMBLE_EXCLUDE_CATS.indexOf(d.cat) > -1) return;
    var weight = STUMBLE_PRIORITY_CATS[d.cat] || 1;
    for(var i=0; i<weight; i++) pool.push(d);
  });
  var d = pool[Math.floor(Math.random()*pool.length)];
  window.open(d.url,'_blank');
}

// click empty desktop deselects
desktop.addEventListener('mousedown', function(e){
  if(e.target===desktop || e.target.id==='hint')
    document.querySelectorAll('.icon').forEach(function(n){n.classList.remove('selected');});
});

// mobile notice modal close button
var mobileNoteClose = document.getElementById('mobile-note-close');
if(mobileNoteClose){
  mobileNoteClose.addEventListener('click', function(){
    document.getElementById('mobile-note').style.display = 'none';
  });
}
