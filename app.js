// ── bookmarked app.js ──
// Reads DATA, PAIRS, TAG_DOM, ALL_TAGS, FLEX_VALUES, ROW_HEIGHTS, ROWS_CFG from data.js

var CAT_CFG = {
  'Design':              {bg:'#FDDEDE',text:'#9E3C3C',border:'#f5c4c4'},
  'Tools':               {bg:'#FEF3D7',text:'#9A6D1F',border:'#f5e3b0'},
  'Learning & Community':{bg:'#E8DEEE',text:'#6B3E8A',border:'#d9c8e8'},
  'Collaborate':         {bg:'#D0EDE8',text:'#1A6860',border:'#b0ddd6'},
  'Pass Time':           {bg:'#D3E5EF',text:'#1E5F82',border:'#b8d5e5'}
};

// precompute tags per category
var catTagCounts = {};
Object.keys(CAT_CFG).forEach(function(c){ catTagCounts[c] = {}; });
DATA.forEach(function(b){
  b.cats.forEach(function(c){
    b.tags.forEach(function(t){
      if(catTagCounts[c]) catTagCounts[c][t] = (catTagCounts[c][t]||0)+1;
    });
  });
});

function catSlug(c){ return c.replace(/[ &]/g,''); }

// ── EXPLORE ──
var selectedCat = null, exActiveTag = null;

ROWS_CFG.forEach(function(row, ri){
  var rowEl = document.getElementById(ri===0 ? 'ex-row-top' : 'ex-row-bottom');
  row.forEach(function(cat){
    var cfg = CAT_CFG[cat];
    var box = document.createElement('div');
    box.className = 'cat-box';
    box.id = 'box-' + catSlug(cat);
    box.style.background = cfg.bg;
    box.style.color      = cfg.text;
    box.style.height     = ROW_HEIGHTS[cat] + 'px';
    box.style.flex       = FLEX_VALUES[cat];

    var info = document.createElement('div');
    info.className = 'cat-box-info';
    var n = 0;
    DATA.forEach(function(b){ if(b.cats.indexOf(cat)>=0) n++; });
    info.innerHTML = '<div class="cat-box-name">'+cat+'</div><div class="cat-box-count">'+n+' sites</div>';

    var tc = document.createElement('div');
    tc.className = 'cat-box-tags';
    Object.keys(catTagCounts[cat]).sort().forEach(function(tag){
      var btn = document.createElement('button');
      btn.className = 'box-tag';
      btn.textContent = tag;
      btn.style.borderColor = cfg.border;
      btn.style.color       = cfg.text;
      btn.setAttribute('data-tag', tag);
      btn.onclick = function(e){ e.stopPropagation(); selectExTag(tag); };
      tc.appendChild(btn);
    });

    box.appendChild(tc);
    box.appendChild(info);
    box.onclick = function(){ selectCat(cat); };
    rowEl.appendChild(box);
  });
});

function selectCat(cat){
  if(selectedCat===cat){
    selectedCat=null; exActiveTag=null;
    document.querySelectorAll('.cat-box').forEach(function(b){ b.classList.remove('selected'); });
    document.getElementById('ex-sites-panel').style.display='none';
    return;
  }
  selectedCat=cat; exActiveTag=null;
  document.querySelectorAll('.cat-box').forEach(function(b){ b.classList.remove('selected'); });
  document.querySelectorAll('.box-tag').forEach(function(b){ b.classList.remove('active-box-tag'); });
  document.getElementById('box-'+catSlug(cat)).classList.add('selected');
  document.getElementById('ex-sites-panel').style.display='none';
}

