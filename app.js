'use strict';
/* The checked assortment lives in products.js. Only palette buttons change themes. */
const THEMES = {
 petrol: {paper:'#F3F1EC',primary:'#4F6A6D',second:'#B5775C',neutral:'#C9B7A2',ink:'#272A2D'},
 olive: {paper:'#F4EEDF',primary:'#66705A',second:'#6B3E47',neutral:'#A7A59B',ink:'#2D2623'}
};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rub = n => new Intl.NumberFormat('ru-RU').format(Number(n)||0)+' ₽';
function itemCount(n) {
 const lastTwo=Math.abs(n)%100,last=lastTwo%10;
 const noun=lastTwo>=11&&lastTwo<=14?'предметов':last===1?'предмет':last>=2&&last<=4?'предмета':'предметов';
 return n+' '+noun;
}
const unique = values => [...new Set(values.filter(Boolean))];
const categories = unique(PRODUCTS.map(p => p.cat));
const materialValues = p => p.mats || [p.mat];
const collectionValues = p => Array.isArray(p.col) ? p.col : [p.col];
const collectionKeys = unique(PRODUCTS.flatMap(collectionValues));
const all = 'Все';
const state = {theme:'petrol',themeChoice:false,view:'home',cat:all,sub:all,col:all,mat:all,sort:'default',chosen:PRODUCTS[0].id,collection:collectionKeys[0],cart:{},galleryIndex:0,returnRoute:'',returnScroll:0};
function normalQty(value, allowZero=false) {
 const number = Math.trunc(Number(value));
 return Number.isFinite(number) ? Math.min(999,Math.max(allowZero ? 0 : 1,number)) : (allowZero ? 0 : 1);
}
try {
 const old = JSON.parse(localStorage.getItem('sm-demo-state') || 'null');
 if (old && typeof old === 'object') {
  // Version 1 wrote the default olive automatically. Only explicit version 2 choices survive.
  if (old.schemaVersion >= 2 && old.themeChoice === true && THEMES[old.theme]) {
   state.theme = old.theme; state.themeChoice = true;
  }
  if (old.cart && typeof old.cart === 'object' && !Array.isArray(old.cart)) {
   for (const [id, qty] of Object.entries(old.cart)) {
    if (/^\d{1,12}$/.test(id) && Number(qty)>0) state.cart[id] = normalQty(qty);
   }
  }
 }
} catch (_) { /* A blocked or malformed localStorage does not prevent browsing. */ }
function save() {
 try { localStorage.setItem('sm-demo-state', JSON.stringify({schemaVersion:2,theme:state.theme,themeChoice:state.themeChoice,cart:state.cart})); } catch (_) {}
}
function applyTheme() {
 const palette = THEMES[state.theme];
 $('#site').setAttribute('data-theme',state.theme);
 for (const [key,value] of Object.entries(palette)) $('#site').style.setProperty('--'+key,value);
 $$('.theme-btn[data-theme]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.theme===state.theme)));
 save();
}
function photo(p, extra='') {
 return '<div class="photo '+extra+'"><img loading="lazy" decoding="async" src="'+escapeHTML(p.photo)+'" alt="'+escapeHTML(p.name+' · артикул '+p.sku)+'"></div>';
}
function categoryPill(p, sub=false) {
 const label = sub ? p.sub : p.cat;
 return label ? '<button type="button" class="category-pill" data-browse-cat="'+escapeHTML(p.cat)+'"'+(sub?' data-browse-sub="'+escapeHTML(p.sub)+'"':'')+'>'+escapeHTML(label)+'</button>' : '';
}
function productCard(p) {
 return '<article class="product-card" data-sku="'+escapeHTML(p.sku)+'">'+
 '<button type="button" class="product-photo-link" data-open-product="'+escapeHTML(p.id)+'" aria-label="Открыть карточку '+escapeHTML(p.name)+'">'+photo(p)+'</button>'+
 '<div class="meta product-pills">'+categoryPill(p)+categoryPill(p,true)+'</div>'+
 '<button class="name" data-open-product="'+escapeHTML(p.id)+'" type="button">'+escapeHTML(p.name)+'</button>'+
 '<div class="price">'+rub(p.price)+'</div><div class="small muted">Арт. '+escapeHTML(p.sku)+' · демо-цена</div></article>';
}
function cardsTo(selector,list) {
 const target = $(selector); if (!target) return;
 target.innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty" role="status"><h3>Ничего не найдено</h3><p>В этой подборке нет товаров с таким сочетанием параметров.</p><button type="button" class="linkish" data-reset="filters">Сбросить фильтры</button></div>';
}
function route(view, values={}) {
 const params = new URLSearchParams();
 for (const [key,value] of Object.entries(values)) if (value && value !== all && !(key==='sort' && value==='default')) params.set(key,value);
 const search=params.toString();
 return '#/'+view+(search ? '?'+search : '');
}
function catalogRoute(overrides={}) {
 return route('catalog',{cat:state.cat,sub:state.sub,col:state.col,mat:state.mat,sort:state.sort,...overrides});
}
function rememberScroll() {
 const scroll=window.scrollY;
 if(history.state?.scroll!==scroll)history.replaceState({...history.state,scroll},'',location.href);
}
function focusSection() {
 const heading=$('[data-view="'+state.view+'"] h1') || $('#main');
 if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
}
function navigate(hash,{replace=false,scroll}={}) {
 if(location.hash===hash){
  if(scroll!==undefined){window.scrollTo({top:scroll,behavior:'instant'});rememberScroll();}
  return;
 }
 const previousView=state.view;
 const targetView=hash.replace(/^#\/?/,'').split('?')[0]||'home';
 const nextScroll=scroll??(targetView===previousView?window.scrollY:0);
 const filter=document.activeElement?.closest('[data-filter]');
 const filterFocus=filter?{key:filter.dataset.filter,value:filter.dataset.value}:null;
 rememberScroll();
 history[replace ? 'replaceState' : 'pushState']({scroll:nextScroll},'',hash);
 readRoute();
 if(previousView!==state.view)focusSection();
 else if(filterFocus){
  const replacement=$$('[data-filter]').find(button=>button.dataset.filter===filterFocus.key&&button.dataset.value===filterFocus.value);
  replacement?.focus({preventScroll:true});
 }
 window.scrollTo({top:nextScroll,behavior:'instant'});
}
function go(view) {
 if (view==='catalog') navigate(catalogRoute());
 else if (view==='collections') navigate(route(view,{collection:state.collection}));
 else navigate(route(view));
}
function readRoute() {
 const raw = location.hash.replace(/^#\/?/,'');
 const [path,query=''] = raw.split('?');
 const params = new URLSearchParams(query);
 let view = path || 'home';
 const validViews = ['home','catalog','categories','category','collections','product','journal','concept','cart'];
 if (!validViews.includes(view)) view='home';
 if (view==='catalog') {
  state.cat=categories.includes(params.get('cat'))?params.get('cat'):all;
  const validSubs=unique(PRODUCTS.filter(p=>state.cat===all||p.cat===state.cat).map(p=>p.sub));
  state.sub=validSubs.includes(params.get('sub'))?params.get('sub'):all;
  state.col=collectionKeys.includes(params.get('col'))?params.get('col'):all;
  const mats=unique(PRODUCTS.flatMap(materialValues));
  state.mat=mats.includes(params.get('mat'))?params.get('mat'):all;
  state.sort=['low','high'].includes(params.get('sort'))?params.get('sort'):'default';
 }
 if (view==='category') {
  state.cat=categories.includes(params.get('cat'))?params.get('cat'):categories[0];
 }
 if (view==='collections') state.collection=collectionKeys.includes(params.get('collection'))?params.get('collection'):collectionKeys[0];
 if (view==='product') {
  const p=PRODUCTS.find(p=>p.id===params.get('id'));
  if (!p) { view='catalog';state.cat=all;state.sub=all;state.col=all;state.mat=all; }
  else {
   state.chosen=p.id; state.galleryIndex=0;
   const back=params.get('back');
   state.returnRoute=back && /^#\/(catalog|category|categories|collections|home|cart)(\?|$)/.test(back) ? back : route('catalog',{cat:p.cat,sub:p.sub});
   state.returnScroll=Number(history.state?.returnScroll)||0;
  }
 }
 state.view=view;
 $$('[data-view]').forEach(section=>section.hidden=section.dataset.view!==view);
 $$('.menu [data-go]').forEach(button=>{
  const active = button.dataset.go===view || (button.dataset.go==='categories' && view==='category');
  if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
 });
 if(view==='catalog')renderCatalog();
 if(view==='categories')renderCategories();
 if(view==='category')renderCategory();
 if(view==='collections')renderCollections();
 if(view==='product')renderProduct();
 if(view==='cart')renderCart();
 const titles={home:'Secret de Maison',catalog:'Каталог',categories:'Категории',category:state.cat,collections:'Редакционные подборки',product:PRODUCTS.find(p=>p.id===state.chosen)?.name,journal:'Журнал',concept:'Идея',cart:'Корзина'};
 document.title=titles[view]+' · Secret de Maison · демонстрация';
}
window.addEventListener('popstate',()=>{
 const previousView=state.view;readRoute();if(previousView!==state.view)focusSection(); window.scrollTo({top:Number(history.state?.scroll)||0,behavior:'instant'});
});
window.addEventListener('hashchange',()=>{
 const previousView=state.view;readRoute();if(previousView!==state.view)focusSection(); window.scrollTo({top:Number(history.state?.scroll)||0,behavior:'instant'});
});
function renderFeatured(){cardsTo('#featuredGrid',PRODUCTS.filter(p=>['25271','25186','20606','20462','25947','10085'].includes(p.id)).slice(0,6))}
function categoryTile(cat) {
 const list=PRODUCTS.filter(p=>p.cat===cat),p=list[0];
 return '<button class="category-tile" type="button" data-browse-cat="'+escapeHTML(cat)+'">'+photo(p)+'<h2>'+escapeHTML(cat)+'</h2><span class="small">'+itemCount(list.length)+'</span></button>';
}
function renderCategories() {
 if ($('#categoryTiles')) $('#categoryTiles').innerHTML=categories.map(categoryTile).join('');
}
function renderCategory() {
 const list=PRODUCTS.filter(p=>p.cat===state.cat);
 const subs=unique(list.map(p=>p.sub));
 if ($('#categoryTitle')) $('#categoryTitle').textContent=state.cat;
 if ($('#categoryIntro')) $('#categoryIntro').textContent=itemCount(list.length)+' в категории'+(subs.length?' · выберите вид мебели':'');
 if ($('#categoryBreadcrumb')) $('#categoryBreadcrumb').innerHTML='<button class="linkish" type="button" data-go="categories">Категории</button><span aria-hidden="true"> / </span><span>'+escapeHTML(state.cat)+'</span>';
 if ($('#subcategoryTiles')) $('#subcategoryTiles').innerHTML=subs.map(sub=>{
  const selected=list.filter(p=>p.sub===sub);
  return '<button class="category-tile" type="button" data-browse-cat="'+escapeHTML(state.cat)+'" data-browse-sub="'+escapeHTML(sub)+'">'+photo(selected[0])+'<h2>'+escapeHTML(sub)+'</h2><span class="small">'+itemCount(selected.length)+'</span></button>';
 }).join('');
 cardsTo('#categoryGrid',subs.length?[]:list);
 if ($('#categoryGrid')) $('#categoryGrid').hidden=subs.length>0;
}
function matches(p, values=state, except='') {
 return (except==='cat'||values.cat===all||p.cat===values.cat) &&
 (except==='sub'||values.sub===all||p.sub===values.sub) &&
 (except==='col'||values.col===all||collectionValues(p).includes(values.col)) &&
 (except==='mat'||values.mat===all||materialValues(p).includes(values.mat));
}
function filtered() {
 let list=PRODUCTS.filter(p=>matches(p));
 if(state.sort==='low')list=list.slice().sort((a,b)=>a.price-b.price);
 if(state.sort==='high')list=list.slice().sort((a,b)=>b.price-a.price);
 return list;
}
function renderFilters() {
 const subs=unique(PRODUCTS.filter(p=>state.cat===all||p.cat===state.cat).map(p=>p.sub));
 const entries=[['#catFilters','cat',categories],['#subFilters','sub',subs],['#colFilters','col',collectionKeys],['#matFilters','mat',unique(PRODUCTS.flatMap(materialValues))]];
 for(const [selector,key,values] of entries) {
  const target=$(selector); if(!target)continue;
  target.innerHTML=[all,...values].map(value=>{
   const countValues={...state,[key]:value,...(key==='cat'?{sub:all}:{})};
   const count=PRODUCTS.filter(p=>matches(p,countValues,key) && (value===all || (key==='mat'?materialValues(p).includes(value):key==='col'?collectionValues(p).includes(value):p[key]===value))).length;
   const title=key==='col'&&value!==all?(COLLECTIONS[value]?.title||value):value;
   return '<button type="button" class="chip'+(state[key]===value?' selected':'')+'" data-filter="'+key+'" data-value="'+escapeHTML(value)+'" aria-pressed="'+(state[key]===value)+'">'+escapeHTML(title)+' <span class="facet-count">'+count+'</span></button>';
  }).join('');
 }
 if($('#subFacet'))$('#subFacet').hidden=subs.length===0;
}
function renderCatalog() {
 renderFilters();const list=filtered();
 $('#resultCount').textContent=list.length+' из '+PRODUCTS.length+' предметов';
 if($('#catalogTitle'))$('#catalogTitle').textContent=state.sub!==all?state.sub:state.cat!==all?state.cat:'Каталог мебели';
 if($('#catalogBreadcrumb'))$('#catalogBreadcrumb').innerHTML='<button type="button" class="linkish" data-go="categories">Категории</button>'+ (state.cat!==all?'<span aria-hidden="true"> / </span><button class="linkish" type="button" data-browse-cat="'+escapeHTML(state.cat)+'">'+escapeHTML(state.cat)+'</button>':'')+(state.sub!==all?'<span aria-hidden="true"> / </span><span>'+escapeHTML(state.sub)+'</span>':'');
 cardsTo('#catalogGrid',list);$('#sortSelect').value=state.sort;
}
function renderCollections() {
 $('#collectionTiles').innerHTML=collectionKeys.map(key=>{
  const data=COLLECTIONS[key]||{title:key,sub:'Редакционная подборка'};
  const list=PRODUCTS.filter(p=>collectionValues(p).includes(key));
  return '<button type="button" data-choose-collection="'+escapeHTML(key)+'" aria-pressed="'+(key===state.collection)+'"><div class="collection-box"><div><p class="kicker">Редакционная подборка · '+itemCount(list.length)+'</p><h3>'+escapeHTML(data.title)+'</h3><p>'+escapeHTML(data.sub||'')+'</p></div></div></button>';
 }).join('');
 const selected=COLLECTIONS[state.collection]||{title:state.collection,text:''};
 $('#collectionLead').innerHTML='<h2>'+escapeHTML(selected.title)+'</h2><p>'+escapeHTML(selected.text||'')+'</p><div class="small muted">Независимая редакционная подборка, не официальная коллекция бренда.</div><button type="button" class="linkish" data-collection-catalog="'+escapeHTML(state.collection)+'">Открыть с фильтрами</button>';
 cardsTo('#collectionGrid',PRODUCTS.filter(p=>collectionValues(p).includes(state.collection)));
}
const arrowSVG = direction => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="'+(direction<0?'M15 5l-7 7 7 7':'M9 5l7 7-7 7')+'"/></svg>';
function galleryPhotos(p) { return unique(p.photos?.length ? p.photos : [p.photo]); }
function renderGallery() {
 const p=PRODUCTS.find(p=>p.id===state.chosen),photos=galleryPhotos(p);
 state.galleryIndex=(state.galleryIndex+photos.length)%photos.length;
 $('#detailImage').innerHTML='<div class="gallery" data-gallery><div class="gallery-stage" tabindex="0" role="group" aria-label="Фотографии '+escapeHTML(p.name)+'"><div class="photo detail-photo"><img src="'+escapeHTML(photos[state.galleryIndex])+'" alt="'+escapeHTML(p.name+' · артикул '+p.sku+' · фото '+(state.galleryIndex+1)+' из '+photos.length)+'" decoding="async"></div></div>'+
 (photos.length>1?'<div class="gallery-controls"><button type="button" class="gallery-arrow" data-gallery-step="-1" aria-label="Предыдущее фото">'+arrowSVG(-1)+'</button><span class="gallery-indicator" aria-live="polite">'+(state.galleryIndex+1)+' / '+photos.length+'</span><button type="button" class="gallery-arrow" data-gallery-step="1" aria-label="Следующее фото">'+arrowSVG(1)+'</button></div><div class="gallery-thumbs">'+photos.map((src,index)=>'<button type="button" class="gallery-dot'+(index===state.galleryIndex?' selected':'')+'" data-gallery-index="'+index+'" aria-label="Фото '+(index+1)+'" aria-pressed="'+(index===state.galleryIndex)+'"><img loading="lazy" src="'+escapeHTML(src)+'" alt=""></button>').join('')+'</div>':'<p class="small muted gallery-single">1 проверенное фото</p>')+'</div>';
}
function changeGallery(delta,index) {
 const p=PRODUCTS.find(p=>p.id===state.chosen),photos=galleryPhotos(p); if(photos.length<2)return;
 const focused=document.activeElement,wasStage=focused?.classList.contains('gallery-stage');
 const step=focused?.dataset.galleryStep,thumb=focused?.dataset.galleryIndex;
 state.galleryIndex=index===undefined?(state.galleryIndex+delta+photos.length)%photos.length:index;
 renderGallery();
 if(wasStage) $('.gallery-stage').focus({preventScroll:true});
 else if(step) $('[data-gallery-step="'+step+'"]').focus({preventScroll:true});
 else if(thumb!==undefined) $('[data-gallery-index="'+state.galleryIndex+'"]').focus({preventScroll:true});
}
function renderProduct() {
 const p=PRODUCTS.find(p=>p.id===state.chosen);
 renderGallery();
 $('#detailBreadcrumb').innerHTML='<button class="linkish" type="button" data-go="categories">Категории</button><span aria-hidden="true"> / </span><button class="linkish" type="button" data-browse-cat="'+escapeHTML(p.cat)+'">'+escapeHTML(p.cat)+'</button>'+(p.sub?'<span aria-hidden="true"> / </span><button class="linkish" type="button" data-browse-cat="'+escapeHTML(p.cat)+'" data-browse-sub="'+escapeHTML(p.sub)+'">'+escapeHTML(p.sub)+'</button>':'')+'<span aria-hidden="true"> / </span><span>'+escapeHTML(p.name)+'</span>';
 $('#detailCategory').innerHTML=categoryPill(p)+categoryPill(p,true);
 $('#detailName').textContent=p.name;
 $('#detailSku').textContent='Официальный артикул '+p.sku;
 $('#detailPrice').textContent=rub(p.price)+' · демо-цена';
 $('#detailSpecs').innerHTML=[['Материал',p.material],['Исполнение',p.finish],['Размеры',p.dims]].filter(([,v])=>v).map(([label,value])=>'<div class="spec-row"><span>'+escapeHTML(label)+'</span><span>'+escapeHTML(value)+'</span></div>').join('');
 $('#detailText').textContent=p.desc;
 $('#detailLong').innerHTML='Модель и фотографии сверены с официальными источниками. Цена здесь демонстрационная: актуальные стоимость, наличие и условия покупки уточняются у продавца. '+(p.sourceNote?'<span class="source-note">'+escapeHTML(p.sourceNote)+'</span> ':'')+'<a href="'+escapeHTML(p.source)+'" target="_blank" rel="noopener">Официальный источник · арт. '+escapeHTML(p.sku)+'</a>';
 $('#productQty').value='1';$('#productFeedback').textContent='';
}
function openProduct(id) {
 if(!PRODUCTS.some(p=>p.id===id))return;
 const back=state.view==='product'?state.returnRoute:location.hash||'#/home';
 const scroll=state.view==='product'?state.returnScroll:window.scrollY;
 rememberScroll();
 history.pushState({scroll:0,returnScroll:scroll},'',route('product',{id,back}));
 readRoute();focusSection();window.scrollTo({top:0,behavior:'instant'});
}
function count(){return Object.values(state.cart).reduce((sum,n)=>sum+n,0)}
function total(){return PRODUCTS.reduce((sum,p)=>sum+p.price*(state.cart[p.id]||0),0)}
function badge(){$('#cartBadge').textContent=count()}
function setCartQty(id,qty,rerender=true) {
 if(!/^\d{1,12}$/.test(id))return;
 const n=normalQty(qty,true);
 if(n===0)delete state.cart[id];else state.cart[id]=n;
 save();badge();if(rerender)renderCart();else renderCartTotals();
}
function addToCart() {
 const qty=normalQty($('#productQty').value);$('#productQty').value=qty;
 const before=state.cart[state.chosen]||0;
 setCartQty(state.chosen,before+qty,false);
 const added=state.cart[state.chosen]-before;
 $('#productFeedback').textContent=added>0?'Добавлено в демонстрационную корзину: '+added+' шт.':'В корзине уже максимальное количество: 999 шт.';
}
function renderCartTotals() {
 $('#cartUnits').textContent=count();$('#cartTotal').textContent=rub(total());
 $$('[data-row-total]').forEach(el=>{
  const p=PRODUCTS.find(p=>p.id===el.dataset.rowTotal);
  if(p)el.textContent=rub(p.price*(state.cart[p.id]||0));
 });
}
function cartStepper(id,name) {
 return '<div class="stepper"><button type="button" aria-label="Уменьшить количество '+escapeHTML(name)+'" data-cart-step="'+id+'" data-delta="-1">−</button><input type="number" inputmode="numeric" min="1" max="999" aria-label="Количество '+escapeHTML(name)+'" data-cart-input="'+id+'" value="'+state.cart[id]+'"><button type="button" aria-label="Увеличить количество '+escapeHTML(name)+'" data-cart-step="'+id+'" data-delta="1">+</button></div>';
}
function renderCart() {
 const ids=Object.keys(state.cart);
 $('#cartItems').innerHTML=ids.length?ids.map(id=>{
  const p=PRODUCTS.find(p=>p.id===id);
  const name=p?p.name:'Товар из предыдущей версии';
  return '<div class="cart-row'+(p?'':' legacy-row')+'" data-cart-row="'+id+'">'+(p?'<button type="button" class="product-photo-link" data-open-product="'+id+'" aria-label="Открыть '+escapeHTML(name)+'">'+photo(p)+'</button>':'<span class="legacy-sku">Арт. '+id+'</span>')+
  '<div><button type="button" class="cart-name linkish" '+(p?'data-open-product="'+id+'"':'disabled')+'>'+escapeHTML(name)+'</button><div class="small muted">Арт. '+id+' · '+(p?rub(p.price)+' за шт. · демо':'Сохранён из прежней корзины. Демо-цены в новом каталоге нет; в сумму не включён.')+'</div>'+cartStepper(id,name)+'</div>'+
  '<div class="pricebox"><div class="cart-price" data-row-total="'+id+'">'+(p?rub(p.price*state.cart[id]):'Цена не задана')+'</div><button type="button" class="remove" data-remove="'+id+'">Убрать</button></div></div>';
 }).join(''):'<div class="empty"><h3>Пока пусто</h3><p>Выберите предметы в каталоге, чтобы проверить расчёт.</p><button type="button" class="button" data-go="catalog">Перейти в каталог</button></div>';
 renderCartTotals();
}
function demonstrateCart(){const p=PRODUCTS[0];setCartQty(p.id,2,false);if(state.view==='cart')renderCart();else go('cart')}
document.addEventListener('click',event=>{
 const target=event.target instanceof Element?event.target:null;if(!target)return;
 if(target.closest('.skip-link')){
  event.preventDefault();
  const main=$('#main');
  if(main){main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'instant'});}
  return;
 }
 const theme=target.closest('.theme-btn[data-theme]');
 if(theme&&THEMES[theme.dataset.theme]){state.theme=theme.dataset.theme;state.themeChoice=true;applyTheme();return}
 const browse=target.closest('[data-browse-cat]');
 if(browse){
  const cat=browse.dataset.browseCat,sub=browse.dataset.browseSub;
  const subs=unique(PRODUCTS.filter(p=>p.cat===cat).map(p=>p.sub));
  navigate(sub||!subs.length?route('catalog',{cat,sub}):route('category',{cat}));return;
 }
 const filter=target.closest('[data-filter]');
 if(filter){const key=filter.dataset.filter;const values={[key]:filter.dataset.value};if(key==='cat')values.sub=all;navigate(catalogRoute(values));return}
 if(target.closest('[data-reset]')){navigate(route('catalog'));return}
 const collection=target.closest('[data-choose-collection]');
 if(collection){navigate(route('collections',{collection:collection.dataset.chooseCollection}));return}
 const colCatalog=target.closest('[data-collection-catalog]');
 if(colCatalog){navigate(route('catalog',{col:colCatalog.dataset.collectionCatalog}));return}
 const product=target.closest('[data-open-product]');
 if(product){openProduct(product.dataset.openProduct);return}
 if(target.closest('[data-return-catalog]')){navigate(state.returnRoute||catalogRoute(),{scroll:state.returnScroll});return}
 const goButton=target.closest('[data-go]');
 if(goButton){
  if(goButton.dataset.category){const category=goButton.dataset.category;const p=PRODUCTS.find(p=>p.cat===category||p.sub===category);if(p){navigate(p.sub===category?route('catalog',{cat:p.cat,sub:p.sub}):route('category',{cat:p.cat}));return}}
  go(goButton.dataset.go);return;
 }
 const galleryStep=target.closest('[data-gallery-step]');
 if(galleryStep){changeGallery(Number(galleryStep.dataset.galleryStep));return}
 const galleryIndex=target.closest('[data-gallery-index]');
 if(galleryIndex){changeGallery(0,Number(galleryIndex.dataset.galleryIndex));return}
 const quantity=target.closest('[data-quantity]');
 if(quantity){$('#productQty').value=normalQty(Number($('#productQty').value)+Number(quantity.dataset.quantity));return}
 const cartStep=target.closest('[data-cart-step]');
 if(cartStep){setCartQty(cartStep.dataset.cartStep,(state.cart[cartStep.dataset.cartStep]||0)+Number(cartStep.dataset.delta));return}
 const remove=target.closest('[data-remove]');
 if(remove){setCartQty(remove.dataset.remove,0);return}
 if(target.closest('[data-demo]')){demonstrateCart();return}
 if(target.closest('#addToCart')){addToCart();return}
 if(target.closest('#cartDemoButton'))demonstrateCart();
});
document.addEventListener('input',event=>{
 const target=event.target;
 if(target.matches('[data-cart-input]')){
  const n=Number(target.value);if(Number.isInteger(n)&&n>=1&&n<=999)setCartQty(target.dataset.cartInput,n,false);
 }
});
document.addEventListener('change',event=>{
 const target=event.target;
 if(target.id==='sortSelect'){navigate(catalogRoute({sort:target.value}));return}
 if(target.matches('[data-cart-input]')){target.value=normalQty(target.value);setCartQty(target.dataset.cartInput,Number(target.value),false);return}
 if(target.id==='productQty')target.value=normalQty(target.value);
});
document.addEventListener('keydown',event=>{
 if(!event.target.closest('.gallery-stage'))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
  const p=PRODUCTS.find(p=>p.id===state.chosen);if(galleryPhotos(p).length<2)return;
  event.preventDefault();changeGallery(event.key==='ArrowLeft'?-1:1);
 }
});
let swipe=null;
document.addEventListener('touchstart',event=>{
 if(!event.target.closest('.gallery-stage')||event.touches.length!==1){swipe=null;return}
 swipe={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
document.addEventListener('touchend',event=>{
 if(!swipe||!event.changedTouches.length)return;
 const dx=event.changedTouches[0].clientX-swipe.x,dy=event.changedTouches[0].clientY-swipe.y;
 swipe=null;
 if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.5)changeGallery(dx<0?1:-1);
},{passive:true});
document.addEventListener('touchcancel',()=>{swipe=null},{passive:true});
$$('[data-product-image]').forEach(image=>{
 const p=PRODUCTS.find(p=>p.id===image.dataset.productImage);
 if(p){image.src=p.photo;image.alt=p.name+' · артикул '+p.sku;}
});
applyTheme();renderFeatured();badge();readRoute();
