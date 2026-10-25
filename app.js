
'use strict';
const THEMES={
 olive:{paper:'#F4EEDF',primary:'#66705A',second:'#6B3E47',neutral:'#A7A59B',ink:'#2D2623'},
 petrol:{paper:'#F3F1EC',primary:'#4F6A6D',second:'#B5775C',neutral:'#C9B7A2',ink:'#272A2D'},
 nocturne:{paper:'#14262B',primary:'#294C56',second:'#A1644B',neutral:'#595955',ink:'#EDE5DA'}
};
const PRODUCTS=[
 {id:'24412',name:'Стул Локи / Loki',cat:'Стулья',col:'',mat:'Дерево',price:14780,sku:'24412',dims:'51 × 44 × 86 см',material:'Вяз, ротанг',finish:'Чёрный',photo:'./assets/products/24412.webp',source:'https://secretdemaison.ru/products/stul-loki-modxmscb2895-derevo-vyaz_rotang-51h44h86-sm-chernyiy.html',desc:'Стул с каркасом из вяза и деталями из ротанга. Демонстрация понятной карточки с отделкой, размерами, ценой и количеством.'},
 {id:'19215',name:'Тумба Ривьера / Riviera',cat:'Тумбы',col:'Riviera',mat:'Дерево',price:39200,sku:'19215',dims:'50 × 40 × 70 см',material:'Массив манго',finish:'Античный белый / белый',photo:'./assets/products/19215.webp',source:'https://secretdemaison.ru/products/tumba-secret-de-maison-riviera--modnsd001-derevo-mango-50x40x70-sm-antique-white_white-wash0.html',desc:'Тумба из массива манго, коллекция Riviera. Один предмет доступен через товарную категорию и через страницу коллекции.'},
 {id:'13167',name:'Кресло Осло / Oslo',cat:'Кресла',col:'Maison',mat:'Ткань',price:38220,sku:'13167',dims:'97 × 95 × 83 см',material:'Массив берёзы, вельвет',finish:'Тёмно-синий',photo:'./assets/products/13167.webp',source:'https://secretdemaison.ru/products/kreslo-secret-de-maison-oslo-mod-5380-20c-derevo-bereza-tkan-vel-vet-97-95-83-temno-siniy.html',desc:'Кресло из коллекции Maison с мягкой обивкой. Пример сочетания категории «Кресла» и коллекционной навигации.'},
 {id:'24405',name:'Стул Балдур / Baldur',cat:'Стулья',col:'',mat:'Дерево',price:16580,sku:'24405',dims:'49 × 52 × 76,5 см',material:'Вяз, льняная ткань',finish:'Чёрный / чёрный лён',photo:'./assets/products/24405.webp',source:'https://secretdemaison.ru/products/stul-baldur-modxmscb2921d-derevo-vyaz_tkan-len-49h52h765-sm-chernyiy_chernyiy-len.html',desc:'Стул из массива вяза с льняной обивкой. Для прототипа используется изображение из публичной карточки этого артикула.'},
 {id:'12828',name:'Диван Ретро / Retro',cat:'Диваны',col:'',mat:'Дерево',price:60450,sku:'12828',dims:'112,5 × 77 × 85 см',material:'Вяз',finish:'Груша №3',photo:'./assets/products/12828.webp',source:'https://secretdemaison.ru/products/divan-secret-de-maison-retro-mod-cd5021.html',desc:'Небольшой диван из вяза в ретро-стилистике. Для прототипа используется изображение из публичной карточки этого артикула.'}
];
const COLLECTIONS={
 Riviera:{title:'Riviera / Ривьера',sub:'Традиции средиземноморской мебели',text:'Серия из массива манго с характерной патиной и светлой отделкой. При переходе к товарам подборка сохраняет связь с коллекцией.'},
 Maison:{title:'Maison / Мэзон',sub:'Мягкая мебель для спокойного дома',text:'Мягкие формы, тактильная обивка и домашний комфорт. Покупатель может открыть коллекцию или сразу категорию «Кресла».'},
 Naturwood:{title:'Naturwood / Натурвуд',sub:'Красота натуральной акации',text:'Массив акации, выразительный рисунок древесины и сдержанные формы. Для SEO коллекция может иметь собственное уникальное содержимое.'}
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const rub=n=>new Intl.NumberFormat('ru-RU').format(Number(n)||0)+' ₽';
let state={theme:'olive',view:'home',cat:'Все',col:'Все',mat:'Все',sort:'default',chosen:'24412',collection:'Riviera',cart:{}};
try{const prev=JSON.parse(localStorage.getItem('sm-demo-state')||'null');if(prev&&typeof prev==='object'){state.theme=THEMES[prev.theme]?prev.theme:'olive';state.cart=prev.cart&&typeof prev.cart==='object'?prev.cart:{}}}catch(e){}
function save(){try{localStorage.setItem('sm-demo-state',JSON.stringify({theme:state.theme,cart:state.cart}))}catch(e){}}
function applyTheme(){
 const c=THEMES[state.theme];
 $('#site').setAttribute('data-theme',state.theme);
 for(const [k,v] of Object.entries(c))$('#site').style.setProperty('--'+k,v);
 $$('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===state.theme)));
 save();
}
function photo(p,cls=''){
 const alt=p.name.replaceAll('"','&quot;');
 const fallback='<span class="fallback">'+p.name+'<br><span class="small">Фотография уточняется</span></span>';
 return '<div class="photo '+cls+(p.photo?'':' fault')+'">'+(p.photo?'<img loading="lazy" referrerpolicy="no-referrer" src="'+p.photo+'" alt="'+alt+'">':'')+fallback+'</div>';
}
function productCard(p){
 return '<article class="product-card">'+
 photo(p)+
 '<div class="meta">'+p.cat+(p.col?' · '+p.col:'')+'</div>'+
 '<button class="name" data-open-product="'+p.id+'" type="button">'+p.name+'</button>'+
 '<div class="price">'+rub(p.price)+'</div><div class="small muted">Арт. '+p.sku+' · демо-цена</div>'+
 '</article>';
}
function cardsTo(selector,list){$(selector).innerHTML=list.length?list.map(productCard).join(''):'<p>По выбранным параметрам товаров нет. Попробуйте другой фильтр.</p>'}
function go(view){
 state.view=view;$$('[data-view]').forEach(s=>s.hidden=s.dataset.view!==view);
 $$('.menu [data-go]').forEach(x=>{if(x.dataset.go===view)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});
 if(view==='catalog')renderCatalog();
 if(view==='collections')renderCollections();
 if(view==='product')renderProduct();
 if(view==='cart')renderCart();
 document.title=(view==='home'?'Secret de Maison':{catalog:'Каталог',collections:'Коллекции',product:'Карточка товара',journal:'Журнал',cart:'Корзина',concept:'Концепция'}[view]+' — Secret de Maison')+' · демонстрация';
 window.scrollTo({top:0,behavior:'instant'});
}
function renderFeatured(){cardsTo('#featuredGrid',PRODUCTS.slice(0,4))}
function renderFilters(){
 const entries=[
  ['#catFilters','cat',['Все','Стулья','Кресла','Тумбы','Диваны']],
  ['#colFilters','col',['Все','Riviera','Maison']],
  ['#matFilters','mat',['Все','Дерево','Ткань']]
 ];
 for(const [sel,key,values] of entries){
 $(sel).innerHTML=values.map(value=>'<button type="button" class="chip'+(state[key]===value?' selected':'')+'" data-filter="'+key+'" data-value="'+value+'" aria-pressed="'+(state[key]===value)+'">'+value+'</button>').join('');
 }
}
function filtered(){
 let list=PRODUCTS.filter(p=>(state.cat==='Все'||state.cat===p.cat)&&(state.col==='Все'||state.col===p.col)&&(state.mat==='Все'||state.mat===p.mat));
 if(state.sort==='low')list=list.slice().sort((a,b)=>a.price-b.price);
 if(state.sort==='high')list=list.slice().sort((a,b)=>b.price-a.price);
 return list;
}
function renderCatalog(){renderFilters();const list=filtered();$('#resultCount').textContent=list.length+' '+(list.length===1?'предмет':'предметов')+' в подборке';cardsTo('#catalogGrid',list);$('#sortSelect').value=state.sort}
function renderCollections(){
 $('#collectionTiles').innerHTML=Object.keys(COLLECTIONS).filter(key=>PRODUCTS.some(p=>p.col===key)).map(key=>'<button type="button" data-choose-collection="'+key+'" aria-pressed="'+(key===state.collection)+'"><div class="collection-box" style="border:'+(key===state.collection?'2px solid var(--second)':'1px solid var(--line)')+'"><div><p class="kicker">'+COLLECTIONS[key].sub+'</p><h3>'+COLLECTIONS[key].title+'</h3></div></div></button>').join('');
 const selected=COLLECTIONS[state.collection];
 $('#collectionLead').innerHTML='<h2>'+selected.title+'</h2><p>'+selected.text+'</p><div class="small muted">Товары коллекции · демонстрационная выборка</div>';
 cardsTo('#collectionGrid',PRODUCTS.filter(p=>p.col===state.collection));
}
function renderProduct(){
 const p=PRODUCTS.find(x=>x.id===state.chosen)||PRODUCTS[0];
 $('#detailImage').innerHTML=photo(p,'detail-photo');
 $('#detailBreadcrumb').textContent=p.cat+' / '+p.name;
 $('#detailCategory').textContent=p.cat+(p.col?' · '+p.col:'');
 $('#detailName').textContent=p.name;
 $('#detailSku').textContent='Артикул '+p.sku+' · источник: действующий каталог';
 $('#detailPrice').textContent=rub(p.price)+' · демо';
 $('#detailSpecs').innerHTML=[
 ['Материал',p.material],['Отделка',p.finish],['Размеры',p.dims],['Коллекция',p.col||'Без подтверждённой коллекции']
 ].map(([a,b])=>'<div class="spec-row"><span>'+a+'</span><span>'+b+'</span></div>').join('');
 $('#detailText').textContent=p.desc;
 $('#detailLong').innerHTML='Предмет из публичного ассортимента Secret de Maison. Для реального запуска фото, стоимость, остатки, материалы и все варианты исполнения необходимо сверить с актуальными товарными данными. <a href="'+p.source+'" target="_blank" rel="noopener">Открыть источник </a>';
 $('#productQty').value='1';$('#productFeedback').textContent='';
}
function openProduct(id){if(!PRODUCTS.some(p=>p.id===id))return;state.chosen=id;go('product')}
function count(){return Object.values(state.cart).reduce((sum,n)=>sum+(Number(n)||0),0)}
function total(){return PRODUCTS.reduce((sum,p)=>sum+p.price*(Number(state.cart[p.id])||0),0)}
function badge(){$('#cartBadge').textContent=count()}
function setCartQty(id,qty,rerender=true){
 if(!PRODUCTS.some(p=>p.id===id))return;
 const n=Math.min(999,Math.max(0,Math.trunc(Number(qty)||0)));
 if(n===0)delete state.cart[id];else state.cart[id]=n;
 save();badge();if(rerender)renderCart();else renderCartTotals();
}
function addToCart(){
 const qty=Math.min(999,Math.max(1,Math.trunc(Number($('#productQty').value)||1)));
 const current=Number(state.cart[state.chosen])||0;
 setCartQty(state.chosen,Math.min(999,current+qty),false);
 $('#productFeedback').textContent='Добавлено '+qty+' шт. в демонстрационную корзину. Можно проверить сумму и количество.';
}
function renderCartTotals(){
 $('#cartUnits').textContent=count();
 $('#cartTotal').textContent=rub(total());
 $$('[data-row-total]').forEach(el=>{const p=PRODUCTS.find(x=>x.id===el.dataset.rowTotal);if(p)el.textContent=rub(p.price*(Number(state.cart[p.id])||0))});
}
function renderCart(){
 const rows=PRODUCTS.filter(p=>state.cart[p.id]>0);
 $('#cartItems').innerHTML=rows.length?rows.map(p=>'<div class="cart-row">'+
 photo(p)+
 '<div><div class="cart-name">'+p.name+'</div><div class="small muted">Арт. '+p.sku+' · '+rub(p.price)+' за шт.</div>'+
 '<div class="stepper" style="width:max-content;margin-top:10px"><button type="button" aria-label="Уменьшить количество" data-cart-step="'+p.id+'" data-delta="-1">−</button>'+
 '<input type="number" inputmode="numeric" min="1" max="999" aria-label="Количество '+p.name+'" data-cart-input="'+p.id+'" value="'+state.cart[p.id]+'">'+
 '<button type="button" aria-label="Увеличить количество" data-cart-step="'+p.id+'" data-delta="1">+</button></div></div>'+
 '<div class="pricebox"><div class="cart-price" data-row-total="'+p.id+'">'+rub(p.price*state.cart[p.id])+'</div><button type="button" class="remove" data-remove="'+p.id+'">Убрать</button></div></div>').join(''):'<div class="empty"><h3>Пока пусто</h3><p>Добавьте мебель из каталога или нажмите на пример расчёта справа.</p><button class="button" data-go="catalog">Перейти в каталог </button></div>';
 renderCartTotals();
}
document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement){const ph=e.target.closest('.photo');if(ph)ph.classList.add('fault')}},true);
document.addEventListener('click',e=>{
 const theme=e.target.closest('[data-theme]');
 if(theme){state.theme=theme.dataset.theme;applyTheme();return}
 const flt=e.target.closest('[data-filter]');
 if(flt){state[flt.dataset.filter]=flt.dataset.value;renderCatalog();return}
 const reset=e.target.closest('[data-reset]');
 if(reset){state.cat='Все';state.col='Все';state.mat='Все';renderCatalog();return}
 const col=e.target.closest('[data-choose-collection]');
 if(col){state.collection=col.dataset.chooseCollection;renderCollections();return}
 const open=e.target.closest('[data-open-product]');
 if(open){openProduct(open.dataset.openProduct);return}
 const goEl=e.target.closest('[data-go]');
 if(goEl){if(goEl.dataset.category){state.cat=goEl.dataset.category;state.col='Все';state.mat='Все'}go(goEl.dataset.go);return}
 const step=e.target.closest('[data-quantity]');
 if(step){$('#productQty').value=String(Math.min(999,Math.max(1,(Number($('#productQty').value)||1)+Number(step.dataset.quantity))));return}
 const cs=e.target.closest('[data-cart-step]');
 if(cs){const id=cs.dataset.cartStep;setCartQty(id,(Number(state.cart[id])||0)+Number(cs.dataset.delta));return}
 const rm=e.target.closest('[data-remove]');
 if(rm){setCartQty(rm.dataset.remove,0);return}
 const dm=e.target.closest('[data-demo]');
 if(dm){state.cart['24412']=5;save();badge();go('cart');return}
});
document.addEventListener('input',e=>{
 const x=e.target.closest('[data-cart-input]');
 if(x){const n=Number(x.value);if(Number.isInteger(n)&&n>=1&&n<=999)setCartQty(x.dataset.cartInput,n,false)}
});
document.addEventListener('change',e=>{
 if(e.target.id==='sortSelect'){state.sort=e.target.value;renderCatalog();return}
 const x=e.target.closest('[data-cart-input]');
 if(x){setCartQty(x.dataset.cartInput,Math.max(1,Number(x.value)||1),true)}
});
$('#productQty').addEventListener('change',e=>{e.target.value=Math.min(999,Math.max(1,Math.floor(Number(e.target.value)||1)))});
$('#addToCart').addEventListener('click',addToCart);
$('#cartDemoButton').addEventListener('click',()=>{state.cart['24412']=5;save();badge();renderCart()});
applyTheme();renderFeatured();badge();go('home');