function selectExTag(tag){
  if(exActiveTag===tag){
    exActiveTag=null;
    document.querySelectorAll('.box-tag').forEach(function(b){ b.classList.remove('active-box-tag'); });
    document.getElementById('ex-sites-panel').style.display='none';
    return;
  }
  exActiveTag=tag;
  document.querySelectorAll('.box-tag').forEach(function(b){
    b.classList.toggle('active-box-tag', b.getAttribute('data-tag')===tag);
  });
  var sites = DATA.filter(function(b){ return b.tags.indexOf(tag)>=0; });
  sites.sort(function(a,b){ return a.label<b.label?-1:1; });
  renderChips(sites, document.getElementById('ex-sites-cloud'));
  document.getElementById('ex-active-tag').textContent = tag;
  document.getElementById('ex-sites-panel').style.display = 'block';
  document.getElementById('ex-sites-panel').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── TAGS VIEW ──
var activeTvTags = {};
var tvCloud = document.getElementById('tv-cloud');
ALL_TAGS.forEach(function(tag){
  var slug = catSlug(TAG_DOM[tag]||'Design');
  var btn = document.createElement('button');
  btn.className = 'tv-tag tv-'+slug;
  btn.textContent = tag;
  btn.setAttribute('data-tag', tag);
  btn.onclick = function(){ toggleTvTag(tag); };
  tvCloud.appendChild(btn);
});

function toggleTvTag(tag){
  activeTvTags[tag] ? delete activeTvTags[tag] : (activeTvTags[tag]=true);
  document.querySelectorAll('.tv-tag').forEach(function(b){
    b.classList.toggle('active-tv-tag', !!activeTvTags[b.getAttribute('data-tag')]);
  });
  renderTvSites();
}

function renderTvSites(){
  var sel = Object.keys(activeTvTags);
  var panel = document.getElementById('tv-sites-panel');
  if(!sel.length){ panel.style.display='none'; return; }
  var seen={}, sites=[];
  DATA.forEach(function(b){
    if(!seen[b.url] && b.tags.some(function(t){ return activeTvTags[t]; })){
      seen[b.url]=true; sites.push(b);
    }
  });
  sites.sort(function(a,b){ return a.label<b.label?-1:1; });
  document.getElementById('tv-count').textContent = '('+sites.length+')';
  document.getElementById('tv-active-label').textContent = sel.join(', ');
  renderChips(sites, document.getElementById('tv-sites-cloud'));
  panel.style.display = 'block';
}

// ── SHARED ──
function renderChips(sites, el){
  el.innerHTML = '';
  sites.forEach(function(b){
    var a = document.createElement('a');
    a.className = 'site-chip';
    a.href = b.url; a.target='_blank'; a.rel='noopener'; a.title=b.title;
    a.textContent = b.label;
    var cfg = CAT_CFG[b.cats[0]]; if(cfg) a.style.borderColor=cfg.border;
    el.appendChild(a);
  });
}

// ── VIEW TOGGLE + CLEAR ──
var currentView = 'explore';

function setView(v){
  currentView = v;
  ['explore','tags','table'].forEach(function(n){
    document.getElementById('view-'+n).style.display = n===v ? 'block' : 'none';
    document.getElementById('btn-'+n).classList.toggle('active', n===v);
  });
}

function clearCurrent(){
  if(currentView==='explore'){
    selectedCat=null; exActiveTag=null;
    document.querySelectorAll('.cat-box').forEach(function(b){ b.classList.remove('selected'); });
    document.querySelectorAll('.box-tag').forEach(function(b){ b.classList.remove('active-box-tag'); });
    document.getElementById('ex-sites-panel').style.display='none';
  } else if(currentView==='tags'){
    activeTvTags={};
    document.querySelectorAll('.tv-tag').forEach(function(b){ b.classList.remove('active-tv-tag'); });
    document.getElementById('tv-sites-panel').style.display='none';
    document.getElementById('tv-count').textContent='';
  } else {
    activeCats={}; activeTag=null;
    document.getElementById('search').value='';
    document.querySelectorAll('.cat-pill').forEach(function(el){ el.classList.remove('active'); });
    render();
  }
}

setView('explore');

// ── TABLE ──
var activeCats={}, activeTag=null, sortCol='label', sortDir=1;

function toggleCat(cat){
  activeCats[cat] ? delete activeCats[cat] : (activeCats[cat]=true);
  document.querySelectorAll('.cat-pill').forEach(function(p){
    p.classList.toggle('active', !!activeCats[p.getAttribute('data-cat')]);
  });
  render();
}

function toggleTag(tag){ activeTag = activeTag===tag ? null : tag; render(); }

function sortBy(col){
  sortDir = sortCol===col ? -sortDir : 1;
  sortCol = col;
  document.getElementById('arr').innerHTML = sortDir===1 ? '&uarr;' : '&darr;';
  render();
}

function getFiltered(){
  var q = document.getElementById('search').value.toLowerCase();
  var cats = Object.keys(activeCats);
  return DATA.filter(function(b){
    if(cats.length && !b.cats.some(function(c){ return activeCats[c]; })) return false;
    if(activeTag && b.tags.indexOf(activeTag)<0) return false;
    if(q){
      var h = b.title.toLowerCase()+' '+b.label.toLowerCase()+' '+b.tags.join(' ').toLowerCase();
      if(h.indexOf(q)<0) return false;
    }
    return true;
  }).sort(function(a,b){
    var av=(a[sortCol]||'').toLowerCase(), bv=(b[sortCol]||'').toLowerCase();
    return av<bv ? -sortDir : av>bv ? sortDir : 0;
  });
}

function esc(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render(){
  var f = getFiltered();
  document.getElementById('count').textContent = f.length+' of '+DATA.length;
  var tb = document.getElementById('tbody');
  if(!f.length){ tb.innerHTML='<tr><td colspan="3" class="empty">nothing found</td></tr>'; return; }
  var rows='';
  f.forEach(function(b){
    var cats = b.cats.map(function(c){
      return '<span class="row-cat rc-'+catSlug(c)+'">'+esc(c)+'</span>';
    }).join('');
    var tags = b.tags.map(function(t){
      var cls='row-tag'+(activeTag===t?' active-tag':'');
      return '<button class="'+cls+'" data-tag="'+esc(t)+'" onclick="onTagClick(this)">'+esc(t)+'</button>';
    }).join('');
    rows += '<tr>'
      +'<td class="td-domain"><a href="'+esc(b.url)+'" target="_blank" rel="noopener" title="'+esc(b.title)+'">'+esc(b.label)+'</a></td>'
      +'<td><div class="row-cats">'+cats+'</div></td>'
      +'<td><div class="row-tags">'+tags+'</div></td>'
      +'</tr>';
  });
  tb.innerHTML = rows;
}

function onTagClick(btn){ toggleTag(btn.getAttribute('data-tag')); }

// ── STUMBLE ──
function stumble(){
  var pool;
  if(currentView==='explore'){
    if(exActiveTag) pool = DATA.filter(function(b){ return b.tags.indexOf(exActiveTag)>=0; });
    else if(selectedCat) pool = DATA.filter(function(b){ return b.cats.indexOf(selectedCat)>=0; });
    else pool = DATA;
  } else if(currentView==='tags'){
    var sel = Object.keys(activeTvTags);
    pool = sel.length ? DATA.filter(function(b){ return b.tags.some(function(t){ return activeTvTags[t]; }); }) : DATA;
  } else {
    pool = getFiltered();
  }
  if(pool.length) window.open(pool[Math.floor(Math.random()*pool.length)].url, '_blank');

}

// ── BOOKMARKLET ──
(function(){
  var pairs = PAIRS;
  function pill(){
    var p = pairs[Math.floor(Math.random()*pairs.length)];
    var ex = document.getElementById('_sc'); if(ex){ ex.remove(); return; }
    var d = document.createElement('div'); d.id='_sc';
    d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#fff;border:1px solid #aaa;padding:10px 14px;font-family:-apple-system,sans-serif;font-size:14px;color:#37352f;cursor:pointer;display:flex;align-items:center;gap:10px;max-width:300px;';
    var s = document.createElement('span');
    s.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    s.textContent = '\uD83D\uDC19 '+p[1];
    var a = document.createElement('span'); a.style.color='#9b9a97'; a.textContent='\u2192';
    d.appendChild(s); d.appendChild(a);
    d.onclick = function(){ window.location.href=p[0]; };
    document.body.appendChild(d);
    setTimeout(function(){ if(d.parentNode) d.remove(); }, 10000);
  }
  var src = '('+pill.toString().replace('pairs', JSON.stringify(pairs))+')()';
  var lnk = document.getElementById('bm-link');
  lnk.href = 'javascript:'+src;
  lnk.addEventListener('click', function(e){
    e.preventDefault();
    alert('Drag to your bookmarks bar \u2014 don\u2019t click here!');
  });
})();

render();
